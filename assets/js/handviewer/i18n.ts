import type { AuctionError } from './auction';
import type { HandError, Seat, Vul } from './model';

const cs = {
  board: 'Rozdání',
  dealer: 'Rozdává',
  vul: 'Manša',
  vuls: { None: 'nikdo', NS: 'NS', EW: 'EW', All: 'oba' } as Record<Vul, string>,
  seats: { N: 'Sever', E: 'Východ', S: 'Jih', W: 'Západ' } as Record<Seat, string>,
  hands: 'Ruce',
  handPlaceholder: 'AKQ2.K73.T98.654',
  handHelp: 'Barvy v pořadí ♠ ♥ ♦ ♣ oddělené tečkou nebo mezerou, nebo se značkami (♠AKQ2 ♥K73…). Desítka je T nebo 10, chicane je pomlčka.',
  picker: 'Výběr karet klikáním',
  pickerHelp: 'Vyberte hráče a klikejte na karty. Druhým kliknutím kartu vrátíte.',
  pbn: 'Zápis PBN',
  copy: 'Kopírovat',
  copied: 'Zkopírováno',
  copyLink: 'Kopírovat odkaz',
  random: 'Náhodné rozdání',
  clear: 'Vymazat',
  complete: 'Doplnit poslední ruku',
  solver: 'Otevřít v BridgeSolveru',
  cards: (n: number) => `${n} / 13`,
  missing: (n: number) => `Chybí ještě ${n} ${n === 1 ? 'karta' : n < 5 ? 'karty' : 'karet'}.`,
  done: 'Rozdání je kompletní.',
  dup: (card: string, seats: string) => `${card} je u více hráčů: ${seats}.`,
  badPbn: 'Tohle nevypadá jako zápis PBN (např. N:AKQ2.K73.T98.654 - - -).',
  compass: (dealer: string, vul: string) => `Rozdává ${dealer}, manša: ${vul}`,
  hcp: 'Body',
  auction: 'Dražba',
  auctionPlaceholder: '1S P 2H P 4S P P P',
  auctionHelp: 'Hlášky od rozdávajícího, oddělené mezerou. Pas je P, kontra X, rekontra XX, bez trumfů N nebo BT.',
  pass: 'pas',
  allPass: 'všichni pas',
  nt: 'BT',
  undo: 'Zpět',
  contract: 'Závazek',
  by: 'hraje',
  passout: 'Všichni pasovali.',
  auctionError: (e: AuctionError) => e.code === 'call' ? `Neznámá hláška „${e.token}“.` : `Hláška ${e.call} tu není možná (${e.index + 1}. v pořadí).`,
  copyImage: 'Kopírovat obrázek',
  downloadImage: 'Stáhnout PNG',
  imageCopied: 'Obrázek zkopírován',
  imageSaved: 'Obrázek stažen',
  themeDark: 'Tmavý vzhled',
  themeLight: 'Světlý vzhled',
  error: (e: HandError) => {
    switch (e.code) {
      case 'rank': return `Neznámý znak „${e.char}“.`;
      case 'parts': return 'Potřebuji čtyři barvy (prázdnou barvu napište jako pomlčku).';
      case 'before-suit': return 'Karty před značkou barvy.';
      case 'duplicate': return `Karta ${e.card} je tu dvakrát.`;
      case 'too-many': return `To je ${e.count} karet, ruka jich má 13.`;
    }
  },
};

const en: typeof cs = {
  board: 'Board',
  dealer: 'Dealer',
  vul: 'Vulnerable',
  vuls: { None: 'none', NS: 'NS', EW: 'EW', All: 'all' },
  seats: { N: 'North', E: 'East', S: 'South', W: 'West' },
  hands: 'Hands',
  handPlaceholder: 'AKQ2.K73.T98.654',
  handHelp: 'Suits in the order ♠ ♥ ♦ ♣ separated by dots or spaces, or with suit marks (♠AKQ2 ♥K73…). A ten is T or 10, a void is a dash.',
  picker: 'Pick cards by clicking',
  pickerHelp: 'Choose a player and click the cards. Click again to take a card back.',
  pbn: 'PBN deal',
  copy: 'Copy',
  copied: 'Copied',
  copyLink: 'Copy link',
  random: 'Random deal',
  clear: 'Clear',
  complete: 'Fill in the last hand',
  solver: 'Open in BridgeSolver',
  cards: (n) => `${n} / 13`,
  missing: (n) => `${n} ${n === 1 ? 'card' : 'cards'} still missing.`,
  done: 'The deal is complete.',
  dup: (card, seats) => `${card} is held by more than one player: ${seats}.`,
  badPbn: 'This does not look like a PBN deal (e.g. N:AKQ2.K73.T98.654 - - -).',
  compass: (dealer, vul) => `Dealer ${dealer}, vulnerable: ${vul}`,
  hcp: 'Points',
  auction: 'Auction',
  auctionPlaceholder: '1S P 2H P 4S P P P',
  auctionHelp: 'Calls from the dealer on, separated by spaces. Pass is P, double X, redouble XX, notrump N or NT.',
  pass: 'Pass',
  allPass: 'All pass',
  nt: 'NT',
  undo: 'Undo',
  contract: 'Contract',
  by: 'by',
  passout: 'Passed out.',
  auctionError: (e) => e.code === 'call' ? `Unknown call “${e.token}”.` : `${e.call} is not possible here (call ${e.index + 1}).`,
  copyImage: 'Copy image',
  downloadImage: 'Download PNG',
  imageCopied: 'Image copied',
  imageSaved: 'Image downloaded',
  themeDark: 'Dark mode',
  themeLight: 'Light mode',
  error: (e) => {
    switch (e.code) {
      case 'rank': return `Unknown character “${e.char}”.`;
      case 'parts': return 'Four suits needed (write a void as a dash).';
      case 'before-suit': return 'Cards before a suit mark.';
      case 'duplicate': return `${e.card} is here twice.`;
      case 'too-many': return `That is ${e.count} cards, a hand has 13.`;
    }
  },
};

export type Texts = typeof cs;

export function texts(lang: string): Texts {
  return lang.startsWith('cs') ? cs : en;
}
