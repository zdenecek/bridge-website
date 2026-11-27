import type { Annotation } from './auction';
import type { Poll } from './poll';

export const SEATS = ['N', 'E', 'S', 'W'] as const;
export type Seat = (typeof SEATS)[number];

export const SUITS = ['S', 'H', 'D', 'C'] as const;
export type Suit = (typeof SUITS)[number];

export const VULS = ['None', 'NS', 'EW', 'All'] as const;
export type Vul = (typeof VULS)[number];

export const RANKS = 'AKQJT98765432';

/** Ranks of each suit, highest first, e.g. { S: 'AKQ2', H: 'K73', D: '', C: 'T98654' }. */
export type Hand = Record<Suit, string>;

export interface Deal {
  board: number | null;
  dealer: Seat;
  vul: Vul;
  hands: Record<Seat, Hand>;
  /** Calls from the dealer on, as in auction.ts. */
  auction: string[];
  /** Alerts and notes, by the index of the call they belong to. */
  notes: Annotation[];
  show: { hcp: boolean; dd: boolean };
  /** Set while the deal is shown as a poll. */
  poll: Poll | null;
}

/** A full deal, an ending with the same number of cards in every hand, or a deal still being entered. */
export type Shape =
  | { kind: 'full' }
  | { kind: 'ending'; cards: number }
  | { kind: 'partial'; missing: number }
  | { kind: 'clash' };

export type HandError =
  | { code: 'rank'; char: string }
  | { code: 'parts' }
  | { code: 'before-suit' }
  | { code: 'duplicate'; card: string }
  | { code: 'too-many'; count: number };

export function emptyHand(): Hand {
  return { S: '', H: '', D: '', C: '' };
}

export function emptyDeal(board: number | null = 1): Deal {
  return {
    board,
    dealer: board ? boardDealer(board) : 'N',
    vul: board ? boardVul(board) : 'None',
    hands: { N: emptyHand(), E: emptyHand(), S: emptyHand(), W: emptyHand() },
    auction: [],
    notes: [],
    show: { hcp: true, dd: true },
    poll: null,
  };
}

export function boardDealer(board: number): Seat {
  return SEATS[(board - 1) % 4]!;
}

const VUL_CYCLE: Vul[] = ['None', 'NS', 'EW', 'All', 'NS', 'EW', 'All', 'None', 'EW', 'All', 'None', 'NS', 'All', 'None', 'NS', 'EW'];

export function boardVul(board: number): Vul {
  return VUL_CYCLE[(board - 1) % 16]!;
}

export function isVulnerable(seat: Seat, vul: Vul): boolean {
  if (vul === 'All') return true;
  if (vul === 'None') return false;
  return vul.includes(seat);
}

export function sortRanks(ranks: string): string {
  return [...new Set(ranks)].sort((a, b) => RANKS.indexOf(a) - RANKS.indexOf(b)).join('');
}

export function handSize(hand: Hand): number {
  return SUITS.reduce((n, s) => n + hand[s].length, 0);
}

const POINTS: Record<string, number> = { A: 4, K: 3, Q: 2, J: 1 };

export function hcp(hand: Hand): number {
  return SUITS.reduce((sum, s) => sum + [...hand[s]].reduce((n, r) => n + (POINTS[r] ?? 0), 0), 0);
}

export function handToString(hand: Hand): string {
  return handSize(hand) === 0 ? '' : SUITS.map((s) => hand[s]).join('.');
}

const SUIT_MARKS: Record<string, Suit> = {
  S: 'S', '♠': 'S', '♤': 'S',
  H: 'H', '♥': 'H', '♡': 'H',
  D: 'D', '♦': 'D', '♢': 'D',
  C: 'C', '♣': 'C', '♧': 'C',
};

const VOID = /^[-–—]$/;

/**
 * Reads a hand typed by a person. Accepts the PBN form "AKQ2.K73..T98654",
 * four groups separated by spaces ("AKQ2 K73 - T98654") and suit marks in any
 * order ("♠AKQ2 ♥K73 ♣T98654" or "S AKQ2 H K73 C T98654"). "10" means a ten.
 */
export function parseHand(text: string): { hand: Hand } | { error: HandError } {
  const src = text.toUpperCase().replace(/10/g, 'T').trim();
  const hand = emptyHand();
  if (!src) return { hand };
  const stray = [...src].find((c) => !RANKS.includes(c) && !(c in SUIT_MARKS) && !/[\s.,:;/\-–—]/.test(c));
  if (stray) return { error: { code: 'rank', char: stray } };

  let groups: [Suit, string][];
  if ([...src].some((c) => c in SUIT_MARKS)) {
    groups = [];
    let suit: Suit | null = null;
    for (const c of src) {
      if (c in SUIT_MARKS) {
        suit = SUIT_MARKS[c]!;
        groups.push([suit, '']);
      } else if (RANKS.includes(c)) {
        if (!suit) return { error: { code: 'before-suit' } };
        groups[groups.length - 1]![1] += c;
      } else if (!/[\s.,:;\-–—]/.test(c)) {
        return { error: { code: 'rank', char: c } };
      }
    }
  } else {
    const parts = src.includes('.') ? src.split('.') : src.split(/[\s,;/]+/);
    if (parts.length !== 4) return { error: { code: 'parts' } };
    groups = parts.map((p, i) => [SUITS[i]!, VOID.test(p.trim()) ? '' : p.replace(/\s+/g, '')]);
  }

  for (const [suit, ranks] of groups) {
    for (const r of ranks) {
      if (!RANKS.includes(r)) return { error: { code: 'rank', char: r } };
      if (hand[suit].includes(r)) return { error: { code: 'duplicate', card: suit + r } };
      hand[suit] += r;
    }
  }
  for (const s of SUITS) hand[s] = sortRanks(hand[s]);

  const count = handSize(hand);
  if (count > 13) return { error: { code: 'too-many', count } };
  return { hand };
}

/** "N:AKQ2.K73..T98654 ..." with "-" for a hand not entered yet. */
export function toPbn(deal: Deal): string {
  return 'N:' + SEATS.map((seat) => handToString(deal.hands[seat]) || '-').join(' ');
}

export function parsePbn(text: string): Record<Seat, Hand> | null {
  const m = text.trim().match(/^(?:([NESW])\s*:\s*)?(.+)$/i);
  if (!m) return null;
  const first = SEATS.indexOf((m[1]?.toUpperCase() ?? 'N') as Seat);
  const parts = m[2]!.trim().split(/\s+/);
  if (parts.length !== 4) return null;

  const hands = {} as Record<Seat, Hand>;
  for (let i = 0; i < 4; i++) {
    const seat = SEATS[(first + i) % 4]!;
    const part = parts[i]!;
    if (part === '-') {
      hands[seat] = emptyHand();
      continue;
    }
    if (!part.includes('.')) return null;
    const parsed = parseHand(part);
    if ('error' in parsed) return null;
    hands[seat] = parsed.hand;
  }
  return hands;
}

export function cardOwners(deal: Deal): Map<string, Seat[]> {
  const owners = new Map<string, Seat[]>();
  for (const seat of SEATS) {
    for (const suit of SUITS) {
      for (const r of deal.hands[seat][suit]) {
        const card = suit + r;
        owners.set(card, [...(owners.get(card) ?? []), seat]);
      }
    }
  }
  return owners;
}

export function dealShape(deal: Deal): Shape {
  if (duplicates(deal).length) return { kind: 'clash' };
  const sizes = SEATS.map((seat) => handSize(deal.hands[seat]));
  if (sizes.every((n) => n === 13)) return { kind: 'full' };
  if (sizes[0]! > 0 && sizes.every((n) => n === sizes[0])) return { kind: 'ending', cards: sizes[0]! };
  return { kind: 'partial', missing: 52 - sizes.reduce((a, b) => a + b, 0) };
}

export function duplicates(deal: Deal): [string, Seat[]][] {
  return [...cardOwners(deal)].filter(([, seats]) => seats.length > 1);
}

/** Gives the one hand still short of 13 cards every card nobody holds, when that fills it exactly. */
export function completeLastHand(deal: Deal): Seat | null {
  const short = SEATS.filter((seat) => handSize(deal.hands[seat]) < 13);
  if (short.length !== 1 || duplicates(deal).length) return null;
  const seat = short[0]!;
  const owners = cardOwners(deal);
  const hand = deal.hands[seat];
  for (const suit of SUITS) {
    hand[suit] = sortRanks([...RANKS].filter((r) => !owners.has(suit + r) || hand[suit].includes(r)).join(''));
  }
  return seat;
}

export function randomHands(): Record<Seat, Hand> {
  const cards = SUITS.flatMap((s) => [...RANKS].map((r) => [s, r] as const));
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j]!, cards[i]!];
  }
  const hands = { N: emptyHand(), E: emptyHand(), S: emptyHand(), W: emptyHand() };
  cards.forEach(([s, r], i) => (hands[SEATS[i % 4]!][s] += r));
  for (const seat of SEATS) for (const s of SUITS) hands[seat][s] = sortRanks(hands[seat][s]);
  return hands;
}
