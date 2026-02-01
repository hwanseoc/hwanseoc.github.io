#!/bin/bash

set -euo pipefail

OS=$(uname -s)
if [ "$OS" = "Darwin" ]; then
  BINARY="tailwindcss-macos-arm64"
else
  BINARY="tailwindcss-linux-x64"
fi

if [ ! -f "temp/$BINARY" ]; then
  mkdir -p temp
  curl -sL "https://github.com/tailwindlabs/tailwindcss/releases/latest/download/$BINARY" -o "temp/$BINARY"
  chmod a+x "temp/$BINARY"
fi

./temp/$BINARY -i ./templates/tailwind.css -o ./content/tailwind.css
python3 gh-md-to-html.py
