#!/usr/bin/env python3
"""Generate the Laws of Duplicate Bridge pages (content/en/laws, content/cs/pravidla).

English text comes from the PZBS HTML edition (one file per law), Czech text from the
pdftotext output of the Czech translation (pravidla17.pdf).

    curl the PZBS pages into DIR/en/{introduction,def,ind,l1..l93}.html
    python3 bin/import-laws.py DIR path/to/pravidla17.pdf
"""

import html
import re
import subprocess
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EN_DIR = ROOT / "content/en/laws"
CS_DIR = ROOT / "content/cs/pravidla"
EN_URL = "/en/laws/"
CS_URL = "/pravidla/"
PZBS = "https://www.pzbs.pl/sedziowie/mpb/2017/en/"

ROMAN = {"i": 1, "ii": 2, "iii": 3, "iv": 4, "v": 5, "vi": 6, "vii": 7, "viii": 8, "ix": 9, "x": 10}

EXTRA_PAGES = {
    "intro": {"en": "introduction", "cs": "uvod", "weight": -3},
    "def": {"en": "definitions", "cs": "definice", "weight": -2},
    "index": {"en": "alphabetical-index", "cs": "rejstrik", "weight": 1000},
}


def plain(s):
    return re.sub(r"<[^>]+>.*?</[^>]+>|<[^>]+>", "", s).strip()


def sentence_case(s):
    s = s.strip().lower()
    return s[:1].upper() + s[1:]


def front_matter(**kv):
    lines = ["---"]
    for k, v in kv.items():
        if isinstance(v, bool):
            lines.append(f"{k}: {'true' if v else 'false'}")
        elif isinstance(v, int):
            lines.append(f"{k}: {v}")
        else:
            lines.append(f'{k}: "{v}"'.replace("\\", "\\\\") if '"' not in v else f"{k}: '{v}'")
    lines.append("---")
    return "\n".join(lines) + "\n"


# ---------------------------------------------------------------- English


def en_links(body, base):
    """Rewrite PZBS links (l12.html#C1, def.html, ind.html) to site URLs."""

    def repl(m):
        target = m.group(1)
        if target.startswith("#"):
            return f'href="{target}"'
        mm = re.match(r"l(\d+)\.html(#.*)?$", target)
        if mm:
            return f'href="{base}{mm.group(1)}/{mm.group(2) or ""}"'
        mm = re.match(r"(def|ind|introduction)\.html(#.*)?$", target)
        if mm:
            slug = {"def": "def", "ind": "index", "introduction": "intro"}[mm.group(1)]
            return f'href="{base}{EXTRA_PAGES[slug]["en" if base == EN_URL else "cs"]}/{mm.group(2) or ""}"'
        if re.match(r"l\d+-v1\.html", target):
            return f'href="{PZBS}{target}"'
        return m.group(0)

    return re.sub(r'href="([^"]*)"', repl, body)


def en_clean(body):
    body = re.sub(r'<a href="l\d+\.html">([^<]*)</a></a>', r"\1</a>", body)
    body = body.replace("Vulnerable/td>", "Vulnerable</td>")
    body = re.sub(r'<h2 id="([A-Z])">\s*(.*?)\s*</h2>',
                  lambda m: f'<h2 id="{m.group(1)}">{m.group(1)}. {m.group(2)}'.rstrip() + "</h2>", body)
    body = body.replace('id="przypis"', 'id="footnote"').replace('href="#przypis"', 'href="#footnote"')
    body = body.replace('class="przypis"', 'class="footnote"')
    body = re.sub(r"^[ \t]+", "", body, flags=re.M)
    body = re.sub(r"\n{3,}", "\n\n", body)
    return body.strip() + "\n"


def read_tresc(path):
    src = path.read_text(encoding="utf-8-sig")
    m = re.search(r'<div class="tresc">(.*)</div>', src, re.S)
    return m.group(1)


def english(pzbs_dir):
    laws = {}
    for n in range(1, 94):
        body = read_tresc(pzbs_dir / f"l{n}.html")
        h1 = re.search(r"<h1[^>]*>(.*?)</h1>", body, re.S)
        heading = html.unescape(h1.group(1)).strip().replace('href="#przypis"', 'href="#footnote"')
        body = body.replace(h1.group(0), "")
        rev = None
        m = re.search(r'<p class="rev2024info">.*?</p>', body, re.S)
        if m:
            rev = True
            body = body.replace(m.group(0), "")
        laws[n] = {"heading": heading, "body": en_clean(body), "rev2024": bool(rev)}
    extras = {}
    for key, fname in (("intro", "introduction"), ("def", "def"), ("index", "ind")):
        body = read_tresc(pzbs_dir / f"{fname}.html")
        body = re.sub(r"<h1[^>]*>.*?</h1>", "", body, flags=re.S)
        extras[key] = en_clean(body)
    return laws, extras


# ---------------------------------------------------------------- Czech

REF = r"\d{1,2}(?:[A-H](?:\d{1,2}(?:(?:\([a-z]\)|[a-z])(?:\([ivx]+\))?)?)?)?"
REF_LIST = rf"{REF}(?:(?:,\s*|\s+a\s+|\s+nebo\s+|\s*[–-]\s*){REF})*"


def ref_anchor(ref):
    m = re.match(r"(\d{1,2})(?:([A-H])(\d{1,2})?\(?([a-z])?\)?\(?([ivx]+)?\)?)?$", ref)
    if not m:
        return None
    law, sec, num, let, rom = m.groups()
    anchor = (sec or "") + (num or "") + (let or "") + (str(ROMAN[rom]) if rom else "")
    return int(law), anchor


def link_refs_cs(text, current):
    def link_one(ref):
        parsed = ref_anchor(ref)
        if not parsed or not 1 <= parsed[0] <= 93 or (parsed[0] == current and not parsed[1]):
            return ref
        law, anchor = parsed
        href = f"#{anchor}" if law == current and anchor else f"{CS_URL}{law}/" + (f"#{anchor}" if anchor else "")
        return f'<a href="{href}">{ref}</a>'

    def repl_list(m):
        return m.group(1) + re.sub(REF, lambda r: link_one(r.group(0)), m.group(2))

    text = re.sub(rf"(Pravid(?:lo|la|lu|lem|el|lům|lech|ly)\s+)({REF_LIST})(?![\w])", repl_list, text)

    def repl_local(m):
        anchor = re.sub(r"[()\s]", "", m.group(2))
        return f'{m.group(1)}<a href="#{anchor}">{m.group(2)}</a>'

    text = re.sub(r"((?:odstav\w*|Pravidlo)\s+)([A-H]\d{0,2}[a-z]?)(?![\w])", repl_local, text)
    return text


FN_MARK = "\x00FN{}\x00"


def cs_pages(pdf):
    txt = subprocess.run(["pdftotext", "-layout", str(pdf), "-"], capture_output=True, text=True, check=True).stdout
    txt = unicodedata.normalize("NFC", txt).replace("PravidIo", "Pravidlo")
    txt = txt.translate({0xF0A7: "♣", 0xF0A8: "♦", 0xF0A9: "♥", 0xF0AA: "♠", 0xF020: " "})
    txt = re.sub(r"[ \t]{5,}(v\. 67|12\. 9\. 2017|sine 93)[ \t]*$", "", txt, flags=re.M)
    txt = re.sub(r"žádným normálním 21$", "žádným normálním21", txt, flags=re.M)
    txt = re.sub(r"(normáln[íěí]\w*)21\b", r"\g<1>20", txt)
    pages = txt.split("\f")
    footnotes = {}
    expected = 1
    out = []
    for page in pages:
        lines = page.split("\n")
        lines = [l for l in lines if not re.match(r"^[\s♣♦♥♠]*Pravidla bridže[\s♣♦♥♠]*$", l)]
        lines = [l for l in lines if not re.match(r"^Strana: \d+", l)]
        # footnotes at the bottom of the page
        fn_start = None
        for i, l in enumerate(lines):
            m = re.match(r"^\s{0,8}(\d{1,2})(\s|$)", l)
            alone = re.fullmatch(r"\s*\d{1,2}\s*", l)
            if m and expected <= int(m.group(1)) < expected + 4 and (alone or i == 0 or not lines[i - 1].strip()):
                fn_start = i
                expected = int(m.group(1))
                break
        if fn_start is not None:
            block = lines[fn_start:]
            lines = lines[:fn_start]
            cur = None
            for l in block:
                m = re.match(r"^\s{0,8}(\d{1,2})(\s+(.*))?$", l)
                if m and expected <= int(m.group(1)) < expected + 4:
                    expected = int(m.group(1))
                    cur = expected
                    expected += 1
                    footnotes[cur] = (m.group(3) or "").strip()
                elif cur and l.strip():
                    footnotes[cur] = (footnotes[cur] + " " + l.strip()).strip()
            page_text = "\n".join(lines)
            for n in [k for k in footnotes if f"\x00FN{k}\x00" not in "".join(out) and k < expected]:
                pat = re.compile(rf"(?:(?<=[a-zá-ž]{{2}})|(?<=[A-ZÁ-Ž]{{3}})|(?<=[.)”“]))({n})(?!\d)")
                if pat.search(page_text):
                    page_text = pat.sub(FN_MARK.format(n), page_text)
            lines = page_text.split("\n")
        out.append("\n".join(lines))
    for k in footnotes:
        if k >= 10:
            pat = re.compile(rf"(?<=[a-zá-ž]{{2}})({k})(?!\d)")
            out = [pat.sub(FN_MARK.format(k), p) for p in out]
    # join pages; glue paragraphs split by a page break
    text = ""
    for p in out:
        p = p.strip("\n")
        if not text:
            text = p
            continue
        prev = text.rstrip()
        nxt = p.lstrip("\n")
        first = nxt.strip()[:1]
        if prev and not re.search(r"[.:;!?]\s*$", prev.split("\n")[-1]) and first.islower() and not MARKER.match(nxt.split("\n")[0]):
            text = prev + "\n" + nxt
        else:
            text = prev + "\n\n" + nxt
    return text, footnotes


MARKER = re.compile(r"^(\s*)(\d{1,2}\.|[a-z]\)|[ivx]+\.)(\s+|$)(.*)$")


def marker_info(m):
    raw = m.group(2)
    if raw[-1] == ")":
        return "a", raw[0]
    if re.fullmatch(r"[ivx]+\.", raw) and raw[:-1] in ROMAN and not raw[:-1].isdigit():
        return "i", str(ROMAN[raw[:-1]])
    return "1", raw[:-1]


LEVEL = {"1": 1, "a": 2, "i": 3}


def cs_law_html(lines, n, footnotes, heading_fn=""):
    groups, cur = [], []
    for l in lines:
        if l.strip():
            if cur and MARKER.match(l):
                ind_new = len(l) - len(l.lstrip())
                ind_first = len(cur[0]) - len(cur[0].lstrip())
                if ind_new <= ind_first:
                    groups.append(cur)
                    cur = []
            cur.append(l)
        elif cur:
            groups.append(cur)
            cur = []
    if cur:
        groups.append(cur)
    merged = []
    for g in groups:
        head = g[0].strip()
        if (merged and head[:1].islower() and not MARKER.match(g[0])
                and not re.search(r"[.:;!?)]$", merged[-1][-1].strip())):
            merged[-1].extend(g)
        else:
            merged.append(g)
    groups = merged

    def join(gl):
        return re.sub(r"\s+", " ", " ".join(x.strip() for x in gl)).strip()

    root = {"children": []}
    stack = []
    section = ""
    for g in groups:
        first = g[0]
        indent = len(first) - len(first.lstrip())
        sm = re.match(r"^\s{0,3}([A-H])\.\s+(.*)$", first)
        mm = MARKER.match(first)
        if sm:
            stack.clear()
            section = sm.group(1)
            rest = join([sm.group(2)] + g[1:])
            if len(g) == 1 and len(rest) < 90 and not rest.endswith((".", ":")):
                root["children"].append(("raw", f'<h2 id="{section}">{section}. {fmt(rest, n)}</h2>'))
            else:
                root["children"].append(("raw", f'<h2 id="{section}">{section}.</h2>'))
                root["children"].append(("p", fmt(rest, n)))
            continue
        if mm:
            kind, val = marker_info(mm)
            level = LEVEL[kind]
            while stack and stack[-1]["level"] >= level:
                stack.pop()
            parent = stack[-1] if stack else None
            item = {
                "level": level,
                "id": (parent["id"] if parent else section) + val,
                "value": str(ord(val) - 96) if kind == "a" else val,
                "text": fmt(join([mm.group(4)] + g[1:]), n),
                "text_indent": len(mm.group(1)) + len(mm.group(2)) + len(mm.group(3)),
                "children": [],
            }
            (parent or root)["children"].append(("li", item))
            stack.append(item)
            continue
        while stack and indent < stack[-1]["text_indent"] - 1:
            stack.pop()
        (stack[-1] if stack else root)["children"].append(("p", fmt(join(g), n)))

    def render(children):
        out, in_ol = [], False
        for kind, x in children:
            if kind == "li":
                if not in_ol:
                    out.append("<ol>")
                    in_ol = True
                cls = "" if x["text"] else ' class="no-preface"'
                out.append(f'<li id="{x["id"]}" value="{x["value"]}"{cls}>{x["text"]}' + render(x["children"]) + "</li>")
                continue
            if in_ol:
                out.append("</ol>")
                in_ol = False
            out.append(x if kind == "raw" else f"<p>{x}</p>")
        if in_ol:
            out.append("</ol>")
        return "\n".join(out)

    body = render(root["children"])
    used = list(dict.fromkeys(int(x) for x in re.findall(r"\x00FN(\d+)\x00", heading_fn + body)))
    body = re.sub(r"\x00FN(\d+)\x00", r'<sup><a href="#fn\1">\1</a></sup>', body)
    for k in used:
        body += f'\n<p class="footnote" id="fn{k}"><sup>{k}</sup> {fmt(footnotes[k], n)}</p>'
    return body + "\n"


def fmt(text, n):
    text = html.escape(text, quote=False)
    return link_refs_cs(text, n)


def czech(pdf):
    text, footnotes = cs_pages(pdf)
    parts = re.split(r"^\s*PRAVIDLO (\d+) – (.*)$", text, flags=re.M)
    laws = {}
    for i in range(1, len(parts), 3):
        n = int(parts[i])
        heading = parts[i + 1].strip()
        fn_head = ""
        m = re.search(r"\x00FN(\d+)\x00", heading)
        if m:
            heading = heading.replace(m.group(0), "")
            fn_head = f"\x00FN{m.group(1)}\x00"
        lines = parts[i + 2].split("\n")
        laws[n] = {"heading": heading.strip(), "lines": lines, "fn_head": fn_head}
    for n, law in laws.items():
        law["body"] = cs_law_html(law["lines"], n, footnotes, law["fn_head"])
        if law["fn_head"]:
            k = re.search(r"\d+", law["fn_head"]).group(0)
            law["heading_html"] = f'{law["heading"]}<sup><a href="#fn{k}">{k}</a></sup>'

    return laws


CS_TABLE_LABELS = [
    ("Neither Side Vulnerable", "Obě strany v první hře"), ("North-South Vulnerable", "Sever-Jih ve druhé hře"),
    ("East-West Vulnerable", "Východ-Západ ve druhé hře"), ("Both Sides Vulnerable", "Obě strany ve druhé hře"),
    ("North Dealer", "Rozdávající Sever"), ("East Dealer", "Rozdávající Východ"),
    ("South Dealer", "Rozdávající Jih"), ("West Dealer", "Rozdávající Západ"), ("Boards ", "Krabice "),
    ("Difference in points", "Rozdíl v bodech"),
    ("Scored by declarer’s side if the contract is fulfilled.", "Je získána stranou hlavního hráče, je-li závazek splněn."),
    ("Scored by declarer’s opponents if the contract is not fulfilled", "Získané soupeřem hlavního hráče, není-li závazek splněn."),
    ("Scored by declarer’s side", "Dosažené stranou hlavního hráče"),
    ("Trick Score", "Sazba za zdvihy"), ("Premium Score", "Prémie"), ("Undertrick Penalties", "Pokuty za pády"),
    ("A trick score of 100 points or more, made on one board, is GAME.", "Dosažení 100 a více bodů za zdvihy v jednom rozdání tvoří HRU."),
    ("A trick score of less than 100 points is a PARTSCORE.", "Dosažení méně než 100 bodů za zdvihy v jednom rozdání je ČÁSTEČNÝ ZÁVAZEK."),
    ("At a No-trump Contract", "V beztrumfovém závazku"), ("For each additional odd trick", "Za každý další zdvih"),
    ("For first odd trick bid and made", "Za první vydražený a splněný zdvih"),
    ("If all four players pass (see", "Pokud všichni čtyři hráči pasují (viz"), ("each side enters a zero score.", "každá strana získá nulový výsledek."),
    ("Premiums for Game, Partscore, Fulfilling Contract", "Prémie za hru, částečný závazek, splnění závazku"),
    ("Tricks by which declarer falls short of the contract", "Pády = zdvihy, které hlavnímu hráči chybí ke splnění závazku"),
    ("(tricks made in excess of contract)", "(zdvih získaný nad závazek)"),
    ("For each odd trick bid and made", "Za každý vydražený a splněný zdvih"),
    ("Bonus for the fourth and each subsequent undertrick", "Navíc: za čtvrtý a každý další pád"),
    ("For each additional undertrick", "Za každý další pád"), ("For first undertrick", "Za první pád"),
    ("For making GAME vulnerable", "Za splnění HRY ve druhé hře"), ("For making GAME, not vulnerable", "Za splnění HRY v první hře"),
    ("For making a slam", "Za splnění slemu"), ("For making any PARTSCORE", "Za splnění ČÁSTEČNÉHO ZÁVAZKU"),
    ("For making any doubled, but not redoubled contract", "Za splnění kontrovaného závazku"),
    ("For making any redoubled contract", "Za splnění rekontrovaného závazku"),
    ("Grand Slam (all 13 tricks) bid and made", "Velký slem (13 zdvihů) vydražený a splněný"),
    ("Small Slam (12 tricks) bid and made", "Malý slem (12 zdvihů) vydražený a splněný"),
    ("If Trumps are:", "Jsou-li trumfy:"), ("Not Vulnerable", "V 1. hře"), ("Vulnerable", "Ve 2. hře"),
    ("Trick Value", "hodnota zdvihu"), ("Undoubled", "Nekontrovaný"), ("Redoubled", "Rekontrovaný"), ("Doubled", "Kontrovaný"),
    ("Overtricks", "Nadzdvihy"), ("Undertricks", "Pády"), ("Slams", "Slemy"), ("For each", "Za každý nadzdvih"),
    ("<th>IMPs</th>", "<th>IMP</th>"), ('href="/en/laws/', 'href="/pravidla/'),
]


def cs_from_en_table(en_html):
    out = en_html
    for a, b in CS_TABLE_LABELS:
        out = out.replace(a, b)
    return out


def tables_cs(cs, en):
    tables = re.findall(r"<table>.*?</table>", en[2]["body"], re.S)
    body = cs[2]["body"]
    body = re.sub(r"<p>Rozdávající Sever Krabice.*?</p>", lambda m: cs_from_en_table(tables[0]), body)
    body = re.sub(r"<p>Obě strany v první hře Krabice.*?</p>", lambda m: cs_from_en_table(tables[1]), body)
    cs[2]["body"] = body
    cs[77]["body"] = cs_from_en_table(en_links(en[77]["body"], EN_URL))
    imp = re.search(r"<table>.*?</table>", en[78]["body"], re.S).group(0)
    cs[78]["body"] = re.sub(r"<p>Rozdíl Rozdíl Rozdíl.*?</p>", lambda m: cs_from_en_table(imp), cs[78]["body"])


# ---------------------------------------------------------------- output

INDEX_FM = """---
title: "{title}"
short: "{short}"
translationKey: "laws"
outputs: ["html", "json"]
cascade:
  type: laws
---
"""

INDEX_EN = """<p>The 2017 Laws of Duplicate Bridge of the World Bridge Federation, including the 2024 amendments to Laws 73 and 89.
Each law is on its own page; the list on the left stays visible, and the search box searches the text of all laws
(type a reference such as <code>64A2</code> to jump straight to it).</p>
<p>The English text follows the <a href="https://www.pzbs.pl/sedziowie/mpb/2017/en/home.html">HTML edition of the Polish Bridge Union (PZBS)</a>.</p>
"""

INDEX_CS = """<p>Mezinárodní pravidla bridže 2017 Světové bridžové federace (WBF). Každé pravidlo má vlastní stránku, seznam pravidel
vlevo je vždy po ruce a vyhledávání prochází text všech pravidel (napište odkaz jako <code>64A2</code> a přejdete přímo na něj).</p>
<p>Český text je překlad Pravidel 2017 (verze 67 ze září 2017). Úvod, definice a rejstřík český překlad neobsahuje,
proto jsou uvedeny anglicky. Změny Pravidel 73 a 89 z roku 2024 jsou jen v anglické verzi.</p>
<p>Anglický text vychází z <a href="https://www.pzbs.pl/sedziowie/mpb/2017/en/home.html">HTML vydání Polského bridžového svazu (PZBS)</a>.</p>
"""



def write(path, fm, body):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(fm + "\n" + body, encoding="utf-8")


def main(pzbs_dir, pdf):
    en, en_extra = english(Path(pzbs_dir) / "en")
    cs = czech(pdf)
    tables_cs(cs, en)

    for n in range(1, 94):
        e = en[n]
        write(EN_DIR / f"{n}.html",
              front_matter(title=f"Law {n}: {sentence_case(plain(e['heading']))}", short=sentence_case(plain(e["heading"])),
                           heading=e["heading"], law=n, weight=n, translationKey=f"law-{n}", rev2024=e["rev2024"]),
              en_links(e["body"], EN_URL))
        c = cs[n]
        write(CS_DIR / f"{n}.html",
              front_matter(title=f"Pravidlo {n}: {sentence_case(c['heading'])}", short=sentence_case(c["heading"]),
                           heading=c.get("heading_html", c["heading"]), law=n, weight=n, translationKey=f"law-{n}", rev2024=e["rev2024"]),
              c["body"])

    write(EN_DIR / "_index.html", INDEX_FM.format(title="Laws of Duplicate Bridge 2017", short="Contents"), INDEX_EN)
    write(CS_DIR / "_index.html", INDEX_FM.format(title="Pravidla bridže 2017", short="Obsah"), INDEX_CS)

    titles = {"intro": ("Introduction", "Úvod"), "def": ("Definitions", "Definice"), "index": ("Index", "Rejstřík")}
    for key, page in EXTRA_PAGES.items():
        t_en, t_cs = titles[key]
        write(EN_DIR / f"{page['en']}.html",
              front_matter(title=t_en, short=t_en, weight=page["weight"], translationKey=f"laws-{key}", extra=key),
              en_links(en_extra[key], EN_URL))
        write(CS_DIR / f"{page['cs']}.html",
              front_matter(title=t_cs, short=t_cs, weight=page["weight"], translationKey=f"laws-{key}", extra=key,
                           untranslated=True),
              en_links(en_extra[key], CS_URL))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
