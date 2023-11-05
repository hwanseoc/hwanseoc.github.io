# usage: python3 gh-md-to-html.py

import argparse
import requests
import os
import glob
from jinja2 import Environment, FileSystemLoader
import shutil
import re

def read_file(file_path):
    with open(file_path, "r", encoding="utf-8") as file:
        return file.read()

def write_file(file_path, content):
    with open(file_path, "w", encoding="utf-8") as file:
        file.write(content)

def extract_title(md_content, default_title):
    title_match = re.search(r'<!--\s*title:\s*(.+?)\s*-->', md_content)
    return title_match.group(1) if title_match else default_title

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--inputdir", help="Input directory containing markdown files", type=str, default="content")
    parser.add_argument("--outputdir", help="Output directory for generated HTML files", type=str, default="docs")
    parser.add_argument("-m", "--mode", help="Markdown rendering mode (markdown or gfm)", choices=["markdown", "gfm"], default="gfm")
    parser.add_argument("-c", "--context", help="Repository context when rendering in gfm mode", type=str)
    args = parser.parse_args()

    if args.context and args.mode == "markdown":
        raise ValueError("[ERROR] Cannot apply context in markdown mode. Remove context or switch to gfm mode.")

    shutil.rmtree(args.outputdir, ignore_errors=True)
    shutil.os.makedirs(args.outputdir)

    # copy over non-md files
    for file in os.listdir(args.inputdir):
        if file.endswith(".md"):
            continue
        shutil.copy(os.path.join(args.inputdir, file), os.path.join(args.outputdir, file))

    # render md files
    env = Environment(loader=FileSystemLoader('templates'))
    template = env.get_template('template.html')
    md_files = glob.glob(os.path.join(args.inputdir, "*.md"))

    for md_file_path in md_files:
        base_filename = os.path.basename(md_file_path)
        filename_no_ext = os.path.splitext(base_filename)[0]
        output_html_path = os.path.join(args.outputdir, filename_no_ext + ".html")

        md = read_file(md_file_path)
        page_title = extract_title(md, filename_no_ext)

        payload = {"text": md, "mode": args.mode}
        if args.context:
            payload["context"] = args.context

        response = requests.post("https://api.github.com/markdown", json=payload)
        response.raise_for_status()
        rendered_html = template.render(title=page_title, content=response.text)

        write_file(output_html_path, rendered_html)

if __name__ == "__main__":
    main()
