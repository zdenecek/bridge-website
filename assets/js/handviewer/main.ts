import { type Call, STRAINS, isLegal, parseAuction } from './auction';
import { h } from './dom';
import { dealImage } from './image';
import { SUIT_GLYPH, callParts, diagram } from './diagram';
import { texts } from './i18n';
import {
  type Deal, type Seat, RANKS, SEATS, SUITS, VULS, type Vul,
  boardDealer, boardVul, cardOwners, completeLastHand, duplicates, emptyDeal, emptyHand,
  handSize, handToString, parseHand, parsePbn, randomHands, sortRanks, toPbn,
} from './model';

const EXAMPLE = 'N:Q964.KT764.3.753 KT75.AQ9.J954.Q9 32.852.KQT872.A6 AJ8.J3.A6.KJT842';

function readHash(): Deal | null {
  const p = new URLSearchParams(location.hash.slice(1));
  const hands = p.get('d') && parsePbn(p.get('d')!);
  if (!hands) return null;
  const board = Number(p.get('b')) || null;
  const deal = emptyDeal(board);
  deal.hands = hands;
  const dealer = p.get('dl') as Seat;
  if (SEATS.includes(dealer)) deal.dealer = dealer;
  const vul = p.get('v') as Vul;
  if (VULS.includes(vul)) deal.vul = vul;
  const auction = parseAuction(p.get('a') ?? '', deal.dealer);
  if ('calls' in auction) deal.auction = auction.calls;
  return deal;
}

function writeHash(deal: Deal) {
  const parts = [`dl=${deal.dealer}`, `v=${deal.vul}`, `d=${toPbn(deal).replace(/ /g, '+')}`];
  if (deal.board) parts.unshift(`b=${deal.board}`);
  if (deal.auction.length) parts.push(`a=${deal.auction.join('-')}`);
  history.replaceState(null, '', '#' + parts.join('&'));
}

function exampleDeal(): Deal {
  const deal = emptyDeal(1);
  deal.hands = parsePbn(EXAMPLE)!;
  return deal;
}

const BBO_SEAT: Record<Seat, string> = { S: '1', W: '2', N: '3', E: '4' };
const BBO_VUL: Record<Vul, string> = { None: '0', NS: 'n', EW: 'e', All: 'b' };

function solverUrl(deal: Deal): string {
  const hands = (['S', 'W', 'N', 'E'] as Seat[])
    .map((seat) => SUITS.map((suit) => suit + deal.hands[seat][suit]).join(''))
    .join(',');
  const title = deal.board ? `Board ${deal.board}` : '';
  return `https://dds.bridgewebs.com/bsol2/ddummy.htm?lin=md|${BBO_SEAT[deal.dealer]}${hands}|rh||ah|${title}|sv|${BBO_VUL[deal.vul]}`;
}

function key(deal: Deal) {
  return [deal.board, deal.dealer, deal.vul, toPbn(deal), deal.auction.join('-')].join('|');
}

function setupTheme(t: ReturnType<typeof texts>) {
  const button = document.getElementById('hv-theme');
  if (!button) return;
  const media = matchMedia('(prefers-color-scheme: dark)');
  const isDark = () => {
    const a = document.body.getAttribute('a');
    return a === 'dark' || (a !== 'light' && media.matches);
  };
  const show = () => {
    const dark = isDark();
    button.textContent = dark ? '☀' : '☾';
    button.title = dark ? t.themeLight : t.themeDark;
    button.setAttribute('aria-label', button.title);
  };
  button.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    document.body.setAttribute('a', next);
    try { localStorage.setItem('hv-theme', next); } catch { /* private mode */ }
    show();
  });
  media.addEventListener('change', show);
  show();
}

async function copy(text: string, button: HTMLButtonElement, done: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    return;
  }
  const label = button.textContent;
  button.textContent = done;
  setTimeout(() => (button.textContent = label), 1400);
}

function mount(root: HTMLElement) {
  const t = texts(document.documentElement.lang);
  let deal = readHash() ?? exampleDeal();
  let active: Seat = 'N';

  const view = h('div', { class: 'hv-card' });
  const status = h('p', { class: 'hv-status', 'aria-live': 'polite' });
  const solver = h('a', { class: 'hv-link', target: '_blank', rel: 'noopener' }, t.solver);
  const copyLink = h('button', { type: 'button', class: 'hv-link' }, t.copyLink);
  copyLink.addEventListener('click', () => copy(location.href, copyLink, t.copied));

  const flash = (b: HTMLButtonElement, text: string) => {
    const label = b.textContent;
    b.textContent = text;
    setTimeout(() => (b.textContent = label), 1400);
  };
  const download = (blob: Blob) => {
    const a = h('a', { href: URL.createObjectURL(blob), download: `${deal.board ? `${t.board}-${deal.board}` : t.board}.png`.toLowerCase() });
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const copyImage = h('button', { type: 'button', class: 'hv-link' }, t.copyImage);
  copyImage.addEventListener('click', async () => {
    const blob = dealImage(deal, t);
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      flash(copyImage, t.imageCopied);
    } catch {
      download(await blob);
      flash(copyImage, t.imageSaved);
    }
  });
  const downloadImage = h('button', { type: 'button', class: 'hv-link' }, t.downloadImage);
  downloadImage.addEventListener('click', async () => download(await dealImage(deal, t)));

  const boardInput = h('input', { type: 'number', min: 1, max: 999, inputmode: 'numeric', class: 'hv-input hv-board-num' });
  const dealerSelect = h('select', { class: 'hv-input' }, SEATS.map((seat) => h('option', { value: seat }, `${seat} – ${t.seats[seat]}`)));
  const vulSelect = h('select', { class: 'hv-input' }, VULS.map((v) => h('option', { value: v }, t.vuls[v])));

  boardInput.addEventListener('input', () => {
    const n = Number(boardInput.value);
    if (Number.isInteger(n) && n >= 1) {
      deal.board = n;
      deal.dealer = boardDealer(n);
      deal.vul = boardVul(n);
    } else if (!boardInput.value) {
      deal.board = null;
    }
    refresh();
  });
  dealerSelect.addEventListener('change', () => { deal.dealer = dealerSelect.value as Seat; refresh(); });
  vulSelect.addEventListener('change', () => { deal.vul = vulSelect.value as Vul; refresh(); });

  const handInputs = {} as Record<Seat, HTMLInputElement>;
  const handCounts = {} as Record<Seat, HTMLElement>;
  const handErrors = {} as Record<Seat, HTMLElement>;
  const handRows = SEATS.map((seat) => {
    const id = `hv-hand-${seat}`;
    const input = h('input', {
      id, class: 'hv-input hv-hand-input', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false',
      placeholder: t.handPlaceholder, 'aria-describedby': `${id}-err`,
    });
    handInputs[seat] = input;
    handCounts[seat] = h('span', { class: 'hv-count' });
    handErrors[seat] = h('span', { class: 'hv-error', id: `${id}-err` });

    input.addEventListener('input', () => {
      const parsed = parseHand(input.value);
      if ('error' in parsed) {
        input.setAttribute('aria-invalid', 'true');
        handErrors[seat].textContent = t.error(parsed.error);
        return;
      }
      input.removeAttribute('aria-invalid');
      handErrors[seat].textContent = '';
      deal.hands[seat] = parsed.hand;
      autoComplete(seat);
      refresh();
    });
    input.addEventListener('focus', () => { active = seat; refresh(); });
    input.addEventListener('blur', () => {
      if (!input.hasAttribute('aria-invalid')) input.value = handToString(deal.hands[seat]);
    });

    return h('div', { class: 'hv-hand-row' },
      h('label', { for: id, class: `hv-seat hv-seat-${seat.toLowerCase()}`, title: t.seats[seat] }, seat),
      input, handCounts[seat], handErrors[seat]);
  });

  function autoComplete(changed: Seat) {
    if (handSize(deal.hands[changed]) !== 13) return;
    const empty = SEATS.filter((seat) => handSize(deal.hands[seat]) === 0);
    if (empty.length === 1) completeLastHand(deal);
  }

  const seatTabs = SEATS.map((seat) => {
    const b = h('button', { type: 'button', class: 'hv-tab', 'data-seat': seat, 'aria-pressed': 'false' }, t.seats[seat]);
    b.addEventListener('click', () => { active = seat; refresh(); });
    return b;
  });

  const cardButtons = new Map<string, HTMLButtonElement>();
  const pickerRows = SUITS.map((suit) => h('div', { class: 'hv-pick-row' },
    h('span', { class: `hv-suit hv-suit-${suit.toLowerCase()}` }, SUIT_GLYPH[suit]),
    [...RANKS].map((rank) => {
      const card = suit + rank;
      const b = h('button', { type: 'button', class: 'hv-pick', 'aria-label': SUIT_GLYPH[suit] + rank }, rank, h('small', {}));
      b.addEventListener('click', () => toggleCard(suit, rank));
      cardButtons.set(card, b);
      return b;
    }),
  ));

  function toggleCard(suit: (typeof SUITS)[number], rank: string) {
    const hand = deal.hands[active];
    if (hand[suit].includes(rank)) {
      hand[suit] = hand[suit].replace(rank, '');
    } else {
      if (handSize(hand) >= 13) return;
      for (const seat of SEATS) deal.hands[seat][suit] = deal.hands[seat][suit].replace(rank, '');
      hand[suit] = sortRanks(hand[suit] + rank);
      if (handSize(hand) === 13) {
        autoComplete(active);
        active = SEATS.find((seat) => handSize(deal.hands[seat]) < 13) ?? active;
      }
    }
    refresh();
  }

  const pbnInput = h('input', { class: 'hv-input hv-pbn', autocomplete: 'off', spellcheck: 'false', id: 'hv-pbn' });
  const pbnError = h('span', { class: 'hv-error' });
  const pbnCopy = h('button', { type: 'button', class: 'hv-btn' }, t.copy);
  pbnCopy.addEventListener('click', () => copy(pbnInput.value, pbnCopy, t.copied));
  pbnInput.addEventListener('input', () => {
    const hands = parsePbn(pbnInput.value);
    pbnError.textContent = hands ? '' : t.badPbn;
    pbnInput.toggleAttribute('aria-invalid', !hands);
    if (hands) {
      deal.hands = hands;
      refresh();
    }
  });

  const auctionInput = h('input', {
    id: 'hv-auction', class: 'hv-input hv-auction-input', autocomplete: 'off', spellcheck: 'false',
    autocapitalize: 'characters', placeholder: t.auctionPlaceholder, 'aria-describedby': 'hv-auction-err',
  });
  const auctionError = h('span', { class: 'hv-error', id: 'hv-auction-err' });
  auctionInput.addEventListener('input', () => {
    const parsed = parseAuction(auctionInput.value, deal.dealer);
    if ('error' in parsed) {
      auctionInput.setAttribute('aria-invalid', 'true');
      auctionError.textContent = t.auctionError(parsed.error);
      return;
    }
    auctionInput.removeAttribute('aria-invalid');
    auctionError.textContent = '';
    deal.auction = parsed.calls;
    refresh();
  });
  auctionInput.addEventListener('blur', () => {
    if (!auctionInput.hasAttribute('aria-invalid')) auctionInput.value = deal.auction.join(' ');
  });

  const callButtons = new Map<Call, HTMLButtonElement>();
  const callButton = (call: Call, cls = 'hv-call') => {
    const b = h('button', { type: 'button', class: cls },
      callParts(call, t).map((p) => (p.suit ? h('span', { class: `hv-suit-${p.suit.toLowerCase()}` }, p.text) : p.text)));
    b.addEventListener('click', () => { deal.auction.push(call); refresh(); });
    callButtons.set(call, b);
    return b;
  };
  const undoBtn = h('button', { type: 'button', class: 'hv-call hv-call-wide' }, t.undo);
  undoBtn.addEventListener('click', () => { deal.auction.pop(); refresh(); });
  const biddingBox = h('div', { class: 'hv-bidbox' },
    h('div', { class: 'hv-bids' }, [1, 2, 3, 4, 5, 6, 7].flatMap((level) => STRAINS.map((strain) => callButton(`${level}${strain}`)))),
    h('div', { class: 'hv-bid-specials' },
      callButton('P', 'hv-call hv-call-wide hv-call-pass'), callButton('X', 'hv-call hv-call-wide hv-call-x'),
      callButton('XX', 'hv-call hv-call-wide hv-call-xx'), undoBtn),
  );

  const button = (label: string, onClick: () => void, cls = 'hv-btn') => {
    const b = h('button', { type: 'button', class: cls }, label);
    b.addEventListener('click', onClick);
    return b;
  };
  const completeBtn = button(t.complete, () => { completeLastHand(deal); refresh(); });
  const actions = h('div', { class: 'hv-buttons' },
    button(t.random, () => { deal.hands = randomHands(); deal.auction = []; refresh(); }, 'hv-btn hv-btn-primary'),
    completeBtn,
    button(t.clear, () => {
      for (const seat of SEATS) deal.hands[seat] = emptyHand();
      deal.auction = [];
      active = 'N';
      refresh();
      handInputs.N.focus();
    }),
  );

  view.addEventListener('click', (e) => {
    const seat = (e.target as Element).closest<HTMLElement>('.hv-hand')?.dataset.seat as Seat | undefined;
    if (seat) handInputs[seat].focus();
  });

  root.replaceChildren(
    h('section', { class: 'hv-view' }, view, status, h('div', { class: 'hv-view-links' }, copyImage, downloadImage, copyLink, solver)),
    h('section', { class: 'hv-editor' },
      h('div', { class: 'hv-meta' },
        h('label', {}, h('span', {}, t.board), boardInput),
        h('label', {}, h('span', {}, t.dealer), dealerSelect),
        h('label', {}, h('span', {}, t.vul), vulSelect),
      ),
      h('fieldset', { class: 'hv-hands' }, h('legend', {}, t.hands), handRows, h('p', { class: 'hv-help' }, t.handHelp)),
      h('details', { class: 'hv-picker', open: true },
        h('summary', {}, t.picker),
        h('p', { class: 'hv-help' }, t.pickerHelp),
        h('div', { class: 'hv-tabs', role: 'group' }, seatTabs),
        h('div', { class: 'hv-pick-grid' }, pickerRows),
      ),
      h('div', { class: 'hv-auction-edit' },
        h('label', { for: 'hv-auction' }, t.auction),
        auctionInput, auctionError, biddingBox,
        h('p', { class: 'hv-help' }, t.auctionHelp),
      ),
      h('div', { class: 'hv-pbn-row' },
        h('label', { for: 'hv-pbn' }, t.pbn),
        h('div', { class: 'hv-pbn-line' }, pbnInput, pbnCopy),
        pbnError,
      ),
      actions,
    ),
  );

  function refresh() {
    view.replaceChildren(diagram(deal, t));

    const focused = document.activeElement;
    if (focused !== boardInput) boardInput.value = deal.board ? String(deal.board) : '';
    dealerSelect.value = deal.dealer;
    vulSelect.value = deal.vul;

    for (const seat of SEATS) {
      const size = handSize(deal.hands[seat]);
      if (focused !== handInputs[seat]) {
        handInputs[seat].value = handToString(deal.hands[seat]);
        handInputs[seat].removeAttribute('aria-invalid');
        handErrors[seat].textContent = '';
      }
      handCounts[seat].textContent = t.cards(size);
      handCounts[seat].classList.toggle('hv-full', size === 13);
    }

    const owners = cardOwners(deal);
    for (const [card, b] of cardButtons) {
      const seats = owners.get(card) ?? [];
      b.dataset.owner = seats.length > 1 ? 'clash' : seats[0] ?? '';
      b.classList.toggle('hv-mine', seats.includes(active));
      b.querySelector('small')!.textContent = seats.join('');
    }
    for (const tab of seatTabs) {
      const seat = tab.dataset.seat as Seat;
      tab.setAttribute('aria-pressed', String(seat === active));
      tab.dataset.count = String(handSize(deal.hands[seat]));
    }

    if (focused !== pbnInput) {
      pbnInput.value = toPbn(deal);
      pbnInput.removeAttribute('aria-invalid');
      pbnError.textContent = '';
    }

    if (focused !== auctionInput) {
      auctionInput.value = deal.auction.join(' ');
      auctionInput.removeAttribute('aria-invalid');
      auctionError.textContent = '';
    }
    for (const [call, b] of callButtons) b.disabled = !isLegal(deal.auction, deal.dealer, call);
    undoBtn.disabled = !deal.auction.length;

    const dups = duplicates(deal);
    const total = SEATS.reduce((n, seat) => n + handSize(deal.hands[seat]), 0);
    const complete = !dups.length && total === 52;
    status.replaceChildren(
      ...dups.map(([card, seats]) => h('span', { class: 'hv-warn' }, t.dup(SUIT_GLYPH[card[0] as 'S'] + card[1], seats.join(', ')))),
      dups.length ? '' : complete ? t.done : t.missing(52 - total),
    );
    status.classList.toggle('hv-ok', complete);
    completeBtn.disabled = SEATS.filter((seat) => handSize(deal.hands[seat]) < 13).length !== 1 || dups.length > 0;
    solver.hidden = !complete;
    if (complete) solver.href = solverUrl(deal);

    writeHash(deal);
  }

  window.addEventListener('hashchange', () => {
    const next = readHash();
    if (next && key(next) !== key(deal)) {
      deal = next;
      refresh();
    }
  });

  setupTheme(t);
  refresh();
}

const root = document.getElementById('handviewer');
if (root) mount(root);
