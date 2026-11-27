import { h, s } from './dom';
import type { Texts } from './i18n';
import { type Call, type Contract, contract, isBid, isComplete, noteNumbers } from './auction';
import type { Analysis, Par } from './dd';
import { type Deal, type Hand, type Seat, SEATS, SUITS, dealShape, handSize, hcp, isVulnerable } from './model';
import { type Play, type PlayContract, type Position, sideOf, trickSeats } from './play';
import { type Run, defaultQuestion, paragraphs, pollContract, pollDeal, pollMeta, richRuns, trickTable } from './poll';

/** What the play mode shows: the contract, the position reached and, once solved, each playable card's value. */
export interface PlayView {
  play: Play;
  pos: Position;
  values: Map<string, number> | null;
  /** Declarer's double dummy tricks, to compare with at the end of an auto play. */
  ddTricks?: number;
}

/** In auto play the defenders' hands can stay hidden until the last card. */
function hiddenSeat(pv: PlayView, seat: Seat): boolean {
  return !!pv.play.auto && !!pv.play.hideDefenders && !!pv.pos.next && sideOf(seat) !== sideOf(pv.play.contract.declarer);
}

/** In auto play the defenders' cards are played for them. */
export function defendersTurn(pv: PlayView): boolean {
  return !!pv.pos.next && sideOf(pv.pos.next) !== sideOf(pv.play.contract.declarer);
}

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

/**
 * In play mode every card sits in a slot of the same width, numbered or not, and each hand keeps
 * the width of its longest suit at the start, so nothing moves as the turn passes or cards go.
 */
function hand(seat: Seat, cards: Hand, t: Texts, pv: PlayView | null = null, start: Hand = cards, hidden = false): HTMLElement {
  if (hidden) cards = { S: '', H: '', D: '', C: '' };
  const blank = handSize(cards) === 0;
  const toPlay = pv?.pos.next === seat;
  const clickable = toPlay && !(pv.play.auto && defendersTurn(pv));
  const values = pv?.play.auto ? null : pv?.values;
  const best = toPlay && values ? Math.max(...[...pv.pos.legal].map((c) => values.get(c) ?? 0)) : 0;
  const slots = (suit: (typeof SUITS)[number]) => [...cards[suit]].map((rank) => {
    const card = suit + rank;
    if (!clickable) return h('span', { class: 'hv-pc' }, rank);
    const legal = pv!.pos.legal.has(card);
    const value = legal ? values?.get(card) : undefined;
    const grade = value === undefined ? '' : ` hv-v${Math.min(2, best - value)}`;
    return h('button', { type: 'button', class: `hv-pc${grade}`, 'data-card': card, disabled: !legal },
      rank, value === undefined ? null : h('sub', {}, String(value)));
  });
  const longest = Math.max(1, ...SUITS.map((suit) => start[suit].length));
  const cls = `hv-hand hv-${seat.toLowerCase()}${blank && (!pv || hidden) ? ' hv-blank' : ''}${toPlay ? ' hv-to-play' : ''}${pv ? ' hv-playing' : ''}`;
  return h('div', { class: cls, 'data-seat': seat, title: t.seats[seat], style: pv ? `--n:${longest}` : null },
    SUITS.map((suit) => [
      h('span', { class: `hv-suit hv-suit-${suit.toLowerCase()}` }, SUIT_GLYPH[suit]),
      h('span', { class: 'hv-cards' }, pv && !hidden ? (cards[suit] ? slots(suit) : '—') : cards[suit] || (blank ? '' : '—')),
    ]),
  );
}

function trickView(pos: Position, deal: Deal, t: Texts): HTMLElement {
  const showLast = !pos.trick.length && pos.lastTrick;
  const cards = showLast ? trickSeats(pos.lastTrick!.cards, pos.lastTrick!.leader) : trickSeats(pos.trick, pos.leader);
  return h('div', { class: `hv-trick${showLast ? ' hv-trick-done' : ''}` },
    SEATS.map((seat) => {
      const card = cards[seat];
      const won = showLast && pos.lastTrick!.winner === seat;
      return h('span', { class: `hv-tc hv-tc-${seat.toLowerCase()}${won ? ' hv-tc-won' : ''}${pos.next === seat ? ' hv-tc-next' : ''}` },
        card ? [h('span', { class: `hv-suit-${card[0]!.toLowerCase()}` }, SUIT_GLYPH[card[0] as 'S']), card[1]!] : seat);
    }),
  );
}

export function playContractParts(c: PlayContract, t: Texts): Part[] {
  return [{ text: c.level ? String(c.level) : '' }, ...strainParts(c.strain, t), { text: ` ${c.declarer}` }];
}

function playBar(pv: PlayView, t: Texts): HTMLElement {
  const { pos, play } = pv;
  const c = play.contract;
  const declared = pos.won[sideOf(c.declarer)];
  let state: string;
  if (pos.next) state = `${t.toPlay}: ${t.seats[pos.next]}`;
  else if (c.level) {
    const diff = declared - c.level - 6;
    state = `${t.playDone}: ${diff === 0 ? '=' : diff > 0 ? `+${diff}` : `−${-diff}`}`;
  } else state = t.playDone;
  if (!pos.next && play.auto && pv.ddTricks !== undefined) state += ` · ${t.ddShort} ${pv.ddTricks}`;
  const act = (name: string, label: string, title: string, disabled = false) =>
    h('button', { type: 'button', class: 'hv-pb-btn', 'data-act': name, title, 'aria-label': title, disabled }, label);
  return h('div', { class: 'hv-playbar' },
    h('span', { class: 'hv-pb-contract', title: t.pickContract }, parts(playContractParts(c, t))),
    h('span', { class: 'hv-pb-tricks' }, `NS ${pos.won.NS} · EW ${pos.won.EW}`),
    h('span', { class: 'hv-pb-state' }, state),
    h('span', { class: 'hv-pb-acts' },
      h('button', { type: 'button', class: 'hv-pb-auto', 'data-act': 'auto', 'aria-pressed': String(!!play.auto), title: t.autoHelp }, 'Auto'),
      play.auto ? h('button', { type: 'button', class: 'hv-pb-auto', 'data-act': 'hide', 'aria-pressed': String(!!play.hideDefenders), title: t.hideSideHelp },
        t.hideSide(sideOf(c.declarer) === 'NS' ? 'EW' : 'NS')) : null,
      act('undo', '↶', t.undoCard, !play.played.length),
      act('restart', '⟲', t.restart, !play.played.length),
      act('close', '✕', t.stopPlay)),
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

function ddTable(dd: DdView, t: Texts, full: boolean, pick: PlayContract | null = null): HTMLElement {
  const table = dd.analysis?.table;
  return h('table', { class: `hv-dd${dd.busy ? ' hv-busy' : ''}`, 'aria-label': t.ddTitle, title: t.ddTitle },
    h('thead', {}, h('tr', {}, h('th', {}), DD_STRAINS.map((st) => h('th', {}, parts(strainParts(st, t)))))),
    h('tbody', {}, DD_SEATS.map((seat) => h('tr', {},
      h('th', {}, seat),
      DD_STRAINS.map((st) => {
        const n = table?.[seat][st];
        const cls = [full && n !== undefined && n >= 7 ? 'hv-makes' : '', pick && pick.declarer === seat && pick.strain === st ? 'hv-picked' : ''].join(' ').trim();
        return h('td', { class: cls || null, 'data-dd': pick ? `${seat}:${st}` : null }, n === undefined ? '·' : String(n));
      }),
    ))),
  );
}

function runs(list: Run[]): Node[] {
  return list.map((r) => {
    const node = r.suit ? h('span', { class: `hv-suit-${r.suit.toLowerCase()}` }, r.text) : document.createTextNode(r.text);
    return r.bold ? h('b', {}, node) : node;
  });
}

/** A bidding or play problem: the seat's own view of the deal beside the question. */
export function pollView(deal: Deal, t: Texts, play: Play | null): HTMLElement {
  const poll = deal.poll!;
  const table = trickTable(deal, play);
  const declarer = pollContract(deal, play)?.declarer;
  const dummy = declarer ? SEATS[(SEATS.indexOf(declarer) + 2) % 4] : null;
  const mark = (seat: Seat) => (seat === poll.you ? ` (${t.youMark})` : seat === dummy ? ` (${t.dummyMark})` : '');
  return h('div', { class: 'hv-poll' },
    h('div', { class: 'hv-poll-deal' }, diagram(pollDeal(deal, poll), t)),
    h('div', { class: 'hv-poll-text' },
      h('h2', {}, t.youAre(t.seats[poll.you])),
      h('p', { class: 'hv-poll-meta' }, runs(richRuns(pollMeta(deal, poll, t, play).join(' · ')))),
      paragraphs(poll.text).map((p) => h('p', {}, runs(p))),
      table ? h('table', { class: 'hv-poll-tricks' },
        h('thead', {}, h('tr', {}, h('th', {}, t.trick), table.seats.map((s) => h('th', {}, t.seats[s] + mark(s))))),
        h('tbody', {}, table.rows.map((r) => h('tr', {},
          h('td', {}, String(r.n)),
          table.seats.map((s) => {
            const card = r.cards[s];
            const cls = ['hv-tcard', r.winner === s ? 'hv-won' : '', r.leader === s ? 'hv-led' : ''].join(' ').trim();
            return h('td', {}, card ? h('span', { class: cls }, runs([{ text: SUIT_GLYPH[card[0] as 'S'], suit: card[0] as 'S' }, { text: card[1]! }])) : '');
          }),
        ))),
      ) : null,
      h('div', { class: 'hv-poll-question' }, runs(richRuns(poll.question || defaultQuestion(deal, t)))),
    ),
  );
}

export function diagram(deal: Deal, t: Texts, dd: DdView | null = null, pv: PlayView | null = null): HTMLElement {
  return h('div', { class: `hv-deal${pv ? ' hv-deal-playing' : ''}` }, pv ? playBar(pv, t) : null, board(deal, t, dd, pv), auctionTable(deal, t));
}

function board(deal: Deal, t: Texts, dd: DdView | null, pv: PlayView | null): HTMLElement {
  const shape = dealShape(deal);
  const full = shape.kind === 'full';
  const showHcp = deal.show.hcp && shape.kind !== 'ending';
  const showDd = (deal.show.dd || pv) && dd;
  const showTrick = pv && (pv.pos.trick.length || pv.pos.lastTrick);
  const points = SEATS.map((seat) => (handSize(deal.hands[seat]) ? String(hcp(deal.hands[seat])) : ''));
  return h('div', { class: 'hv-board' },
    SEATS.map((seat) => hand(seat, pv ? pv.pos.hands[seat] : deal.hands[seat], t, pv, deal.hands[seat], !!pv && hiddenSeat(pv, seat))),
    h('div', { class: 'hv-header' },
      deal.board ? h('span', { class: 'hv-num' }, String(deal.board)) : null,
      h('span', { class: 'hv-sub' }, `${t.vuls[deal.vul]} / ${deal.dealer}`),
    ),
    h('div', { class: 'hv-center' }, showTrick ? trickView(pv.pos, deal, t) : compass(deal, t)),
    showHcp ? h('div', { class: 'hv-hcp', 'aria-label': t.hcp, title: t.hcp },
      SEATS.map((seat, i) => h('span', { class: `hv-hcp-${seat.toLowerCase()}` }, points[i])),
    ) : null,
    showDd ? h('div', { class: 'hv-dd-wrap' }, ddTable(dd, t, full, pv?.play.contract ?? null)) : null,
    showDd && full && dd.analysis ? h('div', { class: `hv-par${dd.busy ? ' hv-busy' : ''}` }, h('b', {}, 'Par '), parts(parParts(dd.analysis.par, t))) : null,
  );
}
