#!/usr/bin/env bash
# Run once from /Users/dax/Documents/Doop/quotes/
# Copies all assets needed by the SEO quote

SRC_DOOP="/Users/dax/Documents/Doop/Doop Web/doopux/assets"
SRC_PM="/Users/dax/Documents/Doop/OTS-quotes/Stage 2/old/PM"
DEST="$(cd "$(dirname "$0")" && pwd)/assets"

mkdir -p "$DEST"

# Logo + flags (from PM folder, already used in roadmap)
cp "$SRC_PM/logocolor.png"   "$DEST/"
cp "$SRC_PM/australia.png"   "$DEST/"
cp "$SRC_PM/germany.png"     "$DEST/"
cp "$SRC_PM/argentina.png"   "$DEST/"
cp "$SRC_PM/favicon-512.png" "$DEST/"

# Service icons (from Doop Web)
cp "$SRC_DOOP/icons_0002_Layer-6.png" "$DEST/"   # SEO
cp "$SRC_DOOP/icons_0003_Layer-5.png" "$DEST/"   # SEO for AI Answers

echo "Done — assets in $DEST"
echo "Open seo-quote-northgate.html in browser to preview."
