const nav = document.getElementById("laws-nav");
const input = document.getElementById("laws-q");
const both = document.getElementById("laws-both");
const results = document.getElementById("laws-results");
const list = document.getElementById("laws-list");
const toggle = document.getElementById("laws-toggle");
const lang = input.dataset.lang;

const TEXT = {
  cs: { law: "Pravidlo", goto: "Přejít na", none: "Nic nenalezeno.", more: "Zobrazeno prvních {n} výsledků." },
  en: { law: "Law", goto: "Go to", none: "No results.", more: "Showing the first {n} results." },
};
const MAX_RESULTS = 60;

const fold = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function escapeHtml(s) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
}

// ---------------------------------------------------------------- current law in the list

const current = list.querySelector("a.current");
if (current) {
  nav.scrollTop = current.offsetTop - nav.clientHeight / 2;
}

toggle.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  toggle.setAttribute("aria-expanded", open);
});

// ---------------------------------------------------------------- index

const indexes = {};

function loadIndex(url, idxLang) {
  if (!indexes[url]) {
    indexes[url] = fetch(url)
      .then((r) => r.json())
      .then((pages) => buildBlocks(pages, idxLang));
  }
  return indexes[url];
}

function ownText(el) {
  const clone = el.cloneNode(true);
  clone.querySelectorAll("ol, ul, sup").forEach((x) => x.remove());
  return clone.textContent.replace(/\s+/g, " ").trim();
}

function buildBlocks(pages, idxLang) {
  const blocks = [];
  const parser = new DOMParser();
  for (const page of pages) {
    const doc = parser.parseFromString(`<div>${page.c}</div>`, "text/html");
    const title = page.n ? `${page.n} ${page.t}` : page.t;
    blocks.push({ page, idxLang, anchor: "", text: title, folded: fold(title), title: true });
    for (const el of doc.querySelectorAll("h2, li, p, dt, dd, td")) {
      const text = ownText(el);
      if (!text) continue;
      const holder = el.id ? el : el.closest("[id]");
      blocks.push({ page, idxLang, anchor: holder ? holder.id : "", text, folded: fold(text) });
    }
  }
  return blocks;
}

// ---------------------------------------------------------------- search

const REF_RE = /^(?:law|l|pravidlo|p)?\s*(\d{1,2})\s*([a-h])?\s*(\d{1,2})?\s*\(?([a-z])?\)?$/i;

function refResult(q) {
  const m = q.trim().match(REF_RE);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  if (n < 1 || n > 93) return null;
  const link = list.querySelector(`.laws-items a[href$="/${n}/"]`);
  if (!link) return null;
  const anchor = (m[2] || "").toUpperCase() + (m[3] || "") + (m[4] || "").toLowerCase();
  const label = `${n}${anchor}`;
  return {
    href: link.getAttribute("href") + (anchor ? `#${anchor}` : ""),
    html: `<span class="r-ref">${TEXT[lang].goto} ${TEXT[lang].law.toLowerCase()} ${escapeHtml(label)}</span><span class="r-snippet">${escapeHtml(link.querySelector(".t").textContent)}</span>`,
  };
}

function snippet(text, folded, terms) {
  let pos = folded.indexOf(terms[0]);
  if (pos < 0) pos = 0;
  const start = Math.max(0, pos - 60);
  const end = Math.min(text.length, pos + 120);
  let out = "";
  let last = start;
  const ranges = [];
  for (const t of terms) {
    let i = folded.indexOf(t, start);
    while (i >= 0 && i < end) {
      ranges.push([i, Math.min(end, i + t.length)]);
      i = folded.indexOf(t, i + t.length);
    }
  }
  ranges.sort((a, b) => a[0] - b[0]);
  for (const [a, b] of ranges) {
    if (a < last) continue;
    out += escapeHtml(text.slice(last, a)) + "<mark>" + escapeHtml(text.slice(a, b)) + "</mark>";
    last = b;
  }
  out += escapeHtml(text.slice(last, end));
  return (start > 0 ? "…" : "") + out + (end < text.length ? "…" : "");
}

let active = -1;

function setActive(i) {
  const items = results.querySelectorAll("a");
  items.forEach((a) => a.classList.remove("active"));
  if (!items.length) return;
  active = Math.max(0, Math.min(items.length - 1, i));
  items[active].classList.add("active");
  items[active].scrollIntoView({ block: "nearest" });
}

async function search() {
  const q = input.value.trim();
  if (!q) {
    results.hidden = true;
    results.innerHTML = "";
    list.hidden = false;
    return;
  }
  list.hidden = true;
  results.hidden = false;

  const out = [];
  const ref = refResult(q);
  if (ref) out.push(`<a href="${ref.href}">${ref.html}</a>`);

  const terms = fold(q).split(/\s+/).filter((t) => t.length > 1 || /\d/.test(t));
  if (terms.length) {
    const urls = [[input.dataset.index, lang]];
    if (both && both.checked && input.dataset.indexAlt) urls.push([input.dataset.indexAlt, lang === "cs" ? "en" : "cs"]);
    const sets = await Promise.all(urls.map(([u, l]) => loadIndex(u, l)));
    if (input.value.trim() !== q) return;
    const hits = [];
    for (const blocks of sets) {
      for (const b of blocks) {
        if (terms.every((t) => b.folded.includes(t))) hits.push(b);
      }
    }
    hits.sort((a, b) => (b.title === true) - (a.title === true));
    const qs = `?q=${encodeURIComponent(q)}`;
    for (const b of hits.slice(0, MAX_RESULTS)) {
      const label = b.page.n ? `${b.page.n}${b.title ? "" : b.anchor.startsWith("fn") ? "" : b.anchor}` : b.page.t;
      const langTag = b.idxLang !== lang ? `<span class="r-lang">${b.idxLang.toUpperCase()}</span>` : "";
      const href = b.page.u + qs + (b.anchor && !b.title ? `#${b.anchor}` : "");
      const body = b.title ? escapeHtml(b.page.t) : snippet(b.text, b.folded, terms);
      out.push(`<a href="${href}"><span class="r-ref">${escapeHtml(String(label))}</span>${langTag}<span class="r-snippet">${body}</span></a>`);
    }
    if (!hits.length && !ref) out.push(`<div class="r-info">${TEXT[lang].none}</div>`);
    if (hits.length > MAX_RESULTS) out.push(`<div class="r-info">${TEXT[lang].more.replace("{n}", MAX_RESULTS)}</div>`);
  }
  results.innerHTML = out.join("");
  active = -1;
  if (out.length) setActive(0);
}

let timer;
input.addEventListener("input", () => {
  clearTimeout(timer);
  timer = setTimeout(search, 120);
});
input.addEventListener("focus", () => loadIndex(input.dataset.index, lang), { once: true });
if (both) both.addEventListener("change", search);

input.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown") {
    setActive(active + 1);
    e.preventDefault();
  } else if (e.key === "ArrowUp") {
    setActive(active - 1);
    e.preventDefault();
  } else if (e.key === "Enter") {
    const a = results.querySelectorAll("a")[active];
    if (a) window.location.href = a.href;
    e.preventDefault();
  } else if (e.key === "Escape") {
    input.value = "";
    search();
  }
});

document.addEventListener("keydown", (e) => {
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
  if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === "/") {
    input.focus();
    e.preventDefault();
  } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
    const a = document.querySelector(`.laws-pager a[data-nav="${e.key === "ArrowLeft" ? "prev" : "next"}"]`);
    if (a) window.location.href = a.href;
  }
});

// ---------------------------------------------------------------- highlight search terms on arrival

function highlight(root, terms) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    const text = node.nodeValue;
    const folded = fold(text);
    if (folded.length !== text.length) continue;
    const ranges = [];
    for (const t of terms) {
      let i = folded.indexOf(t);
      while (i >= 0) {
        ranges.push([i, i + t.length]);
        i = folded.indexOf(t, i + t.length);
      }
    }
    if (!ranges.length) continue;
    ranges.sort((a, b) => a[0] - b[0]);
    const frag = document.createDocumentFragment();
    let last = 0;
    for (const [a, b] of ranges) {
      if (a < last) continue;
      frag.append(text.slice(last, a));
      const mark = document.createElement("mark");
      mark.textContent = text.slice(a, b);
      frag.append(mark);
      last = b;
    }
    frag.append(text.slice(last));
    node.replaceWith(frag);
  }
}

const params = new URLSearchParams(window.location.search);
const content = document.querySelector(".law-content");
if (params.get("q") && content) {
  const terms = fold(params.get("q")).split(/\s+/).filter((t) => t.length > 1);
  if (terms.length && !REF_RE.test(params.get("q").trim())) highlight(content, terms);
  if (!window.location.hash) {
    const first = content.querySelector("mark");
    if (first) first.scrollIntoView({ block: "center" });
  }
}

// ---------------------------------------------------------------- keep the paragraph when switching language

document.querySelectorAll(".law-translation a").forEach((a) => {
  a.addEventListener("click", () => {
    if (window.location.hash) a.href = a.href.split("#")[0] + window.location.hash;
  });
});

// ---------------------------------------------------------------- reference badges next to paragraphs

document.querySelectorAll(".law-refs li[data-anchor]").forEach((li, i) => {
  const target = content && content.querySelector(`#${CSS.escape(li.dataset.anchor)}`);
  if (!target) return;
  li.id = li.id || `ref-${i + 1}`;
  const badge = document.createElement("a");
  badge.className = "law-ref-badge";
  badge.href = `#${li.id}`;
  badge.textContent = li.dataset.source;
  const nested = target.querySelector(":scope > ol");
  if (nested) target.insertBefore(badge, nested);
  else target.append(badge);
});
