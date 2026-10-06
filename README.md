# Wallpapers

A gallery of wallpapers, hosted on GitHub Pages.

## Adding wallpapers

Drop images (`.jpg`, `.png`, `.webp`) into a folder under `wallpapers/`. Each folder becomes a category on the site:

```
wallpapers/
  abstract/
    aurora-blobs.jpg
  gradients/
    dusk.jpg
```

File names become titles (`aurora-blobs.jpg` → "Aurora Blobs"). Push to `main` and the site rebuilds automatically.

## Turning on GitHub Pages

One-time setup: in the repo go to **Settings → Pages** and set **Source** to **GitHub Actions**. The site will be at `https://<user>.github.io/wallpapers/`.

## Previewing locally

```sh
pip install pillow
python3 scripts/build.py
python3 -m http.server -d _site
```

Then open http://localhost:8000.
