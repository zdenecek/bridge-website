import { h, s } from './dom';
import type { Texts } from './i18n';
import { type Call, type Contract, contract, isBid, isComplete, noteNumbers } from './auction';
import type { Analysis, Par } from './dd';
import { type Deal, type Hand, type Seat, SEATS, SUITS, dealShape, handSize, hcp, isVulnerable } from './model';

export const SUIT_GLYPH = { S: '♠', H: '♥', D: '♦', C: '♣' } as const;

/** Four touching discs as in the Tournament Calculator, the dealer's drawn to a point outwards. */
const COMPASS = [
  { seat: 'N', x: 84, y: 42, angle: 0 },
  { seat: 'E', x: 126, y: 84, angle: 90 },
  { seat: 'S', x: 84, y: 126, angle: 180 },
  { seat: 'W', x: 42, y: 84, angle: 270 },
] as const;

const DEALER_DISC = 'M84 2.4 L103.8 22.2 A28 28 0 1 1 64.2 22.2 Z';

export function compass(deal: Deal, t: Texts): SVGElement {
  const svg = s('svg', { class: 'hv-compass', viewBox: '0 0 168 168', role: 'img', 'aria-label': t.compass(deal.dealer, t.vuls[deal.vul]) });
  for (const { seat, x, y, angle } of COMPASS) {
    const fill = isVulnerable(seat, deal.vul) ? 'var(--hv-vul)' : 'var(--hv-nonvul)';
    const disc = seat === deal.dealer
      ? s('path', { d: DEALER_DISC, transform: `rotate(${angle} 84 84)`, fill })
      : s('circle', { cx: x, cy: y, r: 28, fill });
    svg.append(s('g', {}, disc, s('text', { x, y, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, seat)));
  }
  return svg;
}

function hand(seat: Seat, cards: Hand, t: Texts): HTMLElement {
  const blank = handSize(cards) === 0;
  return h('div', { class: `hv-hand hv-${seat.toLowerCase()}${blank ? ' hv-blank' : ''}`, 'data-seat': seat, title: t.seats[seat] },
    SUITS.map((suit) => [
      h('span', { class: `hv-suit hv-suit-${suit.toLowerCase()}` }, SUIT_GLYPH[suit]),
      h('span', { class: 'hv-cards' }, cards[suit] || (blank ? '' : '—')),
    ]),
  );
}

export const AUCTION_SEATS: Seat[] = ['W', 'N', 'E', 'S'];

export type AuctionCell = { call: Call; index: number } | { allPass: true; span: number } | null;

/** The auction as rows under W N E S, the final three passes shown as one "All pass". */
export function auctionRows(calls: Call[], dealer: Seat): AuctionCell[][] {
  const cells: AuctionCell[] = Array(AUCTION_SEATS.indexOf(dealer)).fill(null);
  const shown = isComplete(calls) && calls.some(isBid) ? calls.slice(0, -3) : calls;
  cells.push(...shown.map((call, index) => ({ call, index })));
  if (shown !== calls) cells.push({ allPass: true, span: 4 - (cells.length % 4) });
  const rows: AuctionCell[][] = [];
  for (let i = 0; i < cells.length; i += 4) rows.push(cells.slice(i, i + 4));
  return rows;
}

/** A call as text pieces, the suit as its glyph, so both the page and the image can colour it. */
export function callParts(call: Call, t: Texts): { text: string; suit?: keyof typeof SUIT_GLYPH }[] {
  if (call === 'P') return [{ text: t.pass }];
  if (!isBid(call)) return [{ text: call }];
  const strain = call[1]!;
  return strain === 'N' ? [{ text: call[0] + t.nt }] : [{ text: call[0]! }, { text: SUIT_GLYPH[strain as 'S'], suit: strain as 'S' }];
}

export function contractParts(deal: Deal, t: Texts): { text: string; suit?: keyof typeof SUIT_GLYPH }[] | null {
  const c = contract(deal.auction, deal.dealer);
  if (!c) return null;
  if (c === 'passout') return [{ text: t.passout }];
  const bid = callParts(`${c.level}${c.strain}`, t);
  return [{ text: `${t.contract} ` }, ...bid, { text: `${(c as Contract).doubled} ${t.by} ${c.declarer}` }];
}

function parts(list: { text: string; suit?: string }[]): Node[] {
  return list.map((p) => (p.suit ? h('span', { class: `hv-suit-${p.suit.toLowerCase()}` }, p.text) : document.createTextNode(p.text)));
}

function auctionTable(deal: Deal, t: Texts): HTMLElement | null {
  if (!deal.auction.length) return null;
  const head = AUCTION_SEATS.map((seat) =>
    h('th', { class: isVulnerable(seat, deal.vul) ? 'hv-vul' : '', title: t.seats[seat], 'data-seat': seat, 'aria-label': seat }));
  const numbers = noteNumbers(deal.notes);
  const rows = auctionRows(deal.auction, deal.dealer).map((row) => h('tr', {}, row.map((cell) => {
    if (!cell) return h('td', {});
    if ('allPass' in cell) return h('td', { colspan: cell.span, class: 'hv-allpass' }, t.allPass);
    const n = numbers.get(cell.index);
    const call = h('span', { class: `hv-call-text${deal.notes[cell.index]?.alert ? ' hv-alerted' : ''}` }, parts(callParts(cell.call, t)));
    return h('td', { class: cell.call === 'P' ? 'hv-pass' : null, 'data-index': cell.index },
      call, n ? h('sup', { class: 'hv-note-ref' }, String(n)) : null);
  })));
  const result = contractParts(deal, t);
  const footnotes = [...numbers].map(([i, n]) => h('li', { 'data-index': i }, h('sup', {}, String(n)), ' ', deal.notes[i]!.note!));
  return h('div', { class: 'hv-auction-wrap' },
    h('table', { class: 'hv-auction', 'aria-label': t.auction }, h('thead', {}, h('tr', {}, head)), h('tbody', {}, rows)),
    footnotes.length ? h('ol', { class: 'hv-notes' }, footnotes) : null,
    result ? h('p', { class: 'hv-contract' }, parts(result)) : null,
  );
}

/** Double dummy state: the analysis to show, and whether a newer one is on its way. */
export interface DdView {
  analysis: Analysis | null;
  busy: boolean;
}

export const DD_SEATS: Seat[] = ['N', 'S', 'E', 'W'];
export const DD_STRAINS = ['NT', 'S', 'H', 'D', 'C'] as const;

export function strainParts(strain: string, t: Texts): Part[] {
  return strain === 'NT' || strain === 'N' ? [{ text: t.nt }] : [{ text: SUIT_GLYPH[strain as 'S'], suit: strain as 'S' }];
}

type Part = { text: string; suit?: keyof typeof SUIT_GLYPH };

/** Par contracts and the score from North–South's side, e.g. "4♠ S, +620" or "5♦X−1 EW, +300". */
export function parParts(par: Par, t: Texts): Part[] {
  const out: Part[] = [];
  par.contracts.forEach((c, i) => {
    if (i) out.push({ text: ', ' });
    out.push({ text: String(c.level) }, ...strainParts(c.strain, t));
    const result = c.result > 0 ? `+${c.result}` : c.result < 0 ? `−${-c.result}` : '';
    out.push({ text: `${c.doubled ? 'X' : ''}${result} ${c.declarer}` });
  });
  if (!par.contracts.length) out.push({ text: t.passout.replace(/\.$/, '') });
  out.push({ text: `, ${par.score > 0 ? '+' : par.score < 0 ? '−' : ''}${Math.abs(par.score)}` });
  return out;
}

function ddTable(dd: DdView, t: Texts, full: boolean): HTMLElement {
  const table = dd.analysis?.table;
  return h('table', { class: `hv-dd${dd.busy ? ' hv-busy' : ''}`, 'aria-label': t.ddTitle, title: t.ddTitle },
    h('thead', {}, h('tr', {}, h('th', {}), DD_STRAINS.map((st) => h('th', {}, parts(strainParts(st, t)))))),
    h('tbody', {}, DD_SEATS.map((seat) => h('tr', {},
      h('th', {}, seat),
      DD_STRAINS.map((st) => {
        const n = table?.[seat][st];
        return h('td', { class: full && n !== undefined && n >= 7 ? 'hv-makes' : null }, n === undefined ? '·' : String(n));
      }),
    ))),
  );
}

export function diagram(deal: Deal, t: Texts, dd: DdView | null = null): HTMLElement {
  return h('div', { class: 'hv-deal' }, board(deal, t, dd), auctionTable(deal, t));
}

function board(deal: Deal, t: Texts, dd: DdView | null): HTMLElement {
  const shape = dealShape(deal);
  const full = shape.kind === 'full';
  const showHcp = deal.show.hcp && shape.kind !== 'ending';
  const showDd = deal.show.dd && dd;
  const points = SEATS.map((seat) => (handSize(deal.hands[seat]) ? String(hcp(deal.hands[seat])) : ''));
  return h('div', { class: 'hv-board' },
    SEATS.map((seat) => hand(seat, deal.hands[seat], t)),
    h('div', { class: 'hv-header' },
      deal.board ? h('span', { class: 'hv-num' }, String(deal.board)) : null,
      h('span', { class: 'hv-sub' }, `${t.vuls[deal.vul]} / ${deal.dealer}`),
    ),
    h('div', { class: 'hv-center' }, compass(deal, t)),
    showHcp ? h('div', { class: 'hv-hcp', 'aria-label': t.hcp, title: t.hcp },
      SEATS.map((seat, i) => h('span', { class: `hv-hcp-${seat.toLowerCase()}` }, points[i])),
    ) : null,
    showDd ? h('div', { class: 'hv-dd-wrap' }, ddTable(dd, t, full)) : null,
    showDd && full && dd.analysis ? h('div', { class: `hv-par${dd.busy ? ' hv-busy' : ''}` }, h('b', {}, 'Par '), parts(parParts(dd.analysis.par, t))) : null,
  );
}
