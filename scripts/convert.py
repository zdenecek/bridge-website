import sys
import os.path
from pathlib import Path
import yaml
import json

def main():

    if len(sys.argv) != 3:
        print("Usage: python convert.py <json_in> <out_dir>")
        sys.exit(1)

    # JSON file to convert
    json_in = sys.argv[1]
    # Directory to store the markdown files
    out_dir = sys.argv[2]

    Path(out_dir).mkdir(parents=True, exist_ok=True)


    with open(json_in, "r") as json_file:
        data = json.load(json_file)

    for entry in data:
        # Generate the front matter
        front_matter = yaml.dump(entry)
        
        file_path = os.path.join(out_dir, entry['date'] + "-" + entry["slug"] + ".md")
        with open(file_path, "w") as md_file:
            md_file.write("---\n")
            md_file.write(front_matter)
            md_file.write("---\n")
            
if __name__ == "__main__":
    main()
    