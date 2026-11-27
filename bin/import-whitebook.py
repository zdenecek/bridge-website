#!/usr/bin/env python3
"""Convert the EBU White Book PDF into content/en/white-book/ and data/laws/whitebook.json.

Usage: python3 bin/import-whitebook.py white-book.pdf   (needs `pip install pymupdf`)
"""
import html
import json
import pathlib
import re
import sys

import pymupdf

from guides_pdf import front_matter, join_lines, link_laws, load_law_ids, span_html, text_of

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "content/en/white-book"
DATA = ROOT / "data/laws/whitebook.json"
FIRST_PAGE, TOP, BOTTOM = 4, 50, 780
SOURCE_URL = "https://www.ebu.co.uk/documents/laws-and-ethics/white-book/white-book.pdf"


def line_text(line):
    return "".join(s["text"] for s in line["spans"])


def classify(block):
    first = block["lines"][0]
    sp = next((s for s in first["spans"] if s["text"].strip()), first["spans"][0])
    x = round(first["bbox"][0])
    bold = "Bold" in sp["font"]
    size = round(sp["size"])
    text = " ".join(line_text(l).strip() for l in block["lines"]).strip()
    if size >= 15 and bold:
        return "chapter", text
    if size == 14 and bold and x < 70:
        return "h2", text
    if size == 14 and x < 70:
        return "law", text
    if size == 12 and bold and x < 70:
        return "h3", text
    if "Italic" in sp["font"] and x < 70 and re.match(r"\d+\.\d+\.\d+\.\d+", text):
        return "h4", text
    if size <= 8 and 95 < x < 120:
        return "footnote", text
    return "p", text


def indent_class(block):
    x = min(l["bbox"][0] for l in block["lines"])
    if x < 120:
        return ""
    if x < 160:
        return "i1"
    if x < 190:
        return "i2"
    return "i3"


def table_html(tab):
    rows = tab.extract()
    out = ['<div class="guide-table"><table>']
    for r in rows:
        cells = ["" if c is None else html.escape(re.sub(r"\s+", " ", c).strip()) for c in r]
        if not any(cells):
            continue
        out.append("<tr>" + "".join(f"<td>{c}</td>" for c in cells) + "</tr>")
    out.append("</table></div>")
    return "\n".join(out)


def parse(pdf):
    doc = pymupdf.open(pdf)
    chapters = []
    for pno in range(FIRST_PAGE, doc.page_count):
        page = doc[pno]
        if "INDEX" in page.get_text()[:200] and pno > doc.page_count - 10:
            break
        tables, seen = [], set()
        for t in page.find_tables().tables:
            cells = [c for r in t.extract() for c in r if c]
            box = tuple(round(v) for v in t.bbox)
            if t.row_count < 2 or not cells or box in seen or sum(map(len, cells)) / len(cells) > 55:
                continue
            seen.add(box)
            tables.append(t)
        boxes = [pymupdf.Rect(t.bbox) for t in tables]
        items = []
        for t in tables:
            items.append((t.bbox[1], "table", table_html(t), None))
        for b in page.get_text("dict")["blocks"]:
            lines = [l for l in b.get("lines", []) if TOP < l["bbox"][1] < BOTTOM and line_text(l).strip()]
            if not lines:
                continue
            b = {**b, "lines": lines}
            r = pymupdf.Rect(b["bbox"])
            if any(r.intersects(x) and (r & x).get_area() > 0.5 * r.get_area() for x in boxes):
                continue
            items.append((lines[0]["bbox"][1], "block", b, pno))
        items.sort(key=lambda i: i[0])
        new_page = True
        for _, kind, obj, _ in items:
            if kind == "table":
                chapters[-1]["els"].append(("table", obj, ""))
                new_page = False
                continue
            cls, text = classify(obj)
            if cls == "chapter":
                m = re.match(r"(\d+)\s+(.*)", text)
                if not m:
                    continue
                chapters.append({"num": int(m.group(1)), "title": m.group(2).strip(), "els": []})
                continue
            if not chapters:
                continue
            els = chapters[-1]["els"]
            if cls in ("h2", "h3", "h4", "law"):
                els.append((cls, text, ""))
            elif cls == "footnote":
                m = re.match(r"(\d+)\s+(.*)", text)
                body = join_lines([span_html(l["spans"], False) for l in obj["lines"]])
                body = re.sub(r"^\d+\s*", "", body)
                els.append(("footnote", body, m.group(1) if m else ""))
            else:
                ind = indent_class(obj)
                body = join_lines([span_html(l["spans"]) for l in obj["lines"]])
                if re.match(r"<strong>Example</strong>\s*", body):
                    body = re.sub(r"^<strong>Example</strong>\s*", "", body)
                    els.append(("example", body, ""))
                    new_page = False
                    continue
                prev = els[-1] if els else None
                if (new_page and prev and prev[0] in ("p", "example") and prev[2] == ind
                        and not re.search(r"[.:;!?)”’]\s*$", text_of(prev[1]))
                        and re.match(r"[a-z(]", text_of(body)[:1] or "X")):
                    els[-1] = (prev[0], prev[1] + " " + body, prev[2])
                else:
                    els.append(("p", body, ind))
            new_page = False
    return chapters


def heading_parts(text):
    m = re.match(r"(\d+(?:\.\d+)+)\s+(.*)", text)
    return (m.group(1), m.group(2).strip()) if m else ("", text)


def render(ch, law_ids, all_ids):
    out, stack = [], []

    def close_to(level):
        while stack and stack[-1] >= level:
            out.append("</section>")
            stack.pop()

    law_items = {}
    current_law = None
    current_sec = None
    for kind, text, extra in ch["els"]:
        if kind == "law":
            close_to(1)
            m = re.match(r"Law\s+(\d+)\s*(.*)", text)
            key = m.group(1) if m else "def" if text.lower().startswith("definitions") else None
            sid = f"law-{key}" if key else ""
            out.append(f'<section id="{sid}">' if sid else "<section>")
            out.append(f"<h2>{html.escape(text)}</h2>")
            stack.append(1)
            current_law, current_sec = key, None
            continue
        if kind in ("h2", "h3", "h4"):
            level = {"h2": 1, "h3": 2, "h4": 3}[kind]
            close_to(level)
            num, title = heading_parts(text)
            out.append(f'<section id="{num}">' if num else "<section>")
            out.append(f"<{kind}>{html.escape(num + ' ' if num else '')}{html.escape(title)}</{kind}>".replace("> ", ">"))
            stack.append(level)
            if ch["num"] == 8 and kind == "h3" and current_law:
                current_sec = {"id": num, "t": title, "h": []}
                law_items.setdefault(current_law, []).append(current_sec)
            elif kind == "h2":
                current_sec = None
            continue
        if kind == "table":
            piece = text
        elif kind == "footnote":
            piece = f'<p class="footnote"><sup>{extra}</sup> {text}</p>'
        elif kind == "example":
            piece = f'<p class="example"><strong>Example</strong> {text}</p>'
        else:
            piece = f'<p class="{extra}">{text}</p>' if extra else f"<p>{text}</p>"
        piece = link_sections(link_laws(piece, law_ids), all_ids)
        out.append(piece)
        if current_sec is not None and kind != "footnote":
            current_sec["h"].append(piece)
        elif current_sec is None and ch["num"] == 8 and current_law and kind != "footnote":
            law_items.setdefault(current_law, []).append({"id": "", "t": "", "h": [piece]})
    close_to(0)
    return "\n".join(out) + "\n", law_items


def link_sections(h, all_ids):
    def repl(m):
        ref = m.group(1)
        target = ref
        while target and target not in all_ids:
            target = target.rsplit(".", 1)[0] if "." in target else ""
        if not target:
            return m.group(0)
        return f'<a href="/en/white-book/{all_ids[target]}/#{target}">§{ref}</a>'

    out, pos = [], 0
    for tag in re.finditer(r"<a\b.*?</a>|<[^>]+>", h, re.S):
        out.append(re.sub(r"§\s?(\d+(?:\.\d+)+)", repl, h[pos:tag.start()]))
        out.append(tag.group(0))
        pos = tag.end()
    out.append(re.sub(r"§\s?(\d+(?:\.\d+)+)", repl, h[pos:]))
    return "".join(out)


def main():
    chapters = parse(sys.argv[1])
    law_ids = load_law_ids(ROOT)
    all_ids = {}
    for ch in chapters:
        for kind, text, _ in ch["els"]:
            if kind in ("h2", "h3", "h4"):
                num, _ = heading_parts(text)
                if num:
                    all_ids[num] = ch["num"]
    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob("[0-9]*.html"):
        old.unlink()
    per_law = {}
    for ch in chapters:
        body, law_items = render(ch, law_ids, all_ids)
        title = ch["title"].strip().rstrip(".")
        title = title[:1] + title[1:].lower() if title.isupper() else title
        fm = front_matter(title=f"White Book {ch['num']}: {title}", short=title, num=ch["num"], weight=ch["num"] + 1)
        (OUT / f"{ch['num']}.html").write_text(fm + body)
        for k, v in law_items.items():
            per_law.setdefault(k, []).extend(
                {"id": s["id"], "t": s["t"], "h": "\n".join(s["h"]), "u": f"/en/white-book/{ch['num']}/"} for s in v)
    DATA.write_text(json.dumps(per_law, ensure_ascii=False, indent=1) + "\n")
    print(f"{len(chapters)} chapters, {sum(len(v) for v in per_law.values())} law notes for {len(per_law)} laws")


if __name__ == "__main__":
    main()
