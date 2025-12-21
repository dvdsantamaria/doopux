#!/usr/bin/env bash
set -euo pipefail
command -v magick >/dev/null 2>&1 || brew install imagemagick
SRC="/Users/dax/Documents/Doop/favicon.png"
TMP="$(mktemp -d)"
cp "$SRC" "$TMP/src.png"
magick "$TMP/src.png" -resize 1024x1024 "$TMP/1024.png"
magick "$TMP/1024.png" -define icon:auto-resize=16,32,48,64,128,256 favicon.ico
magick "$TMP/1024.png" -resize 512x512 favicon-512.png
magick "$TMP/1024.png" -resize 192x192 favicon-192.png
magick "$TMP/1024.png" -resize 180x180 apple-touch-icon.png
magick "$TMP/1024.png" -resize 32x32 favicon-32.png
magick "$TMP/1024.png" -resize 16x16 favicon-16.png
rm -rf "$TMP"