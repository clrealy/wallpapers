#!/usr/bin/env python3
"""Build the GitHub Pages site into _site/.

Scans wallpapers/ (each subfolder is a category), writes a thumbnail for
every image plus a wallpapers.json manifest, and copies site/ alongside.

    python3 scripts/build.py
    python3 -m http.server -d _site
"""
import json
import shutil
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "wallpapers"
SITE = ROOT / "site"
OUT = ROOT / "_site"
EXTS = {".jpg", ".jpeg", ".png", ".webp"}
THUMB_SIZE = (800, 800)


def title_from(path):
    return path.stem.replace("-", " ").replace("_", " ").title()


def main():
    if OUT.exists():
        shutil.rmtree(OUT)
    shutil.copytree(SITE, OUT)
    (OUT / ".nojekyll").touch()

    items = []
    for img_path in sorted(SRC.rglob("*")):
        if img_path.suffix.lower() not in EXTS:
            continue
        rel = img_path.relative_to(SRC)
        category = rel.parts[0] if len(rel.parts) > 1 else "misc"

        full = OUT / "wallpapers" / rel
        full.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(img_path, full)

        thumb = OUT / "thumbs" / rel.with_suffix(".webp")
        thumb.parent.mkdir(parents=True, exist_ok=True)
        with Image.open(img_path) as im:
            im = ImageOps.exif_transpose(im)
            width, height = im.size
            im = im.convert("RGB")
            im.thumbnail(THUMB_SIZE)
            im.save(thumb, "WEBP", quality=80)

        items.append({
            "title": title_from(img_path),
            "category": category,
            "src": f"wallpapers/{rel.as_posix()}",
            "thumb": f"thumbs/{rel.with_suffix('.webp').as_posix()}",
            "width": width,
            "height": height,
            "size": img_path.stat().st_size,
        })

    (OUT / "wallpapers.json").write_text(json.dumps(items, indent=2))
    print(f"Built {len(items)} wallpapers into {OUT.relative_to(ROOT)}/")


if __name__ == "__main__":
    main()
