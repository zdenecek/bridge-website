#!/usr/bin/env python3
"""Convert the WBF Commentary on the 2017 Laws PDF into content/en/wbf-commentary/ and
data/laws/commentary.json.

Usage: python3 bin/import-commentary.py 2017LawsCommentary.pdf   (needs `pip install pymupdf`)
"""
import html
import json
import pathlib
import re
import sys

import pymupdf

from guides_pdf import front_matter, join_lines, link_laws, load_law_ids, span_html, text_of

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "content/en/wbf-commentary"
DATA = ROOT / "data/laws/commentary.json"
TOP, BOTTOM, LEFT = 60, 725, 71
SUITS = "♠♥♦♣"
HEAD_RE = re.compile(r"Laws?\s+(\d{1,2})((?:[A-H]\d?(?:\([a-z]\))?)?)(?:\s*(?:and|-|–)\s*(\d{1,2})\b)?\s*(?:[–-]\s*(.*))?$")


def rows_of(page):
    lines = []
    for b in page.get_text("dict")["blocks"]:
        for l in b.get("lines", []):
            if TOP <= l["bbox"][1] <= BOTTOM and "".join(s["text"] for s in l["spans"]).strip():
                lines.append(l)
    lines.sort(key=lambda l: (round(l["bbox"][1]), l["bbox"][0]))
    rows = []
    for l in lines:
        if rows and abs(rows[-1][0] - l["bbox"][1]) < 2.5:
            rows[-1][1].append(l)
        else:
            rows.append([l["bbox"][1], [l]])
    return [sorted(r[1], key=lambda l: l["bbox"][0]) for r in rows]


def row_text(row):
    return " ".join("".join(s["text"] for s in l["spans"]).strip() for l in row).strip()


def is_heading(row):
    spans = [s for l in row for s in l["spans"] if s["text"].strip()]
    return (spans and all("Bold" in s["font"] for s in spans) and row[0]["bbox"][0] < LEFT + 3
            and len(row_text(row)) < 90 and not row_text(row).startswith(("*", ":")))


def is_diagram(row):
    t = row_text(row)
    segs = [l for l in row if "".join(s["text"] for s in l["spans"]).strip()]
    if any(c in t for c in SUITS) and (segs[0]["bbox"][0] > LEFT + 20 or len(segs) > 1) and len(t) < 70:
        return True
    return len(segs) >= 3 and all(len("".join(s["text"] for s in l["spans"]).strip()) < 14 for l in segs)


def diagram_html(rows):
    out = []
    for row in rows:
        line = ""
        if not row:
            out.append("")
            continue
        for l in row:
            t = "".join(s["text"] for s in l["spans"]).rstrip()
            if not t.strip():
                continue
            col = max(0, round((l["bbox"][0] - LEFT) / 6))
            line = line.ljust(col) + ("" if line.endswith(" ") or not line else " ") + t.strip()
        out.append(line.rstrip())
    while out and not out[-1]:
        out.pop()
    text = "\n".join(out)
    text = re.sub(r"\n{3,}", "\n\n", text)
    out = text.split("\n")
    return '<pre class="hand">' + html.escape("\n".join(out), quote=False) + "</pre>"


def parse(pdf):
    doc = pymupdf.open(pdf)
    els, para, diag = [], [], []

    def flush():
        nonlocal para, diag
        if para:
            x = para[0][0]
            body = join_lines([h for _, h in para])
            els.append(("p", body, "i1" if x > LEFT + 20 else ""))
        if diag:
            els.append(("diagram", diagram_html(diag), ""))
        para, diag = [], []

    for page in doc:
        prev_y = None
        for row in rows_of(page):
            y = row[0]["bbox"][1]
            gap = prev_y is not None and y - prev_y > 20
            prev_y = y
            if gap:
                if diag:
                    diag.append([])
                else:
                    flush()
            t = row_text(row)
            if not t:
                if diag:
                    diag.append([])
                else:
                    flush()
                continue
            if is_heading(row):
                flush()
                els.append(("heading", t, ""))
                continue
            if is_diagram(row):
                if para:
                    flush()
                diag.append(row)
                continue
            if diag and len(t) < 30 and not t.endswith("."):
                diag.append(row)
                continue
            if diag:
                flush()
            para.append((row[0]["bbox"][0], " ".join(span_html(l["spans"], body_size=12) for l in row)))
    flush()
    return els


def slug(t):
    return re.sub(r"[^a-z0-9]+", "-", text_of(t).lower()).strip("-")[:40]


def main():
    els = parse(sys.argv[1])
    law_ids = load_law_ids(ROOT)
    pages = [{"key": "general", "laws": [], "title": "General", "secs": []}]
    for kind, text, extra in els:
        if kind == "heading":
            if text.startswith("Commentary on the 2017"):
                continue
            m = HEAD_RE.match(text)
            if m:
                laws = [int(m.group(1))] + ([int(m.group(3))] if m.group(3) else [])
                cur = pages[-1]
                sid = f"{m.group(1)}{m.group(2)}" if m.group(2) else f"law-{m.group(1)}"
                if cur["laws"] and laws[0] in cur["laws"]:
                    cur["secs"].append({"id": sid, "t": text, "laws": laws, "h": []})
                else:
                    key = "-".join(str(n) for n in laws)
                    title = (m.group(4) or "").strip() or text
                    pages.append({"key": key, "laws": laws, "title": title, "head": text,
                                  "secs": [{"id": sid, "t": text, "laws": laws, "h": []}]})
            else:
                cur = pages[-1]
                cur["secs"].append({"id": slug(text), "t": text, "laws": cur["laws"], "h": [], "sub": True})
            continue
        piece = text if kind == "diagram" else (f'<p class="{extra}">{text}</p>' if extra else f"<p>{text}</p>")
        piece = link_laws(piece, law_ids)
        if not pages[-1]["secs"]:
            pages[-1]["secs"].append({"id": "", "t": "", "laws": [], "h": []})
        pages[-1]["secs"][-1]["h"].append(piece)

    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob("*.html"):
        if old.name != "_index.html":
            old.unlink()
    per_law = {}
    for i, p in enumerate(pages):
        body = []
        for s in p["secs"]:
            tag = "h3" if s.get("sub") else "h2"
            body.append(f'<section id="{s["id"]}">' if s["id"] else "<section>")
            if s["t"] and not (s is p["secs"][0] and p["laws"] and s["t"] == p.get("head")):
                body.append(f"<{tag}>{html.escape(s['t'])}</{tag}>")
            body.extend(s["h"])
            body.append("</section>")
            if p["laws"] and s["h"]:
                for n in s["laws"] or p["laws"]:
                    per_law.setdefault(str(n), []).append(
                        {"id": s["id"], "t": s["t"], "h": "\n".join(s["h"]), "u": f"/en/wbf-commentary/{p['key']}/"})
        num = ", ".join(str(n) for n in p["laws"]) if p["laws"] else None
        head = p.get("head", p["title"])
        title = f"WBF Commentary: {head}" if p["laws"] else "WBF Commentary: General"
        fm = front_matter(title=title, short=p["title"], num=num, weight=(p["laws"][0] if p["laws"] else 0) * 10 + i)
        (OUT / f"{p['key']}.html").write_text(fm + "\n".join(body) + "\n")
    DATA.write_text(json.dumps(per_law, ensure_ascii=False, indent=1) + "\n")
    print(f"{len(pages)} pages, notes for {len(per_law)} laws")


if __name__ == "__main__":
    main()
