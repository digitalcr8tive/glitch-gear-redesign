import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SITE = "https://www.glitchgear.com";
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = resolve(projectRoot, "data/store.json");

async function getJSON(path) {
  const response = await fetch(`${SITE}${path}`, {
    headers: { "User-Agent": "Glitch Gear redesign catalog sync" },
  });
  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}`);
  }
  return response.json();
}

function textFromHTML(html = "") {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

const [{ products }, { collections }, { pages }] = await Promise.all([
  getJSON("/products.json?limit=250"),
  getJSON("/collections.json?limit=250"),
  getJSON("/pages.json?limit=250"),
]);

const collectionProducts = await Promise.all(
  collections.map(async (collection) => {
    const payload = await getJSON(
      `/collections/${collection.handle}/products.json?limit=250`,
    );
    return [collection.handle, new Set(payload.products.map((product) => product.id))];
  }),
);

const collectionMap = new Map(collectionProducts);
const pageMap = Object.fromEntries(pages.map((page) => [page.handle, page]));
const sizeChartMatch = pageMap["sizing-chart"]?.body_html?.match(
  /src=["'](?:https?:)?([^"']+)["']/i,
);

const normalizedProducts = products
  .map((product) => {
    const variants = product.variants.map((variant) => ({
      id: variant.id,
      title: variant.title,
      price: Number(variant.price),
      compareAtPrice: variant.compare_at_price
        ? Number(variant.compare_at_price)
        : null,
      available: Boolean(variant.available),
      sku: variant.sku || "",
      option1: variant.option1 || "",
      option2: variant.option2 || "",
      option3: variant.option3 || "",
      imageId: variant.featured_image?.id || null,
    }));
    const available = variants.some((variant) => variant.available);
    const prices = variants.map((variant) => variant.price);

    return {
      id: product.id,
      title: product.title,
      handle: product.handle,
      description: textFromHTML(product.body_html),
      descriptionHtml: product.body_html,
      vendor: product.vendor,
      productType: product.product_type || "Gear",
      tags: product.tags,
      publishedAt: product.published_at,
      createdAt: product.created_at,
      updatedAt: product.updated_at,
      available,
      priceMin: Math.min(...prices),
      priceMax: Math.max(...prices),
      collections: collections
        .filter((collection) => collectionMap.get(collection.handle)?.has(product.id))
        .map((collection) => collection.handle),
      options: product.options.map((option) => ({
        name: option.name,
        values: option.values,
      })),
      variants,
      images: product.images.map((image) => ({
        id: image.id,
        src: image.src,
        alt: image.alt || product.title,
        width: image.width,
        height: image.height,
      })),
    };
  })
  .sort((a, b) => Number(b.available) - Number(a.available) || b.id - a.id);

const store = {
  source: SITE,
  shopifyDomain: "the-glitch-store.myshopify.com",
  syncedAt: new Date().toISOString(),
  currency: "USD",
  brand: {
    name: "Glitch Gaming Apparel",
    shortName: "Glitch",
    email: "orders@glitchgear.com",
    about: textFromHTML(pageMap["about-glitch"]?.body_html),
    home: textFromHTML(pageMap.home?.body_html),
    privacyHtml: pageMap["privacy-policy"]?.body_html || "",
    sizeChartImage: sizeChartMatch
      ? `https:${sizeChartMatch[1]}`
      : "https://cdn.shopify.com/s/files/1/0685/0697/files/sizing_chart_2_2048x2048.jpg?17703240649719021471",
    logo:
      "https://www.glitchgear.com/cdn/shop/t/8/assets/logo-retina.png?v=8680649266583781291452150565",
    heroModels: [
      "https://www.glitchgear.com/cdn/shop/t/8/assets/home-slider-slide-2.jpg?v=424452391313802281480387126",
      "https://www.glitchgear.com/cdn/shop/t/8/assets/home-slider-slide-3.jpg?v=124619097523578151281452150560",
      "https://www.glitchgear.com/cdn/shop/t/8/assets/home-slider-slide-4.jpg?v=105692060234987020401452150561",
    ],
  },
  collections: collections
    .filter((collection) => collection.handle !== "frontpage")
    .map((collection) => ({
      id: collection.id,
      title: collection.handle === "watch_dogs" ? "Watch Dogs" : collection.title,
      handle: collection.handle,
      description: textFromHTML(collection.body_html),
      image: collection.image?.src || null,
      productCount: collectionMap.get(collection.handle)?.size || 0,
    }))
    .sort((a, b) => a.title.localeCompare(b.title)),
  products: normalizedProducts,
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(store, null, 2)}\n`);
console.log(
  `Synced ${store.products.length} products and ${store.collections.length} collections to ${outputPath}`,
);
