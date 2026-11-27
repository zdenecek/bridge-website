type Child = Node | string | null | false | undefined | Child[];

function append(el: Element, child: Child) {
  if (Array.isArray(child)) child.forEach((c) => append(el, c));
  else if (child) el.append(child);
}

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number | boolean | null | undefined> = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    el.setAttribute(k, v === true ? '' : String(v));
  }
  append(el, children);
  return el;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

export function s(tag: string, attrs: Record<string, string | number> = {}, ...children: (Node | string)[]): SVGElement {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  el.append(...children);
  return el;
}
