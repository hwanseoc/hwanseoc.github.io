#!/bin/bash

set -euo pipefail

if [ ! -f temp/tailwindcss-linux-x64 ]; then
  curl -sL https://github.com/tailwindlabs/tailwindcss/releases/latest/download/tailwindcss-linux-x64 -o temp/tailwindcss-linux-x64
  chmod a+x temp/tailwindcss-linux-x64
fi
./temp/tailwindcss-linux-x64 -i ./templates/tailwind.css -o ./content/tailwind.css --minify

python3 gh-md-to-html.py
