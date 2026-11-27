const nav = document.getElementById("laws-nav");
const input = document.getElementById("laws-q");
const both = document.getElementById("laws-both");
const semanticBox = document.getElementById("laws-semantic");
const results = document.getElementById("laws-results");
const list = document.getElementById("laws-list");
const toggle = document.getElementById("laws-toggle");
const lang = input.dataset.lang;

const TEXT = {
  cs: {
    law: "Pravidlo",
    goto: "Přejít na",
    none: "Nic nenalezeno.",
    more: "Zobrazeno prvních {n} výsledků.",
    meaning: "Podobné významem",
    searching: "Hledám…",
  },
  en: {
    law: "Law",
    goto: "Go to",
    none: "No results.",
    more: "Showing the first {n} results.",
    meaning: "Similar in meaning",
    searching: "Searching…",
  },
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

// ---------------------------------------------------------------- semantic search

const EMBED = input.dataset.embed;
const SEM_MAX = 5;
const SEM_MIN = 0.5;
const SEM_SPREAD = 0.12;
const vectorSets = {};
const queryVectors = new Map();
let semanticOff = !EMBED;

function loadVectors(indexUrl) {
  const url = indexUrl.replace(/index\.json$/, "vectors.json");
  if (!vectorSets[url]) {
    vectorSets[url] = fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      })
      .then((v) => {
        const raw = atob(v.vectors);
        const vecs = new Int8Array(raw.length);
        for (let i = 0; i < raw.length; i++) vecs[i] = raw.charCodeAt(i);
        return { dim: v.dim, items: v.items, vecs };
      });
  }
  return vectorSets[url];
}

function embedQuery(q) {
  if (!queryVectors.has(q)) {
    const p = fetch(`${EMBED}?q=${encodeURIComponent(q)}`)
      .then((r) => {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      })
      .then((r) => {
        const v = Float32Array.from(r.data[0]);
        const norm = Math.hypot(...v) || 1;
        return v.map((x) => x / norm);
      });
    p.catch(() => queryVectors.delete(q));
    queryVectors.set(q, p);
  }
  return queryVectors.get(q);
}

function blockLookup(blocks) {
  if (!blocks.byAnchor) {
    blocks.byAnchor = new Map();
    for (const b of blocks) {
      if (b.title) continue;
      const key = `${b.page.u}#${b.anchor}`;
      const prev = blocks.byAnchor.get(key);
      blocks.byAnchor.set(key, prev ? { ...prev, text: `${prev.text} ${b.text}` } : b);
    }
  }
  return blocks.byAnchor;
}

async function semanticHits(q, sources) {
  const [qv, ...rest] = await Promise.all([embedQuery(q), ...sources.map(([u, l]) => Promise.all([loadVectors(u), loadIndex(u, l)]))]);
  const scored = [];
  for (const [{ dim, items, vecs }, blocks] of rest) {
    const lookup = blockLookup(blocks);
    for (let i = 0; i < items.length; i++) {
      let s = 0;
      const o = i * dim;
      for (let j = 0; j < dim; j++) s += qv[j] * vecs[o + j];
      const b = lookup.get(`${items[i][0]}#${items[i][1]}`);
      if (b) scored.push({ b, score: s / 127 });
    }
  }
  scored.sort((a, b) => b.score - a.score);
  const best = scored.length ? scored[0].score : 0;
  return scored.filter((x) => x.score >= Math.max(SEM_MIN, best - SEM_SPREAD)).slice(0, SEM_MAX).map((x) => x.b);
}

// ---------------------------------------------------------------- results

const RRF_K = 10;
const PRIORITY = 3;

function keyOf(b) {
  return b.title ? `${b.page.u}#~title` : `${b.page.u}#${b.anchor}`;
}

function wordScore(b, phrase, terms) {
  if (b.title) {
    const t = fold(b.page.t);
    if (t === phrase) return 100;
    return t.includes(phrase) ? 60 : 40;
  }
  if (b.folded.includes(phrase)) return terms.length >= 3 ? 80 : 20;
  return 10;
}

function merge(words, sem) {
  const entries = new Map();
  const add = (b, rank, kind) => {
    const key = keyOf(b);
    let e = entries.get(key);
    if (!e) {
      e = { b, score: 0, word: false, sem: false, priority: false, strong: false };
      entries.set(key, e);
    }
    if (e[kind]) return;
    e[kind] = true;
    e.score += 1 / (RRF_K + rank);
    if (rank < PRIORITY) e.priority = true;
  };
  words.forEach(({ b, score }, i) => {
    add(b, i, "word");
    if (score >= 60) entries.get(keyOf(b)).strong = true;
  });
  sem.forEach((b, i) => add(b, i, "sem"));
  const all = [...entries.values()];
  const order = (a, b) => b.strong - a.strong || b.score - a.score;
  return [...all.filter((e) => e.priority).sort(order), ...all.filter((e) => !e.priority).sort(order)];
}

function resultLink(b, href, body, tag = "") {
  const label = b.page.n ? `${b.page.n}${b.title ? "" : b.anchor.startsWith("fn") ? "" : b.anchor}` : b.page.t;
  const langTag = b.idxLang !== lang ? `<span class="r-lang">${b.idxLang.toUpperCase()}</span>` : "";
  return `<a href="${href}"><span class="r-ref">${escapeHtml(String(label))}</span>${langTag}${tag}<span class="r-snippet">${body}</span></a>`;
}

function shorten(text, n = 180) {
  return text.length > n ? text.slice(0, text.lastIndexOf(" ", n) > 0 ? text.lastIndexOf(" ", n) : n) + "…" : text;
}

let state = null;

function render() {
  const { q, ref, terms, words, semantic } = state;
  const out = [];
  if (ref) out.push(`<a href="${ref.href}">${ref.html}</a>`);

  const merged = merge(words, semantic || []);
  const qs = `?q=${encodeURIComponent(q)}`;
  const semTag = `<span class="r-lang" title="${TEXT[lang].meaning}">≈</span>`;
  for (const e of merged.slice(0, MAX_RESULTS)) {
    const b = e.b;
    if (e.word) {
      const href = b.page.u + qs + (b.anchor && !b.title ? `#${b.anchor}` : "");
      out.push(resultLink(b, href, b.title ? escapeHtml(b.page.t) : snippet(b.text, b.folded, terms)));
    } else {
      out.push(resultLink(b, b.page.u + (b.anchor ? `#${b.anchor}` : ""), escapeHtml(shorten(b.text)), semTag));
    }
  }
  if (!merged.length && !ref) {
    out.push(`<div class="r-info">${semantic === undefined ? TEXT[lang].searching : TEXT[lang].none}</div>`);
  }
  if (merged.length > MAX_RESULTS) out.push(`<div class="r-info">${TEXT[lang].more.replace("{n}", MAX_RESULTS)}</div>`);

  const keep = active;
  results.innerHTML = out.join("");
  active = -1;
  if (out.length) setActive(Math.max(0, keep));
}

let semTimer;

function semanticEnabled() {
  return !semanticOff && (!semanticBox || semanticBox.checked);
}

async function search() {
  const q = input.value.trim();
  clearTimeout(semTimer);
  if (!q) {
    results.hidden = true;
    results.innerHTML = "";
    list.hidden = false;
    state = null;
    return;
  }
  list.hidden = true;
  results.hidden = false;

  const ref = refResult(q);
  const terms = fold(q).split(/\s+/).filter((t) => t.length > 1 || /\d/.test(t));
  const phrase = fold(q).replace(/\s+/g, " ");
  const sources = [[input.dataset.index, lang]];
  if (both && both.checked && input.dataset.indexAlt) sources.push([input.dataset.indexAlt, lang === "cs" ? "en" : "cs"]);

  const words = [];
  if (terms.length) {
    const sets = await Promise.all(sources.map(([u, l]) => loadIndex(u, l)));
    if (input.value.trim() !== q) return;
    const seen = new Map();
    for (const blocks of sets) {
      for (const b of blocks) {
        if (!terms.every((t) => b.folded.includes(t))) continue;
        const hit = { b, score: wordScore(b, phrase, terms) };
        const prev = seen.get(keyOf(b));
        if (prev && prev.score >= hit.score) continue;
        seen.set(keyOf(b), hit);
      }
    }
    words.push(...[...seen.values()].sort((a, b) => b.score - a.score));
  }

  const wantSemantic = semanticEnabled() && !ref && q.length >= 3;
  state = { q, ref, terms, words, semantic: wantSemantic ? undefined : null };
  active = -1;
  render();

  if (!wantSemantic) return;
  const current = state;
  semTimer = setTimeout(async () => {
    let sem = [];
    try {
      sem = await semanticHits(q, sources);
    } catch (e) {
      if (String(e.message) === "404") semanticOff = true;
    }
    if (state !== current) return;
    state.semantic = sem;
    render();
  }, 350);
}

let timer;
input.addEventListener("input", () => {
  clearTimeout(timer);
  timer = setTimeout(search, 120);
});
input.addEventListener("focus", () => loadIndex(input.dataset.index, lang), { once: true });
if (both) both.addEventListener("change", search);
if (semanticBox) {
  try {
    if (localStorage.getItem("laws-semantic") === "0") semanticBox.checked = false;
  } catch (e) {}
  semanticBox.addEventListener("change", () => {
    try {
      localStorage.setItem("laws-semantic", semanticBox.checked ? "1" : "0");
    } catch (e) {}
    search();
  });
}

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
