import { contract, isComplete } from './auction';
import type { Texts } from './i18n';
import { type Deal, SEATS, type Seat, emptyHand, handSize } from './model';
import { type Play, type PlayContract, type Strain, nextSeat, position, trickWinner } from './play';

export type Form = '' | 'teams' | 'pairs' | 'mp' | 'custom';

/** A bidding or play problem shown from one player's seat, for a poll. */
export interface Poll {
  you: Seat;
  form: Form;
  /** The scoring as written, when form is custom. */
  formText: string;
  /** Hands shown; the others are left blank. */
  visible: Seat[];
  text: string;
  /** Empty for the plain default question. */
  question: string;
  /** Cards played so far, e.g. "SA S8 S2 S5", for a play problem; needs only the cards, not the hands. */
  cards: string;
  /** Show the hands without the cards already played. */
  hidePlayed?: boolean;
  /** The contract of a play problem taken over from the play mode, when the auction has none. */
  contract?: PlayContract;
}

const partner = (seat: Seat) => nextSeat(nextSeat(seat));

export function dummyOf(deal: Deal): Seat | null {
  const c = contract(deal.auction, deal.dealer);
  return c && c !== 'passout' ? partner(c.declarer) : null;
}

/**
 * In play mode, even before the lead: the player on turn (declarer when it is dummy's turn) with
 * dummy shown, the cards played so far and the contract. Otherwise the player to call, else the opening leader, else the only hand
 * entered, else the dealer.
 */
export function defaultPoll(deal: Deal, play: Play | null): Poll {
  if (play) {
    const next = position(deal, play).next;
    const declarer = play.contract.declarer;
    const dummy = partner(declarer);
    const you = !next || next === dummy ? declarer : next;
    return {
      you, form: '', formText: '', text: '', question: '', contract: { ...play.contract },
      visible: SEATS.filter((s) => s === you || s === dummy), cards: play.played.join(' '),
    };
  }
  const c = contract(deal.auction, deal.dealer);
  const entered = SEATS.filter((seat) => handSize(deal.hands[seat]));
  let you: Seat;
  if (deal.auction.length && !isComplete(deal.auction)) you = SEATS[(SEATS.indexOf(deal.dealer) + deal.auction.length) % 4]!;
  else if (c && c !== 'passout') you = nextSeat(c.declarer);
  else if (entered.length === 1) you = entered[0]!;
  else you = deal.dealer;
  const visible: Seat[] = [you];
  const dummy = play?.played.length ? partner(play.contract.declarer) : null;
  if (dummy && dummy !== you) visible.push(dummy);
  return { you, form: '', formText: '', visible, text: '', question: '', cards: '' };
}

/** The deal as the poll shows it: only the visible hands, no points or analysis. */
export function pollDeal(deal: Deal, poll: Poll): Deal {
  const played = poll.hidePlayed ? parseCards(poll.cards) : [];
  const shown = (seat: Seat) => {
    const hand = { ...deal.hands[seat] };
    for (const card of played) hand[card[0] as 'S'] = hand[card[0] as 'S'].replace(card[1]!, '');
    return hand;
  };
  const hands = Object.fromEntries(SEATS.map((s) => [s, poll.visible.includes(s) ? shown(s) : emptyHand()])) as Deal['hands'];
  return { ...deal, hands, show: { hcp: false, dd: false } };
}

export function pollMeta(deal: Deal, poll: Poll, t: Texts, play: Play | null): string[] {
  const meta: string[] = [];
  if (poll.form === 'custom') {
    if (poll.formText.trim()) meta.push(poll.formText.trim());
  } else if (poll.form) meta.push(t.forms[poll.form]);
  meta.push(t.vulPhrase[deal.vul]);
  const pc = pollContract(deal, play);
  const declarer = pc?.declarer ?? null;
  if (pc) meta.push(t.playedBy(`${pc.level ?? ''}${pc.strain === 'NT' ? t.nt : pc.strain}`, t.seats[pc.declarer]));
  else meta.push(t.dealerPhrase(t.seats[deal.dealer]));
  const dummy = declarer ? partner(declarer) : null;
  if (dummy && dummy !== poll.you && poll.visible.length === 2 && poll.visible.includes(poll.you) && poll.visible.includes(dummy)) {
    meta.push(t.youSeeDummy(t.seats[dummy]));
  }
  return meta;
}

export interface Run { text: string; bold?: boolean; suit?: 'S' | 'H' | 'D' | 'C' }

const GLYPHS: Record<string, Run['suit']> = { '♠': 'S', '♥': 'H', '♦': 'D', '♣': 'C' };
export const SUIT_CHAR = { S: '♠', H: '♥', D: '♦', C: '♣' } as const;

/** Text with **bold**, suits as ♠ or !S, and bids such as 1S or 4H shown with the suit symbol. */
export function richRuns(line: string): Run[] {
  const runs: Run[] = [];
  line.split('**').forEach((segment, i) => {
    const bold = i % 2 === 1;
    const re = /!([SHDC])|([♠♥♦♣])|\b([1-7])([SHDC])\b/gi;
    let last = 0;
    for (const m of segment.matchAll(re)) {
      if (m.index! > last) runs.push({ text: segment.slice(last, m.index), bold });
      const suit = (m[1] ?? m[4])?.toUpperCase() as Run['suit'] | undefined;
      if (m[3]) runs.push({ text: m[3], bold });
      const s = suit ?? GLYPHS[m[2]!]!;
      runs.push({ text: SUIT_CHAR[s!], suit: s, bold });
      last = m.index! + m[0].length;
    }
    if (last < segment.length) runs.push({ text: segment.slice(last), bold });
  });
  return runs.filter((r) => r.text);
}

export function paragraphs(text: string): Run[][] {
  return text.split('\n').map((l) => l.trim()).filter(Boolean).map(richRuns);
}

export interface TrickRow {
  n: number;
  cards: Partial<Record<Seat, string>>;
  leader: Seat;
  winner?: Seat;
  /** The seat to play next, shown with a question mark. */
  ask?: Seat;
}

const SYMBOL: Record<string, string> = { '♠': 'S', '♥': 'H', '♦': 'D', '♣': 'C' };

/** Cards written as "SA S8 S2 S5", "♠A ♠8" or with 10 for a ten. */
export function parseCards(text: string): string[] {
  return (text.toUpperCase().replace(/10/g, 'T').match(/[SHDC♠♥♦♣][AKQJT2-9]/g) ?? []).map((c) => (SYMBOL[c[0]!] ?? c[0]) + c[1]);
}

function tableFrom(cards: string[], declarer: Seat, strain: Strain): { seats: Seat[]; rows: TrickRow[] } {
  const first = nextSeat(declarer);
  const seats = [first, nextSeat(first), partner(first), nextSeat(partner(first))];
  const rows: TrickRow[] = [];
  let leader = first;
  for (let i = 0; i < cards.length; i += 4) {
    const trick = cards.slice(i, i + 4);
    const placed: Partial<Record<Seat, string>> = {};
    let seat = leader;
    for (const card of trick) {
      placed[seat] = card;
      seat = nextSeat(seat);
    }
    const winner = trick.length === 4 ? trickWinner(trick, leader, strain) : undefined;
    rows.push({ n: rows.length + 1, cards: placed, leader, winner });
    if (winner) leader = winner;
  }
  const last = rows[rows.length - 1]!;
  if (cards.length % 4) {
    let seat = last.leader;
    for (let i = 0; i < cards.length % 4; i++) seat = nextSeat(seat);
    last.ask = seat;
  } else if (rows.length < 13) rows.push({ n: rows.length + 1, cards: {}, leader, ask: leader });
  return { seats, rows };
}

/** The contract a play problem is about: the auction's, else the one being played. */
export function pollContract(deal: Deal, play: Play | null): PlayContract | null {
  const c = contract(deal.auction, deal.dealer);
  if (c && c !== 'passout') return { declarer: c.declarer, strain: c.strain === 'N' ? 'NT' : c.strain, level: c.level };
  return deal.poll?.contract ?? play?.contract ?? null;
}

/** A plain question that suggests nothing: the call, the lead or the card to play. */
export function defaultQuestion(deal: Deal, t: Texts): string {
  if (deal.poll?.cards.trim()) return t.questionPlay;
  const bid = isComplete(deal.auction) && contract(deal.auction, deal.dealer) !== 'passout';
  return bid || deal.poll?.contract ? t.questionLead : t.pollQuestion;
}

/** The tricks played so far, under the seats in the order they play from the opening lead. */
export function trickTable(deal: Deal, play: Play | null): { seats: Seat[]; rows: TrickRow[] } | null {
  const own = deal.poll?.cards ? parseCards(deal.poll.cards) : [];
  const cards = own.length ? own : play?.played ?? [];
  const c = pollContract(deal, play);
  return cards.length && c ? tableFrom(cards, c.declarer, c.strain) : null;
}

