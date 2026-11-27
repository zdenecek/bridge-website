#!/usr/bin/env python3
"""Build the vectors for semantic search in the laws.

Reads the laws search index that Hugo writes (public/en/laws/index.json,
public/pravidla/index.json), splits it into paragraphs the same way assets/js/laws.js
does, embeds each paragraph through the laws-search worker and writes
static/<section>/vectors.json.

    make site
    python3 bin/embed-laws.py https://laws-search.<account>.workers.dev
    python3 bin/embed-laws.py --dry-run
"""

import argparse
import base64
import json
import math
import sys
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SECTIONS = {"en": "en/laws", "cs": "pravidla"}
BLOCK_TAGS = {"h2", "li", "p", "dt", "dd", "td"}
SKIP_TAGS = {"ol", "ul", "sup"}
VOID_TAGS = {"br", "img", "hr", "input", "meta", "link", "wbr", "col", "area", "source"}
BATCH = 25
MAX_CHARS = 2000


class Node:
    def __init__(self, tag, attrs, parent):
        self.tag = tag
        self.id = dict(attrs).get("id") if attrs else None
        self.parent = parent
        self.children = []


class TreeBuilder(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node("div", [], None)
        self.cur = self.root

    def handle_starttag(self, tag, attrs):
        node = Node(tag, attrs, self.cur)
        self.cur.children.append(node)
        if tag not in VOID_TAGS:
            self.cur = node

    def handle_endtag(self, tag):
        n = self.cur
        while n is not self.root and n.tag != tag:
            n = n.parent
        if n is not self.root:
            self.cur = n.parent

    def handle_data(self, data):
        self.cur.children.append(data)


def own_text(node):
    parts = []

    def walk(n):
        for c in n.children:
            if isinstance(c, str):
                parts.append(c)
            elif c.tag not in SKIP_TAGS:
                walk(c)

    walk(node)
    return " ".join("".join(parts).split())


def holder_id(node):
    n = node
    while n is not None:
        if n.id:
            return n.id
        n = n.parent
    return ""


def chunks_for(pages):
    """Group the paragraph blocks of each page by anchor, in document order."""
    out = []
    for page in pages:
        title = f"{page['n']} {page['t']}" if page["n"] else page["t"]
        tb = TreeBuilder()
        tb.feed(page["c"])
        groups = {}

        def walk(n):
            for c in n.children:
                if isinstance(c, str):
                    continue
                if c.tag in BLOCK_TAGS:
                    text = own_text(c)
                    if text:
                        groups.setdefault(holder_id(c), []).append(text)
                walk(c)

        walk(tb.root)
        for anchor, texts in groups.items():
            body = " ".join(texts)
            out.append({"u": page["u"], "a": anchor, "text": f"{title}: {body}"[:MAX_CHARS]})
    return out


def embed(endpoint, texts):
    req = urllib.request.Request(
        endpoint.rstrip("/") + "/embed",
        data=json.dumps({"texts": texts}).encode(),
        headers={"Content-Type": "application/json", "User-Agent": "embed-laws"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.load(r)["data"]


def quantize(vec):
    norm = math.sqrt(sum(x * x for x in vec)) or 1.0
    return bytes((max(-127, min(127, round(x / norm * 127))) & 0xFF) for x in vec)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("endpoint", nargs="?")
    ap.add_argument("--dry-run", action="store_true", help="only count the chunks")
    args = ap.parse_args()
    if not args.endpoint and not args.dry_run:
        ap.error("endpoint is required unless --dry-run")

    for lang, section in SECTIONS.items():
        index = ROOT / "public" / section / "index.json"
        if not index.exists():
            sys.exit(f"{index} not found, run `make site` first")
        chunks = chunks_for(json.loads(index.read_text()))
        chars = sum(len(c["text"]) for c in chunks)
        print(f"{lang}: {len(chunks)} chunks, {chars} chars", file=sys.stderr)
        if args.dry_run:
            continue

        vectors = []
        for i in range(0, len(chunks), BATCH):
            vectors += embed(args.endpoint, [c["text"] for c in chunks[i : i + BATCH]])
            print(f"  {min(i + BATCH, len(chunks))}/{len(chunks)}", file=sys.stderr)
        dim = len(vectors[0])
        blob = b"".join(quantize(v) for v in vectors)
        out = ROOT / "static" / section / "vectors.json"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(
            json.dumps(
                {
                    "model": "@cf/baai/bge-m3",
                    "dim": dim,
                    "items": [[c["u"], c["a"]] for c in chunks],
                    "vectors": base64.b64encode(blob).decode(),
                },
                ensure_ascii=False,
                separators=(",", ":"),
            )
        )
        print(f"  wrote {out.relative_to(ROOT)} ({out.stat().st_size // 1024} KB)", file=sys.stderr)


if __name__ == "__main__":
    main()
