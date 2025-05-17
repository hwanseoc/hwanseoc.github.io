#!/bin/bash

set -euo pipefail

npx --yes @tailwindcss/cli -i ./templates/tailwind.scss -o ./content/style.css --minify

python3 gh-md-to-html.py
