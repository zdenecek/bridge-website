import { SEATS, type Seat } from './model';

export const STRAINS = ['C', 'D', 'H', 'S', 'N'] as const;
export type Strain = (typeof STRAINS)[number];

/** "P", "X", "XX" or a bid such as "1C" or "3N". */
export type Call = string;

export type AuctionError =
  | { code: 'call'; token: string }
  | { code: 'illegal'; call: Call; index: number }
  | { code: 'note-first' };

/** What a call carries besides itself: an alert, and a note shown as a numbered footnote. */
export interface Annotation {
  alert?: boolean;
  note?: string;
}

export interface Contract {
  level: number;
  strain: Strain;
  doubled: '' | 'X' | 'XX';
  declarer: Seat;
}

const STRAIN_ALIASES: Record<string, Strain> = {
  C: 'C', '♣': 'C', D: 'D', '♦': 'D', H: 'H', '♥': 'H', S: 'S', '♠': 'S',
  N: 'N', NT: 'N', BT: 'N', SA: 'N',
};

export function normalizeCall(token: string): Call | null {
  const t = token.toUpperCase().replace(/[!?]/g, '');
  if (['P', 'PASS', 'PAS', 'PASSES'].includes(t)) return 'P';
  if (['X', 'D', 'DBL', 'KONTRA', 'K'].includes(t)) return 'X';
  if (['XX', 'R', 'RDBL', 'REDBL', 'REKONTRA', 'RE'].includes(t)) return 'XX';
  const m = t.match(/^([1-7])(.+)$/);
  const strain = m && STRAIN_ALIASES[m[2]!];
  return strain ? m![1] + strain : null;
}

export const isBid = (call: Call) => /^[1-7]/.test(call);
const bidRank = (call: Call) => (Number(call[0]) - 1) * 5 + STRAINS.indexOf(call[1] as Strain);
const side = (i: number) => i % 2;

interface State {
  lastBid: Call | null;
  lastBidBy: number;
  doubled: 0 | 1 | 2;
  doubledBy: number;
}

function replay(calls: Call[], dealer: Seat): State & { next: number } {
  const st: State = { lastBid: null, lastBidBy: -1, doubled: 0, doubledBy: -1 };
  const first = SEATS.indexOf(dealer);
  calls.forEach((call, k) => {
    const seat = (first + k) % 4;
    if (isBid(call)) Object.assign(st, { lastBid: call, lastBidBy: seat, doubled: 0, doubledBy: -1 });
    else if (call === 'X') Object.assign(st, { doubled: 1, doubledBy: seat });
    else if (call === 'XX') Object.assign(st, { doubled: 2, doubledBy: seat });
  });
  return { ...st, next: (first + calls.length) % 4 };
}

export function isComplete(calls: Call[]): boolean {
  const passes = calls.length - 1 - calls.findLastIndex((c) => c !== 'P');
  return calls.some((c) => c !== 'P') ? passes >= 3 : passes >= 4;
}

export function isLegal(calls: Call[], dealer: Seat, call: Call): boolean {
  if (isComplete(calls)) return false;
  const st = replay(calls, dealer);
  if (call === 'P') return true;
  if (call === 'X') return st.lastBid !== null && st.doubled === 0 && side(st.lastBidBy) !== side(st.next);
  if (call === 'XX') return st.doubled === 1 && side(st.doubledBy) !== side(st.next);
  return st.lastBid === null || bidRank(call) > bidRank(st.lastBid);
}

const SEPARATOR = /[\s,;\-–—]/;

/**
 * Reads "1S P 2H P 4S P P P", also with commas or dashes, "pass", "dbl", "1NT" or suit symbols.
 * "1N!" alerts a call and "1N(15–17)" gives it a note.
 */
export function parseAuction(text: string, dealer: Seat): { calls: Call[]; notes: Annotation[] } | { error: AuctionError } {
  const calls: Call[] = [];
  const notes: Annotation[] = [];
  let i = 0;
  while (i < text.length) {
    const c = text[i]!;
    if (SEPARATOR.test(c)) {
      i++;
    } else if (c === '(') {
      if (!calls.length) return { error: { code: 'note-first' } };
      const end = text.indexOf(')', i);
      const note = text.slice(i + 1, end < 0 ? undefined : end).trim();
      if (note) notes[calls.length - 1] = { ...notes[calls.length - 1], note };
      i = end < 0 ? text.length : end + 1;
    } else {
      let j = i;
      while (j < text.length && !SEPARATOR.test(text[j]!) && text[j] !== '(' && text[j] !== ')') j++;
      const token = text.slice(i, Math.max(j, i + 1));
      i = Math.max(j, i + 1);
      const alert = token.endsWith('!');
      const call = normalizeCall(token.replace(/!+$/, ''));
      if (!call) return { error: { code: 'call', token } };
      if (!isLegal(calls, dealer, call)) return { error: { code: 'illegal', call, index: calls.length } };
      calls.push(call);
      if (alert) notes[calls.length - 1] = { alert: true };
    }
  }
  return { calls, notes };
}

export function formatAuction(calls: Call[], notes: Annotation[], separator = ' '): string {
  return calls.map((call, i) => {
    const n = notes[i];
    return call + (n?.alert ? '!' : '') + (n?.note ? `(${n.note})` : '');
  }).join(separator);
}

/** Footnote numbers of the calls that have a note, in auction order. */
export function noteNumbers(notes: Annotation[]): Map<number, number> {
  const numbers = new Map<number, number>();
  notes.forEach((n, i) => n?.note && numbers.set(i, numbers.size + 1));
  return numbers;
}

/** The final contract once the auction is over, "passout" if nobody bid, null while it goes on. */
export function contract(calls: Call[], dealer: Seat): Contract | 'passout' | null {
  if (!isComplete(calls)) return null;
  const st = replay(calls, dealer);
  if (!st.lastBid) return 'passout';
  const strain = st.lastBid[1] as Strain;
  const first = SEATS.indexOf(dealer);
  const k = calls.findIndex((c, i) => c[1] === strain && isBid(c) && side((first + i) % 4) === side(st.lastBidBy));
  return {
    level: Number(st.lastBid[0]),
    strain,
    doubled: (['', 'X', 'XX'] as const)[st.doubled],
    declarer: SEATS[(first + k) % 4]!,
  };
}
