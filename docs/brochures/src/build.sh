#!/usr/bin/env bash
# Build both brochures: inline the ornament, print with headless Chrome, render PNG previews (into build/, which is git-ignored).
# Needs: google-chrome, poppler-utils (pdftoppm, pdfinfo), python3. Run: ./build.sh [en] [ta]
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p build build/preview
for lang in ${@:-en ta}; do
  python3 - "$lang" <<'PY'
import sys
lang=sys.argv[1]
src=open(f"open-sangam-brochure-{lang}.html",encoding="utf-8").read()
src=src.replace("{{ORN}}",open("ornament.svg.txt",encoding="utf-8").read())
open(f"build/open-sangam-brochure-{lang}.built.html","w",encoding="utf-8").write(src)
PY
  cp brochure.css qr-*.svg build/ && cp -r fonts build/
  google-chrome --headless=new --no-sandbox --disable-gpu --no-pdf-header-footer --allow-file-access-from-files \
    --print-to-pdf="../open-sangam-brochure-${lang}.pdf" "file://$PWD/build/open-sangam-brochure-${lang}.built.html" 2>/dev/null
  rm -f build/preview/${lang}-*.png
  pdftoppm -r 70 -png "../open-sangam-brochure-${lang}.pdf" "build/preview/${lang}"
  echo "$lang: $(pdfinfo ../open-sangam-brochure-${lang}.pdf | awk '/^Pages/{print $2}') pages, $(pdfinfo ../open-sangam-brochure-${lang}.pdf | awk -F': *' '/^Page size/{print $2}')"
done
