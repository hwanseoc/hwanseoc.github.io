#!/bin/bash

set -euo pipefail

npm install --no-save tailwindcss @tailwindcss/cli postcss autoprefixer
npx @tailwindcss/cli -i ./templates/tailwind.scss -o ./content/style.css --minify

python3 gh-md-to-html.py
