import sys
import os.path
from pathlib import Path
import yaml
import json


def make_tournament_file(data: dict, dirname):
    
    Path(dirname).mkdir(parents=True, exist_ok=True)
    content = content_file = None
    if "content" in data:
        content = data["content"]
        del data["content"]
    if "content-file" in data:
        content_file = data["content-file"]
        del data["content-file"]
        
    front_matter = yaml.dump(data, allow_unicode=True, explicit_start=True)
    file_path = os.path.join(dirname, data['date'] + "-" + data["slug"] + ".md")
    with open(file_path, "w") as md_file:
        md_file.write(front_matter)
        md_file.write("---\n\n")
        if content:
            md_file.write(content)
        if content_file:
            with open(content_file, "r") as content_file:
                md_file.write(content_file.read())


def main():

    if len(sys.argv) != 4:
        print("Usage: python convert.py <json_in> <out_dir_in_content> <default_lang>")
        sys.exit(1)

    # JSON file to convert
    json_in = sys.argv[1]
    # Directory to store the markdown files
    out_dir = sys.argv[2]
    default_lang = sys.argv[3]

    with open(json_in, "r") as json_file:
        data = json.load(json_file)

    for entry in data:
        if "translations" in entry:
            for lang, lang_data in entry["translations"].items():
                make_tournament_file(lang_data, os.path.join("content", lang, out_dir))
        else:
            make_tournament_file(entry, os.path.join("content", default_lang, out_dir))
        
            
            
if __name__ == "__main__":
    main()
    