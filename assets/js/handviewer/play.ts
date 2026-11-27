import { type Deal, type Hand, RANKS, SEATS, type Seat, SUITS, type Suit, handSize, toPbn } from './model';

export type Strain = Suit | 'NT';

export interface PlayContract {
  strain: Strain;
  declarer: Seat;
  level?: number;
}

/** A contract being played and the cards played so far, as "SA", "HT"… in order. */
export interface Play {
  contract: PlayContract;
  played: string[];
  /** Declarer plays alone, without the trick numbers, against defenders who always play a best card. */
  auto?: boolean;
  /** In auto play, the defenders' hands stay hidden until the hand is played out. */
  hideDefenders?: boolean;
}

export interface Trick {
  cards: string[];
  leader: Seat;
  winner: Seat;
}

export interface Position {
  /** Cards still held. */
  hands: Record<Seat, Hand>;
  /** Cards held when the current trick began, which is what the solver wants. */
  startHands: Record<Seat, Hand>;
  trick: string[];
  leader: Seat;
  /** Who plays next, null once every card is played. */
  next: Seat | null;
  won: { NS: number; EW: number };
  lastTrick: Trick | null;
  /** Every finished trick in order. */
  tricks: Trick[];
  legal: Set<string>;
}

export const nextSeat = (seat: Seat): Seat => SEATS[(SEATS.indexOf(seat) + 1) % 4]!;
export const sideOf = (seat: Seat): 'NS' | 'EW' => (seat === 'N' || seat === 'S' ? 'NS' : 'EW');

const higher = (a: string, b: string) => RANKS.indexOf(a) < RANKS.indexOf(b);

export function trickWinner(cards: string[], leader: Seat, strain: Strain): Seat {
  let best = 0;
  cards.forEach((card, i) => {
    const top = cards[best]!;
    const beats = card[0] === top[0] ? higher(card[1]!, top[1]!) : card[0] === strain;
    if (beats) best = i;
  });
  let seat = leader;
  for (let i = 0; i < best; i++) seat = nextSeat(seat);
  return seat;
}

function copyHands(hands: Record<Seat, Hand>): Record<Seat, Hand> {
  return Object.fromEntries(SEATS.map((s) => [s, { ...hands[s] }])) as Record<Seat, Hand>;
}

function legalCards(hand: Hand, trick: string[]): Set<string> {
  const led = trick[0]?.[0] as Suit | undefined;
  const suits = led && hand[led] ? [led] : SUITS;
  return new Set(suits.flatMap((s) => [...hand[s]].map((r) => s + r)));
}

/** Replays the cards, dropping any from the first one that could not have been played. */
export function position(deal: Deal, play: Play): Position {
  const hands = copyHands(deal.hands);
  let startHands = copyHands(hands);
  let leader = nextSeat(play.contract.declarer);
  let trick: string[] = [];
  let lastTrick: Trick | null = null;
  const tricks: Trick[] = [];
  const won = { NS: 0, EW: 0 };
  const total = handSize(hands.N);
  let count = 0;

  for (const card of play.played) {
    if (count >= 4 * total) break;
    let seat = leader;
    for (let i = 0; i < trick.length; i++) seat = nextSeat(seat);
    if (!legalCards(hands[seat], trick).has(card)) break;
    hands[seat][card[0] as Suit] = hands[seat][card[0] as Suit].replace(card[1]!, '');
    trick.push(card);
    count++;
    if (trick.length === 4) {
      const winner = trickWinner(trick, leader, play.contract.strain);
      won[sideOf(winner)]++;
      lastTrick = { cards: trick, leader, winner };
      tricks.push(lastTrick);
      leader = winner;
      trick = [];
      startHands = copyHands(hands);
    }
  }
  play.played.length = count;

  let next: Seat | null = leader;
  for (let i = 0; i < trick.length; i++) next = nextSeat(next);
  if (count >= 4 * total) next = null;
  return { hands, startHands, trick, leader, next, won, lastTrick, tricks, legal: next ? legalCards(hands[next], trick) : new Set() };
}

export function startPbn(pos: Position): string {
  return toPbn({ hands: pos.startHands } as Deal);
}

/** Who sits where in the current or last trick, for drawing it. */
export function trickSeats(cards: string[], leader: Seat): Partial<Record<Seat, string>> {
  const out: Partial<Record<Seat, string>> = {};
  let seat = leader;
  for (const card of cards) {
    out[seat] = card;
    seat = nextSeat(seat);
  }
  return out;
}

export function contractCode(c: PlayContract): string {
  return `${c.level ?? ''}${c.strain === 'NT' ? 'N' : c.strain}${c.declarer}`;
}

export function parseContractCode(code: string): PlayContract | null {
  const m = code.match(/^([1-7]?)([SHDCN])([NESW])$/);
  if (!m) return null;
  return { level: m[1] ? Number(m[1]) : undefined, strain: m[2] === 'N' ? 'NT' : (m[2] as Suit), declarer: m[3] as Seat };
}

