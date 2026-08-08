const app = document.querySelector("#app");
const cartDialog = document.querySelector("#cart-dialog");
const checkoutDialog = document.querySelector("#checkout-dialog");
const cartItemsRoot = document.querySelector("[data-cart-items]");
const cartFooterRoot = document.querySelector("[data-cart-footer]");
const toastRoot = document.querySelector("[data-toast]");
const nav = document.querySelector("#primary-navigation");
const menuButton = document.querySelector("[data-action='toggle-menu']");
document.querySelector("[data-current-year]").textContent = new Date().getFullYear();
const footerMobileQuery = matchMedia("(max-width: 767px)");
const syncFooterMenus = () => {
  document.querySelectorAll(".footer-menu").forEach((menu) => {
    if (footerMobileQuery.matches) menu.removeAttribute("open");
    else menu.setAttribute("open", "");
  });
};
syncFooterMenus();
footerMobileQuery.addEventListener("change", syncFooterMenus);

let store;
let renderLimit = 36;
let toastTimer;

const state = {
  cart: readLocal("glitch-cart", []),
  wishlist: readLocal("glitch-wishlist", []),
};

app.innerHTML = `
  <div class="loading-screen">
    <div class="loading-indicator">Initializing storefront</div>
  </div>
`;

try {
  const response = await fetch("./data/store.json");
  store = response.ok ? await response.json() : await loadLiveStore();
  bindEvents();
  render();
  renderCart();
} catch (error) {
  console.error(error);
  app.innerHTML = `
    <div class="error-screen">
      <div class="empty-state">
        <span class="status-code">CATALOG OFFLINE</span>
        <h1>Gear data could not load.</h1>
        <p>Serve this folder through a local web server or open the published GitHub Pages site.</p>
        <button class="primary-button" type="button" onclick="location.reload()">Retry catalog</button>
      </div>
    </div>
  `;
}

function bindEvents() {
  window.addEventListener("hashchange", () => {
    renderLimit = 36;
    render();
    closeMenu();
    app.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  });

  document.addEventListener("click", (event) => {
    const actionElement = event.target.closest("[data-action]");
    if (!actionElement) return;
    const { action } = actionElement.dataset;

    if (action === "toggle-menu") toggleMenu();
    if (action === "open-cart") openCart();
    if (action === "close-cart") cartDialog.close();
    if (action === "close-checkout") checkoutDialog.close();
    if (action === "checkout-notice") {
      cartDialog.close();
      checkoutDialog.showModal();
    }
    if (action === "quick-add") quickAdd(actionElement.dataset.handle);
    if (action === "add-product") addSelectedProduct(actionElement.dataset.handle);
    if (action === "toggle-wishlist") toggleWishlist(actionElement.dataset.handle);
    if (action === "scroll-collections") {
      document.querySelector("[data-collection-rail]")?.scrollBy({
        left: Number(actionElement.dataset.direction) * 260,
        behavior: "smooth",
      });
    }
    if (action === "cart-increase") changeQuantity(actionElement.dataset.variant, 1);
    if (action === "cart-decrease") changeQuantity(actionElement.dataset.variant, -1);
    if (action === "cart-remove") removeCartItem(actionElement.dataset.variant);
    if (action === "load-more") {
      renderLimit += 36;
      renderCurrentProductList();
    }
  });

  document.addEventListener("submit", (event) => {
    if (event.target.matches("[data-search-form]")) {
      event.preventDefault();
      const query = new FormData(event.target).get("q")?.toString().trim();
      if (query) location.hash = `#/shop?q=${encodeURIComponent(query)}`;
      return;
    }

    if (event.target.matches("[data-filter-form]")) {
      event.preventDefault();
      applyFilters(event.target);
      return;
    }

    if (event.target.matches("[data-contact-form]")) {
      event.preventDefault();
      const data = new FormData(event.target);
      const subject = encodeURIComponent(data.get("subject") || "Glitch Gear support request");
      const body = encodeURIComponent(
        `Name: ${data.get("name")}\nEmail: ${data.get("email")}\n\n${data.get("message")}`,
      );
      location.href = `mailto:${store.brand.email}?subject=${subject}&body=${body}`;
      showToast("Your email app is opening with the support request.");
    }
  });

  document.addEventListener("change", (event) => {
    if (event.target.matches("[data-filter]")) {
      applyFilters(event.target.form);
    }
    if (event.target.matches("[data-variant-select]")) {
      updateProductSelection(event.target);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav.classList.contains("open")) closeMenu();
  });

  cartDialog.addEventListener("click", (event) => {
    if (event.target === cartDialog) cartDialog.close();
  });
  checkoutDialog.addEventListener("click", (event) => {
    if (event.target === checkoutDialog) checkoutDialog.close();
  });
}

function render() {
  const route = getRoute();
  setActiveNav(route.path);

  if (route.path === "" || route.path === "/") return renderHome();
  if (route.path === "/shop") return renderShop(route.params);
  if (route.path === "/collections") return renderCollections();
  if (route.path.startsWith("/collection/")) {
    return renderCollection(decodeURIComponent(route.path.split("/").pop()));
  }
  if (route.path.startsWith("/product/")) {
    return renderProduct(decodeURIComponent(route.path.split("/").pop()));
  }
  if (route.path === "/size-guide") return renderSizeGuide();
  if (route.path === "/about") return renderAbout();
  if (route.path === "/support") return renderSupport();
  if (route.path === "/contact") return renderContact();
  if (route.path === "/privacy") return renderPrivacy();
  if (route.path === "/wishlist") return renderWishlist();
  return renderNotFound();
}

function renderHome() {
  document.title = "Glitch Gaming Apparel | Wear the Game";
  const bioshockProduct = store.products.find((product) =>
    product.tags.some((tag) => tag.toLowerCase().includes("bioshock")),
  );
  const orderedCollections = [
    collectionByHandle("portal"),
    collectionByHandle("fallout-4"),
    {
      title: "BioShock",
      handle: "bioshock",
      image: bioshockProduct?.images[0]?.src || "",
      href: "#/shop?q=bioshock",
      synthetic: true,
    },
    collectionByHandle("half-life-2"),
    collectionByHandle("gears-of-war"),
    collectionByHandle("left-4-dead-2"),
  ].filter(Boolean);
  const featuredHandles = [
    "aperture-laboratories-hat-black",
    "fallout-4-vault-boy-mascot-tee",
    "half-life-lambda-hat",
    "gears-of-war-crimson-omen-logo-tee",
    "left-4-dead-tee",
  ];
  const featured = featuredHandles
    .map((handle) => productByHandle(handle))
    .filter(Boolean);
  app.innerHTML = `
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero-frame hero-frame-left" aria-hidden="true"></div>
      <div class="hero-model left" role="img" aria-label="Woman wearing a Fallout Vault Boy T-shirt" style="--model-image:url('${escapeAttr(store.brand.heroModels[0])}')"></div>
      <div class="hero-copy">
        <h1 id="hero-title"><span class="hero-line-white">WEAR</span><span class="hero-line-lime">THE GAME.</span></h1>
        <p>Game-inspired apparel for players.<br />Designed to stand out. Made to last.</p>
        <div class="hero-actions">
          <a class="primary-button" href="#/shop">Shop all gear <span aria-hidden="true">→</span></a>
          <a class="secondary-button" href="#/collections">Explore collections</a>
        </div>
      </div>
      <div class="hero-model right" role="img" aria-label="Man wearing a Portal Songbird T-shirt" style="--model-image:url('${escapeAttr(store.brand.heroModels[1])}')"></div>
      <div class="hero-frame hero-frame-right" aria-hidden="true"></div>
      <div class="hero-stat" aria-hidden="true">
        <span>XP +250</span>
        <span>LVL 20</span>
        <div class="xp-meter"></div>
      </div>
    </section>

    <section class="home-collections" aria-labelledby="collections-title">
      <div class="section-header">
        <h2 id="collections-title">Explore iconic collections</h2>
        <a class="section-link" href="#/collections">View all collections →</a>
      </div>
      <div class="collection-carousel">
        <button class="rail-arrow rail-arrow-left" type="button" data-action="scroll-collections" data-direction="-1" aria-label="Scroll collections left">‹</button>
        <div class="collection-rail" data-collection-rail>
          ${orderedCollections.map(homeCollectionCard).join("")}
        </div>
        <button class="rail-arrow rail-arrow-right" type="button" data-action="scroll-collections" data-direction="1" aria-label="Scroll collections right">›</button>
      </div>
    </section>

    <section class="home-drops" aria-labelledby="drops-title">
      <div class="drops-panel">
        <div class="section-header">
          <h2 id="drops-title">Featured drops <span class="new-badge">NEW</span></h2>
        </div>
        <div class="featured-grid">
          ${featured.map((product) => productCard(product, true)).join("")}
        </div>
        <a class="drops-link" href="#/shop?sort=newest">View all new arrivals <span aria-hidden="true">→</span></a>
      </div>
    </section>

    <section class="campaign-banner">
      <h2>ICONIC WORLDS.<br />EVERYDAY GEAR.</h2>
    </section>
  `;
}

function renderShop(params) {
  const query = params.get("q") || "";
  document.title = query
    ? `Search: ${query} | Glitch Gaming Apparel`
    : "Shop All Gear | Glitch Gaming Apparel";
  const heading = query ? `Search: ${escapeHTML(query)}` : "Choose your loadout";

  app.innerHTML = `
    ${pageHero("SHOP / ALL GEAR", heading, "Browse the complete catalog sourced from the current Glitch Gear storefront.")}
    <div class="shop-layout">
      ${filterPanel(params)}
      <section class="shop-results" aria-live="polite">
        <div data-product-list></div>
      </section>
    </div>
  `;
  renderCurrentProductList();
}

function renderCurrentProductList() {
  const root = document.querySelector("[data-product-list]");
  if (!root) return;
  const { params } = getRoute();
  const products = filterProducts(params);
  const visible = products.slice(0, renderLimit);

  root.innerHTML = `
    <div class="results-toolbar">
      <span>${products.length} ${products.length === 1 ? "item" : "items"}</span>
      <span>${params.get("available") === "1" ? "Available gear only" : "Available and archive gear"}</span>
    </div>
    ${products.length ? `<div class="product-grid">${visible.map((product) => productCard(product)).join("")}</div>` : emptyInline("No matching gear", "Try a different title, collection, or category.")}
    ${products.length > visible.length ? `<div class="page-actions" style="margin-top:30px"><button class="secondary-button" type="button" data-action="load-more">Load more gear</button></div>` : ""}
  `;
}

function renderCollections() {
  document.title = "Collections | Glitch Gaming Apparel";
  app.innerHTML = `
    ${pageHero("ARCHIVE / WORLDS", "Choose your universe", "Explore every franchise and catalog collection published by Glitch Gear.")}
    <section class="section-shell">
      <div class="collections-grid">
        ${store.collections.map(collectionCard).join("")}
      </div>
    </section>
  `;
}

function renderCollection(handle) {
  const collection = collectionByHandle(handle);
  if (!collection) return renderNotFound();
  document.title = `${collection.title} Collection | Glitch Gaming Apparel`;
  const products = store.products.filter((product) => product.collections.includes(handle));

  app.innerHTML = `
    ${pageHero("COLLECTION / ACTIVE", escapeHTML(collection.title), escapeHTML(collection.description || `${products.length} products from the current Glitch Gear catalog.`))}
    <section class="section-shell">
      <div class="results-toolbar">
        <span>${products.length} ${products.length === 1 ? "item" : "items"}</span>
        <a class="section-link" href="#/collections">All collections →</a>
      </div>
      ${products.length ? `<div class="product-grid">${products.map((product) => productCard(product)).join("")}</div>` : emptyInline("Collection empty", "No products are currently published in this collection.")}
    </section>
  `;
}

function renderProduct(handle) {
  const product = productByHandle(handle);
  if (!product) return renderNotFound();
  document.title = `${product.title} | Glitch Gaming Apparel`;
  const selectedVariant = product.variants.find((variant) => variant.available) || product.variants[0];
  const images = product.images.length ? product.images : [{ src: "", alt: product.title }];

  app.innerHTML = `
    <div class="product-page">
      <div>
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <a href="#/">Home</a><span>/</span><a href="#/shop">Shop</a><span>/</span><span>${escapeHTML(product.title)}</span>
        </nav>
        <div class="product-gallery">
          ${images.slice(0, 5).map((image) => `
            <figure>
              ${image.src ? `<img src="${escapeAttr(image.src)}" alt="${escapeAttr(image.alt || product.title)}" loading="${image === images[0] ? "eager" : "lazy"}" />` : ""}
            </figure>
          `).join("")}
        </div>
      </div>
      <section class="product-info" aria-labelledby="product-title">
        <span class="status-code">${escapeHTML(product.productType || "Gear")}</span>
        <h1 id="product-title">${escapeHTML(product.title)}</h1>
        <div class="product-price" data-product-price>${formatPrice(selectedVariant.price)}</div>
        <div class="product-availability ${selectedVariant.available ? "" : "sold-out"}" data-product-availability>
          ${selectedVariant.available ? "Available in selected option" : "Selected option is sold out"}
        </div>
        <p class="product-description">${escapeHTML(product.description || "Product details are available through the current Glitch Gear catalog.")}</p>
        <div class="product-controls">
          <label for="variant-select">Choose option</label>
          <select id="variant-select" class="variant-select" data-variant-select data-handle="${escapeAttr(product.handle)}">
            ${product.variants.map((variant) => `
              <option value="${variant.id}" ${variant.id === selectedVariant.id ? "selected" : ""}>
                ${escapeHTML(variant.title)} · ${formatPrice(variant.price)}${variant.available ? "" : " · Sold out"}
              </option>
            `).join("")}
          </select>
        </div>
        <div class="product-actions">
          <button class="primary-button" type="button" data-action="add-product" data-handle="${escapeAttr(product.handle)}" ${selectedVariant.available ? "" : "disabled"}>Add gear to cart</button>
          <button class="secondary-button" type="button" data-action="toggle-wishlist" data-handle="${escapeAttr(product.handle)}" aria-pressed="${isWishlisted(product.handle)}">
            ${isWishlisted(product.handle) ? "Saved" : "Save gear"}
          </button>
        </div>
        <div class="product-notes">
          <span>Variant availability and pricing are synced from glitchgear.com.</span>
          <a href="#/size-guide">Open the official sizing chart →</a>
          <span>Shopify payment processing will be connected after presentation approval.</span>
        </div>
      </section>
    </div>
  `;
}

function renderSizeGuide() {
  document.title = "Sizing Chart | Glitch Gaming Apparel";
  app.innerHTML = `
    <article class="info-page">
      <span class="status-code">SUPPORT / FIT</span>
      <h1>Official sizing chart</h1>
      <div class="info-copy">
        <p>This sizing chart is the image currently published by Glitch Gear. Product options can vary, so confirm the selected variant on each product page.</p>
      </div>
      <div class="size-chart">
        <img src="${escapeAttr(store.brand.sizeChartImage)}" alt="Glitch Gear clothing sizing chart" />
      </div>
      <div class="page-actions" style="justify-content:flex-start; margin-top:24px">
        <a class="primary-button" href="#/shop">Browse apparel</a>
        <a class="secondary-button" href="mailto:${escapeAttr(store.brand.email)}">Ask about sizing</a>
      </div>
    </article>
  `;
}

function renderAbout() {
  document.title = "About Glitch | Glitch Gaming Apparel";
  app.innerHTML = `
    <article class="info-page">
      <span class="status-code">COMPANY / ORIGIN</span>
      <h1>Developed by gamers, for gamers.</h1>
      <div class="info-copy">
        ${paragraphs(store.brand.about)}
      </div>
      <div class="page-actions" style="justify-content:flex-start; margin-top:30px">
        <a class="primary-button" href="#/collections">Explore the worlds</a>
      </div>
    </article>
  `;
}

function renderSupport() {
  document.title = "Customer Support | Glitch Gaming Apparel";
  app.innerHTML = `
    <article class="info-page">
      <span class="status-code">SUPPORT / COMMAND</span>
      <h1>How can we help?</h1>
      <div class="info-copy">
        <p>The current Glitch Gear site directs customers to support and contact pages. Use the published order-support email for product, sizing, and order questions.</p>
      </div>
      <div class="support-grid">
        ${supportItem("Sizing help", "Compare apparel measurements with the official chart before choosing a variant.", "#/size-guide", "Open sizing chart")}
        ${supportItem("Order support", `Contact ${store.brand.email} with an order number and the email used at purchase.`, `mailto:${store.brand.email}`, "Email order support")}
        ${supportItem("Product availability", "Available and sold-out variants reflect the current public Shopify catalog.", "#/shop?available=1", "View available gear")}
        ${supportItem("Privacy", "Read the privacy policy currently published by Glitch Gear.", "#/privacy", "Read privacy policy")}
      </div>
    </article>
  `;
}

function renderContact() {
  document.title = "Contact Glitch Gear | Glitch Gaming Apparel";
  app.innerHTML = `
    <article class="info-page">
      <span class="status-code">SUPPORT / CONTACT</span>
      <h1>Send a support request</h1>
      <div class="info-copy">
        <p>This form opens your email app and addresses the request to the support email published by Glitch Gear. The demonstration does not transmit or store form data.</p>
      </div>
      <form class="contact-form" data-contact-form>
        <div class="field">
          <label for="contact-name">Name</label>
          <input id="contact-name" name="name" autocomplete="name" required />
        </div>
        <div class="field">
          <label for="contact-email">Email</label>
          <input id="contact-email" name="email" type="email" autocomplete="email" required />
        </div>
        <div class="field">
          <label for="contact-subject">Subject</label>
          <input id="contact-subject" name="subject" required />
        </div>
        <div class="field">
          <label for="contact-message">Message</label>
          <textarea id="contact-message" name="message" rows="7" required></textarea>
        </div>
        <button class="primary-button" type="submit">Open email request</button>
      </form>
    </article>
  `;
}

function renderPrivacy() {
  document.title = "Privacy Policy | Glitch Gaming Apparel";
  const privacyText = htmlToText(store.brand.privacyHtml);
  app.innerHTML = `
    <article class="info-page">
      <span class="status-code">COMPANY / PRIVACY</span>
      <h1>Privacy policy</h1>
      <div class="info-copy">
        ${paragraphs(privacyText)}
      </div>
    </article>
  `;
}

function renderWishlist() {
  document.title = "Saved Gear | Glitch Gaming Apparel";
  const products = state.wishlist.map(productByHandle).filter(Boolean);
  app.innerHTML = `
    ${pageHero("LOADOUT / SAVED", "Saved gear", "Keep a local shortlist while comparing products. Saved items stay on this device.")}
    <section class="section-shell">
      ${products.length ? `<div class="product-grid">${products.map((product) => productCard(product)).join("")}</div>` : emptyInline("No saved gear yet", "Use the heart control on any product to build your shortlist.", "#/shop", "Browse gear")}
    </section>
  `;
}

function renderNotFound() {
  document.title = "Page Not Found | Glitch Gaming Apparel";
  app.innerHTML = `
    <div class="empty-state">
      <span class="status-code">ERROR / 404</span>
      <h1>World not found.</h1>
      <p>This route is not part of the current loadout.</p>
      <a class="primary-button" href="#/">Return home</a>
    </div>
  `;
}

function pageHero(code, title, description) {
  return `
    <header class="page-hero">
      <div class="page-heading">
        <span class="status-code">${escapeHTML(code)}</span>
        <h1>${title}</h1>
        <p>${description}</p>
      </div>
    </header>
  `;
}

function collectionCard(collection) {
  return `
    <a class="collection-card collection-${escapeAttr(collection.handle)}" href="#/collection/${encodeURIComponent(collection.handle)}">
      ${collection.image ? `<img src="${escapeAttr(collection.image)}" alt="" loading="lazy" />` : ""}
      <div class="collection-card-content">
        <h3>${escapeHTML(collection.title)}</h3>
        <span>${collection.productCount} products · View collection →</span>
      </div>
    </a>
  `;
}

function homeCollectionCard(collection) {
  const href = collection.href || `#/collection/${encodeURIComponent(collection.handle)}`;
  return `
    <a class="collection-card home-collection-card collection-${escapeAttr(collection.handle)} ${collection.synthetic ? "synthetic" : ""}" href="${escapeAttr(href)}" aria-label="View ${escapeAttr(collection.title)} collection">
      ${collection.image ? `<img src="${escapeAttr(collection.image)}" alt="" loading="lazy" />` : ""}
      <strong>${escapeHTML(collection.title)}</strong>
      <span class="collection-action">View collection <b aria-hidden="true">→</b></span>
    </a>
  `;
}

function productCard(product, featured = false) {
  const image = product.images[0];
  const multiplePrices = product.priceMin !== product.priceMax;
  const availableVariants = product.variants.filter((variant) => variant.available);
  const canQuickAdd = availableVariants.length === 1;
  return `
    <article class="product-card ${featured ? "featured-card" : ""}">
      <a class="product-media" href="#/product/${encodeURIComponent(product.handle)}" aria-label="View ${escapeAttr(product.title)}">
        ${featured ? "" : `<span class="availability-badge ${product.available ? "" : "sold-out"}">${product.available ? "Available" : "Sold out"}</span>`}
        ${image ? `<img src="${escapeAttr(image.src)}" alt="${escapeAttr(image.alt || product.title)}" loading="lazy" />` : ""}
      </a>
      ${featured ? "" : `<button class="wishlist-toggle ${isWishlisted(product.handle) ? "active" : ""}" type="button" data-action="toggle-wishlist" data-handle="${escapeAttr(product.handle)}" aria-label="${isWishlisted(product.handle) ? "Remove" : "Add"} ${escapeAttr(product.title)} ${isWishlisted(product.handle) ? "from" : "to"} wishlist" aria-pressed="${isWishlisted(product.handle)}">${isWishlisted(product.handle) ? "♥" : "♡"}</button>`}
      <div class="product-card-body">
        <a href="#/product/${encodeURIComponent(product.handle)}">
          <h3>${escapeHTML(product.title)}</h3>
          <div class="product-card-price">${multiplePrices ? "From " : ""}${formatPrice(product.priceMin)}</div>
        </a>
        ${product.available ? `
          <${canQuickAdd ? "button" : "a"} class="quick-action" ${canQuickAdd ? `type="button" data-action="quick-add" data-handle="${escapeAttr(product.handle)}"` : `href="#/product/${encodeURIComponent(product.handle)}"`} aria-label="${canQuickAdd ? "Add" : "Choose options for"} ${escapeAttr(product.title)}">${featured ? cartGlyph() : canQuickAdd ? "+" : "→"}</${canQuickAdd ? "button" : "a"}>
        ` : `<a class="quick-action" href="#/product/${encodeURIComponent(product.handle)}" aria-label="View ${escapeAttr(product.title)}">→</a>`}
      </div>
    </article>
  `;
}

function filterPanel(params) {
  const types = [...new Set(store.products.map((product) => product.productType).filter(Boolean))].sort();
  return `
    <form class="filter-panel" data-filter-form>
      <h2>Filter inventory</h2>
      <div class="field">
        <label for="filter-query">Search</label>
        <input id="filter-query" name="q" type="search" value="${escapeAttr(params.get("q") || "")}" placeholder="Title, game, gear…" />
      </div>
      <div class="field">
        <label for="filter-type">Gear type</label>
        <select id="filter-type" name="type" data-filter>
          <option value="">All gear types</option>
          ${types.map((type) => `<option value="${escapeAttr(type)}" ${params.get("type") === type ? "selected" : ""}>${escapeHTML(type)}</option>`).join("")}
        </select>
      </div>
      <div class="field">
        <label for="filter-collection">Collection</label>
        <select id="filter-collection" name="collection" data-filter>
          <option value="">All collections</option>
          ${store.collections.map((collection) => `<option value="${escapeAttr(collection.handle)}" ${params.get("collection") === collection.handle ? "selected" : ""}>${escapeHTML(collection.title)}</option>`).join("")}
        </select>
      </div>
      <div class="field">
        <label for="filter-sort">Sort</label>
        <select id="filter-sort" name="sort" data-filter>
          ${sortOption("featured", "Featured", params)}
          ${sortOption("newest", "Newest", params)}
          ${sortOption("price-low", "Price: low to high", params)}
          ${sortOption("price-high", "Price: high to low", params)}
          ${sortOption("title", "Title: A to Z", params)}
        </select>
      </div>
      <label class="check-field">
        <input type="checkbox" name="available" value="1" data-filter ${params.get("available") === "1" ? "checked" : ""} />
        Available gear only
      </label>
      <button class="primary-button" type="submit">Apply search</button>
    </form>
  `;
}

function sortOption(value, label, params) {
  const selected = (params.get("sort") || "featured") === value;
  return `<option value="${value}" ${selected ? "selected" : ""}>${label}</option>`;
}

function filterProducts(params) {
  const query = (params.get("q") || "").toLowerCase().trim();
  const type = params.get("type") || "";
  const collection = params.get("collection") || "";
  const availableOnly = params.get("available") === "1";
  const sort = params.get("sort") || "featured";

  const filtered = store.products.filter((product) => {
    const haystack = [product.title, product.productType, ...product.tags, ...product.collections]
      .join(" ")
      .toLowerCase();
    return (
      product.images.length > 0 &&
      (!query || haystack.includes(query)) &&
      (!type || product.productType === type) &&
      (!collection || product.collections.includes(collection)) &&
      (!availableOnly || product.available)
    );
  });

  const sorters = {
    featured: (a, b) => Number(b.available) - Number(a.available) || b.id - a.id,
    newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    "price-low": (a, b) => a.priceMin - b.priceMin,
    "price-high": (a, b) => b.priceMax - a.priceMax,
    title: (a, b) => a.title.localeCompare(b.title),
  };
  return filtered.sort(sorters[sort] || sorters.featured);
}

function applyFilters(form) {
  const data = new FormData(form);
  const params = new URLSearchParams();
  for (const [key, value] of data.entries()) {
    const normalized = value.toString().trim();
    if (normalized && !(key === "sort" && normalized === "featured")) {
      params.set(key, normalized);
    }
  }
  const next = params.toString() ? `#/shop?${params}` : "#/shop";
  if (location.hash === next) {
    renderLimit = 36;
    renderCurrentProductList();
  } else {
    location.hash = next;
  }
}

function updateProductSelection(select) {
  const product = productByHandle(select.dataset.handle);
  const variant = product?.variants.find((item) => String(item.id) === select.value);
  if (!variant) return;
  document.querySelector("[data-product-price]").textContent = formatPrice(variant.price);
  const availability = document.querySelector("[data-product-availability]");
  availability.textContent = variant.available
    ? "Available in selected option"
    : "Selected option is sold out";
  availability.classList.toggle("sold-out", !variant.available);
  document.querySelector("[data-action='add-product']").disabled = !variant.available;
}

function addSelectedProduct(handle) {
  const product = productByHandle(handle);
  const select = document.querySelector("[data-variant-select]");
  const variant = product?.variants.find((item) => String(item.id) === select?.value);
  if (product && variant?.available) addToCart(product, variant);
}

function quickAdd(handle) {
  const product = productByHandle(handle);
  const available = product?.variants.filter((variant) => variant.available) || [];
  if (available.length === 1) addToCart(product, available[0]);
  else location.hash = `#/product/${encodeURIComponent(handle)}`;
}

function addToCart(product, variant) {
  const existing = state.cart.find((item) => String(item.variantId) === String(variant.id));
  if (existing) existing.quantity += 1;
  else {
    state.cart.push({
      variantId: variant.id,
      handle: product.handle,
      title: product.title,
      variantTitle: variant.title,
      price: variant.price,
      image: product.images[0]?.src || "",
      quantity: 1,
    });
  }
  persistCart();
  renderCart();
  showToast(`${product.title} added to your gear.`);
}

function changeQuantity(variantId, delta) {
  const item = state.cart.find((entry) => String(entry.variantId) === String(variantId));
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) removeCartItem(variantId);
  else {
    persistCart();
    renderCart();
  }
}

function removeCartItem(variantId) {
  state.cart = state.cart.filter((entry) => String(entry.variantId) !== String(variantId));
  persistCart();
  renderCart();
}

function renderCart() {
  const itemCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll("[data-cart-count]").forEach((node) => {
    node.textContent = itemCount;
  });

  if (!state.cart.length) {
    cartItemsRoot.innerHTML = emptyInline("Your cart is empty", "Add gear from any product or collection.", "#/shop", "Browse gear");
    cartFooterRoot.innerHTML = "";
    return;
  }

  cartItemsRoot.innerHTML = state.cart.map((item) => `
    <article class="cart-item">
      ${item.image ? `<img src="${escapeAttr(item.image)}" alt="" />` : ""}
      <div>
        <h3><a href="#/product/${encodeURIComponent(item.handle)}">${escapeHTML(item.title)}</a></h3>
        <p>${escapeHTML(item.variantTitle)} · ${formatPrice(item.price)}</p>
        <div class="quantity-control" aria-label="Quantity for ${escapeAttr(item.title)}">
          <button type="button" data-action="cart-decrease" data-variant="${item.variantId}" aria-label="Decrease quantity">−</button>
          <span>${item.quantity}</span>
          <button type="button" data-action="cart-increase" data-variant="${item.variantId}" aria-label="Increase quantity">+</button>
        </div>
      </div>
      <button class="remove-item" type="button" data-action="cart-remove" data-variant="${item.variantId}" aria-label="Remove ${escapeAttr(item.title)}">×</button>
    </article>
  `).join("");

  const total = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  cartFooterRoot.innerHTML = `
    <div class="cart-total"><span>Subtotal</span><span>${formatPrice(total)}</span></div>
    <button class="primary-button" type="button" data-action="checkout-notice">Continue to Shopify checkout</button>
    <p class="drawer-note">Payment processing is intentionally deferred in this presentation.</p>
  `;
}

function openCart() {
  renderCart();
  cartDialog.showModal();
}

function toggleWishlist(handle) {
  if (isWishlisted(handle)) {
    state.wishlist = state.wishlist.filter((item) => item !== handle);
    showToast("Removed from saved gear.");
  } else {
    state.wishlist.push(handle);
    showToast("Saved to your local loadout.");
  }
  writeLocal("glitch-wishlist", state.wishlist);
  render();
}

function isWishlisted(handle) {
  return state.wishlist.includes(handle);
}

function toggleMenu() {
  const open = nav.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
}

function closeMenu() {
  nav.classList.remove("open");
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "Open navigation");
}

function setActiveNav(path) {
  document.querySelectorAll(".primary-nav a").forEach((link) => {
    const target = link.getAttribute("href").split("?")[0].replace("#", "");
    const active = target === path || (target === "/collections" && path.startsWith("/collection/"));
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

function getRoute() {
  const raw = location.hash.startsWith("#/") ? location.hash.slice(1) : "/";
  const [path, query = ""] = raw.split("?");
  return { path, params: new URLSearchParams(query) };
}

function productByHandle(handle) {
  return store.products.find((product) => product.handle === handle);
}

function collectionByHandle(handle) {
  return store.collections.find((collection) => collection.handle === handle);
}

function formatPrice(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: store?.currency || "USD",
  }).format(value);
}

function cartGlyph() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 3h2l2.4 11.4a2 2 0 0 0 2 1.6h8.9a2 2 0 0 0 2-1.6L21 7H5"/><circle cx="9" cy="20" r="1.2"/><circle cx="18" cy="20" r="1.2"/></svg>`;
}

function supportItem(title, description, href, label) {
  return `
    <section class="support-item">
      <div><h2>${escapeHTML(title)}</h2><p>${escapeHTML(description)}</p></div>
      <a class="section-link" href="${escapeAttr(href)}">${escapeHTML(label)} →</a>
    </section>
  `;
}

function emptyInline(title, description, href = "", label = "") {
  return `
    <div class="empty-state" style="min-height:320px">
      <span class="status-code">NO ITEMS</span>
      <h2 class="empty-state-heading">${escapeHTML(title)}</h2>
      <p>${escapeHTML(description)}</p>
      ${href ? `<a class="primary-button" href="${escapeAttr(href)}">${escapeHTML(label)}</a>` : ""}
    </div>
  `;
}

function paragraphs(text = "") {
  const chunks = text
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .reduce((groups, sentence) => {
      const current = groups.at(-1);
      if (!current || current.join(" ").length > 420) groups.push([sentence]);
      else current.push(sentence);
      return groups;
    }, []);
  return chunks.map((chunk) => `<p>${escapeHTML(chunk.join(" "))}</p>`).join("");
}

function htmlToText(html = "") {
  const documentFragment = new DOMParser().parseFromString(html, "text/html");
  return documentFragment.body.textContent.replace(/\s+/g, " ").trim();
}

function showToast(message) {
  clearTimeout(toastTimer);
  toastRoot.textContent = message;
  toastRoot.classList.add("visible");
  toastTimer = setTimeout(() => toastRoot.classList.remove("visible"), 2600);
}

function persistCart() {
  writeLocal("glitch-cart", state.cart);
}

function readLocal(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    showToast("Local storage is unavailable in this browser.");
  }
}

function escapeHTML(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value = "") {
  return escapeHTML(value);
}

async function loadLiveStore() {
  const site = "https://www.glitchgear.com";
  const getJSON = async (path) => {
    const response = await fetch(`${site}${path}`);
    if (!response.ok) throw new Error(`${path} returned ${response.status}`);
    return response.json();
  };
  const textFromHTML = (html = "") => {
    const documentFragment = new DOMParser().parseFromString(html, "text/html");
    return documentFragment.body.textContent.replace(/\s+/g, " ").trim();
  };

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
        available: variants.some((variant) => variant.available),
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

  return {
    source: site,
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
        title: collection.title,
        handle: collection.handle,
        description: textFromHTML(collection.body_html),
        image: collection.image?.src || null,
        productCount: collectionMap.get(collection.handle)?.size || 0,
      }))
      .sort((a, b) => a.title.localeCompare(b.title)),
    products: normalizedProducts,
  };
}
