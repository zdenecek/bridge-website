import html
import re

LAW_REF = re.compile(r"\b(Laws?)(\s+)(\d{1,2})([A-H](?:\d{1,2}(?:\s?\([a-z]{1,4}\))?)?)?(?!\d|\.\d)")


def law_anchor(part):
    m = re.match(r"([A-H])(\d{1,2})?(?:\s?\(([a-z]{1,4})\))?", part or "")
    if not m:
        return ""
    return m.group(1) + (m.group(2) or "") + (m.group(3) if m.group(3) and len(m.group(3)) == 1 and m.group(2) else "")


def link_laws(text, laws_ids):
    def repl(m):
        word, space, num, part = m.group(1), m.group(2), int(m.group(3)), m.group(4)
        if not 1 <= num <= 93:
            return m.group(0)
        anchor = law_anchor(part)
        while anchor and anchor not in laws_ids.get(num, set()):
            anchor = anchor[:-1]
        href = f"/en/laws/{num}/" + (f"#{anchor}" if anchor else "")
        return f'{word}{space}<a href="{href}">{num}{part or ""}</a>'

    out, pos = [], 0
    for tag in re.finditer(r"<a\b.*?</a>|<[^>]+>", text, re.S):
        out.append(LAW_REF.sub(repl, text[pos:tag.start()]))
        out.append(tag.group(0))
        pos = tag.end()
    out.append(LAW_REF.sub(repl, text[pos:]))
    return "".join(out)


def load_law_ids(root):
    ids = {}
    for p in (root / "content/en/laws").glob("*.html"):
        if p.stem.isdigit():
            ids[int(p.stem)] = set(re.findall(r'id="([^"]+)"', p.read_text()))
    return ids


def span_html(spans, small_as_sup=True, body_size=11):
    out = []
    for s in spans:
        t = html.escape(s["text"], quote=False)
        if not t:
            continue
        if small_as_sup and s["size"] < body_size - 2.5 and t.strip().isdigit():
            out.append(f"<sup>{t.strip()}</sup>")
            continue
        bold = "Bold" in s["font"] or s["flags"] & 16
        italic = "Italic" in s["font"] or s["flags"] & 2
        if t.strip():
            if bold:
                t = f"<strong>{t}</strong>"
            if italic:
                t = f"<em>{t}</em>"
        out.append(t)
    h = "".join(out)
    h = re.sub(r"</strong>(\s*)<strong>", r"\1", h)
    h = re.sub(r"</em>(\s*)<em>", r"\1", h)
    return h


def join_lines(lines):
    out = ""
    for ln in lines:
        ln = ln.rstrip()
        if not ln.strip():
            continue
        if out.endswith("-") and not out.endswith(" -") and re.match(r"[a-z]", re.sub(r"<[^>]+>", "", ln.strip())[:1] or "x"):
            out = out[:-1] + ln.lstrip()
        elif out:
            out = out + " " + ln.strip()
        else:
            out = ln.strip()
    return re.sub(r"\s{2,}", " ", out).strip()


def text_of(h):
    return html.unescape(re.sub(r"<[^>]+>", "", h)).strip()


def front_matter(**kw):
    lines = ["---"]
    for k, v in kw.items():
        if v is None:
            continue
        if isinstance(v, bool):
            lines.append(f"{k}: {'true' if v else 'false'}")
        elif isinstance(v, (int, float)):
            lines.append(f"{k}: {v}")
        elif isinstance(v, list):
            lines.append(f"{k}: [{', '.join(str(x) for x in v)}]")
        else:
            lines.append(f'{k}: "{v.replace(chr(34), chr(39))}"')
    lines.append("---")
    return "\n".join(lines) + "\n\n"
