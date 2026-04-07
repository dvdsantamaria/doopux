#!/usr/bin/env python3
"""
Genera seo-quote-northgate-embedded.html con todos los assets en base64.
Ejecutar desde /Users/dax/Documents/Doop/quotes/
  python3 embed.py
"""
import base64, re, os

ASSETS_DIR = os.path.join(os.path.dirname(__file__), "assets")
SOURCE      = os.path.join(os.path.dirname(__file__), "seo-quote-northgate.html")
OUTPUT      = os.path.join(os.path.dirname(__file__), "seo-quote-northgate-embedded.html")

MIME = {
    ".png":  "image/png",
    ".jpg":  "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".svg":  "image/svg+xml",
}

with open(SOURCE, "r", encoding="utf-8") as f:
    html = f.read()

def embed_src(match):
    src = match.group(1)
    if src.startswith("data:") or src.startswith("http"):
        return match.group(0)
    # resolve relative to assets/
    filename = os.path.basename(src)
    filepath = os.path.join(ASSETS_DIR, filename)
    if not os.path.exists(filepath):
        print(f"  [skip] {filename} not found")
        return match.group(0)
    ext  = os.path.splitext(filename)[1].lower()
    mime = MIME.get(ext, "image/png")
    with open(filepath, "rb") as img:
        b64 = base64.b64encode(img.read()).decode()
    print(f"  [ok]   {filename}")
    return f'src="data:{mime};base64,{b64}"'

result = re.sub(r'src="([^"]+)"', embed_src, html)

with open(OUTPUT, "w", encoding="utf-8") as f:
    f.write(result)

print(f"\nListo: {OUTPUT}")
