import sys
import os.path
from pathlib import Path
import yaml
import json
from slugify import slugify

def make_tournament_file(data: dict, dirname):
    
    Path(dirname).mkdir(parents=True, exist_ok=True)
    content = content_file = None
    if "content" in data:
        content = data["content"]
        del data["content"]
    if "content-file" in data:
        content_file = data["content-file"]
        del data["content-file"]
    
    data["layout"] = "tournament"
    data["type"] = "tournament"
    
     
    front_matter = yaml.dump(data, allow_unicode=True, explicit_start=True)
    
    slug = data.get("slug", slugify(data["title"]))
    
    file_path = os.path.join(dirname, data['date'] + "-" + slug + ".md")
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
    default_lang = sys.argv[3]

    # Directory to store the markdown files
    # given in format lang:dir,lang:dir ...
    dirs = {}
    for lang_dir in sys.argv[2].split(","):
        if ":" not in lang_dir:
            lang, dir = default_lang, lang_dir
        else:
            lang, dir = lang_dir.split(":")
        dirs[lang] = dir

    with open(json_in, "r") as json_file:
        data = json.load(json_file)

    for entry in data:
        if "translations" in entry:
            translation_key = entry['id']

            for lang, lang_data in entry["translations"].items():
                lang_data["translationKey"] = translation_key
                make_tournament_file(lang_data, os.path.join("content", lang, dirs[lang]))
        else:
            make_tournament_file(entry, os.path.join("content", default_lang,  dirs[lang]))        
            
            
if __name__ == "__main__":
    main()
    