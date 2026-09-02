#!/usr/bin/env python3
"""Build preservation-first catalog cutouts for the demo and Shopify theme.

The segmentation model supplies alpha only. Every visible RGB pixel comes from
the original Glitch Gear catalog image, so white products and skin tones cannot
be recolored by a chroma-key or blend-mode effect.
"""

from __future__ import annotations

import argparse
import io
import json
import re
import ssl
import time
import urllib.request
from pathlib import Path

from PIL import Image
import certifi


USER_AGENT = "GlitchGearThemeBuilder/1.0"
SSL_CONTEXT = ssl.create_default_context(cafile=certifi.where())


def safe_name(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def download(url: str, attempts: int = 3) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    for attempt in range(1, attempts + 1):
        try:
            with urllib.request.urlopen(request, timeout=45, context=SSL_CONTEXT) as response:
                return response.read()
        except Exception:
            if attempt == attempts:
                raise
            time.sleep(attempt * 1.5)
    raise RuntimeError("download failed")


def normalize_source(image: Image.Image, max_dimension: int) -> Image.Image:
    image = image.convert("RGB")
    if max(image.size) > max_dimension:
        image.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)
    return image


def cutout(source: Image.Image, session) -> Image.Image:
    # rembg performs semantic segmentation. Only its alpha is retained.
    from rembg import remove

    segmented = remove(
        source,
        session=session,
        alpha_matting=True,
        alpha_matting_foreground_threshold=238,
        alpha_matting_background_threshold=12,
        alpha_matting_erode_size=6,
        post_process_mask=True,
    ).convert("RGBA")
    preserved = source.convert("RGBA")
    preserved.putalpha(segmented.getchannel("A"))
    return preserved


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--store", type=Path, default=Path("data/store.json"))
    parser.add_argument("--assets", type=Path, default=Path("shopify-theme/assets"))
    parser.add_argument("--snippet", type=Path, default=Path("shopify-theme/snippets/glitch-product-image.liquid"))
    parser.add_argument("--max-dimension", type=int, default=1200)
    parser.add_argument("--model", default="birefnet-general-lite")
    parser.add_argument("--limit", type=int)
    parser.add_argument("--shard-count", type=int, default=1)
    parser.add_argument("--shard-index", type=int, default=0)
    parser.add_argument("--assets-only", action="store_true")
    parser.add_argument("--mapping-only", action="store_true")
    parser.add_argument("--overwrite", action="store_true")
    args = parser.parse_args()

    store = json.loads(args.store.read_text())
    args.assets.mkdir(parents=True, exist_ok=True)
    if args.mapping_only:
        session = None
    else:
        from rembg import new_session

        session = new_session(args.model)
    mappings: list[tuple[str, str]] = []
    failures: list[tuple[str, str]] = []
    processed = 0

    source_index = 0
    for product in store["products"]:
        for position, image_data in enumerate(product.get("images", []), start=1):
            if args.limit is not None and processed >= args.limit:
                break
            filename = f"gg-product-{safe_name(product['handle'])}-{position}.webp"
            destination = args.assets / filename
            if destination.exists() or not args.assets_only:
                image_data["displaySrc"] = f"shopify-theme/assets/{filename}"
            mappings.append((str(image_data.get("id", "")), filename))
            assigned = source_index % args.shard_count == args.shard_index
            source_index += 1
            if not assigned or args.mapping_only:
                continue
            if destination.exists() and not args.overwrite:
                processed += 1
                continue

            try:
                payload = download(image_data["src"])
                source = normalize_source(Image.open(io.BytesIO(payload)), args.max_dimension)
                result = cutout(source, session)
                result.save(destination, "WEBP", quality=90, method=6, exact=True)
                processed += 1
                print(f"[{processed}] {filename}", flush=True)
            except Exception as error:
                failures.append((image_data["src"], str(error)))
                image_data.pop("displaySrc", None)
                print(f"FAILED {image_data['src']}: {error}", flush=True)
        if args.limit is not None and processed >= args.limit:
            break

    if args.assets_only:
        print(f"Processed shard {args.shard_index + 1}/{args.shard_count}: {processed}; failures: {len(failures)}", flush=True)
        if failures:
            raise SystemExit(1)
        return

    args.store.write_text(json.dumps(store, indent=2) + "\n")

    liquid_lines = [
        "{%- comment -%}",
        "Generated by scripts/build-product-cutouts.py.",
        "Maps this store's Shopify image IDs to source-color-preserving cutouts.",
        "Falls back to the native Shopify image for newly added catalog media.",
        "{%- endcomment -%}",
        "{%- case image.id -%}",
    ]
    for image_id, filename in mappings:
        if image_id:
            liquid_lines.append(f"  {{%- when {image_id} -%}}{{{{ '{filename}' | asset_url }}}}")
    liquid_lines.extend([
        "  {%- else -%}{{ image | image_url: width: width }}",
        "{%- endcase -%}",
    ])
    args.snippet.parent.mkdir(parents=True, exist_ok=True)
    args.snippet.write_text("\n".join(liquid_lines) + "\n")

    print(f"Processed: {processed}; failures: {len(failures)}", flush=True)
    if failures:
        for url, error in failures:
            print(f"- {url}: {error}", flush=True)
        raise SystemExit(1)


if __name__ == "__main__":
    main()
