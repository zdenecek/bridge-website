import { type Call, STRAINS, contract, formatAuction, isLegal, parseAuction } from './auction';
import { h } from './dom';
import { dealImage, pollImage } from './image';
import { type Form, type Poll, defaultPoll, defaultQuestion } from './poll';
import { ddSolver } from './dd';
import { type DdView, type PlayView, SUIT_GLYPH, callParts, defendersTurn, diagram, pollView } from './diagram';
import { type Play, type PlayContract, type Strain, contractCode, parseContractCode, position, sideOf } from './play';
import { texts } from './i18n';
import {
  type Deal, type Seat, RANKS, SEATS, SUITS, VULS, type Vul,
  boardDealer, boardVul, cardOwners, completeLastHand, dealShape, duplicates, emptyDeal, emptyHand,
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
  if ('calls' in auction) {
    deal.auction = auction.calls;
    deal.notes = auction.notes;
  }
  deal.show = { hcp: p.get('h') !== '0', dd: p.get('dd') !== '0' };
  if (p.get('po') === '1') {
    const you = (p.get('py') ?? 'S') as Seat;
    deal.poll = {
      you: SEATS.includes(you) ? you : 'S',
      form: ({ t: 'teams', p: 'pairs', m: 'mp', c: 'custom' } as Record<string, Form>)[p.get('pf') ?? ''] ?? '',
      formText: p.get('pft') ?? '',
      contract: parseContractCode(p.get('pk') ?? '') ?? undefined,
      visible: SEATS.filter((s) => (p.get('pw') ?? you).includes(s)),
      text: p.get('pt') ?? '',
      question: p.get('pq') ?? '',
      cards: p.get('pc') ?? '',
      hidePlayed: p.get('pp') === '1',
    };
  }
  return deal;
}

function readPlay(): Play | null {
  const params = new URLSearchParams(location.hash.slice(1));
  const [code, cards = ''] = (params.get('p') ?? '').split(':');
  const c = parseContractCode(code ?? '');
  return c ? { contract: c, played: cards.match(/[SHDC][AKQJT2-9]/g) ?? [], auto: params.get('pa') === '1', hideDefenders: params.get('pd') === '1' } : null;
}

function writeHash(deal: Deal, play: Play | null = null) {
  const parts = [`dl=${deal.dealer}`, `v=${deal.vul}`, `d=${toPbn(deal).replace(/ /g, '+')}`];
  if (deal.board) parts.unshift(`b=${deal.board}`);
  if (deal.auction.length) parts.push(`a=${formatAuction(deal.auction, deal.notes, '-').replace(/[%&#+]/g, encodeURIComponent).replace(/ /g, '+')}`);
  if (!deal.show.hcp) parts.push('h=0');
  if (!deal.show.dd) parts.push('dd=0');
  if (play) parts.push(`p=${contractCode(play.contract)}${play.played.length ? ':' + play.played.join('') : ''}`);
  if (play?.auto) parts.push('pa=1');
  if (play?.auto && play.hideDefenders) parts.push('pd=1');
  if (deal.poll) {
    const q = deal.poll;
    const enc = (v: string) => encodeURIComponent(v).replace(/%20/g, '+');
    parts.push('po=1', `py=${q.you}`, `pw=${q.visible.join('')}`);
    if (q.form) parts.push(`pf=${q.form[0]}`);
    if (q.form === 'custom' && q.formText) parts.push(`pft=${enc(q.formText)}`);
    if (q.contract) parts.push(`pk=${contractCode(q.contract)}`);
    if (q.hidePlayed) parts.push('pp=1');
    if (q.text) parts.push(`pt=${enc(q.text)}`);
    if (q.question) parts.push(`pq=${enc(q.question)}`);
    if (q.cards) parts.push(`pc=${q.cards.trim().replace(/\s+/g, '+')}`);
  }
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
  return [deal.board, deal.dealer, deal.vul, toPbn(deal), formatAuction(deal.auction, deal.notes), deal.show.hcp, deal.show.dd, JSON.stringify(deal.poll)].join('|');
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
  let selected: number | null = null;
  let active: Seat = 'N';

  const view = h('div', { class: 'hv-card' });
  const status = h('p', { class: 'hv-status', 'aria-live': 'polite' });
  const ddStatus = h('span', { class: 'hv-warn' });

  const dds = root.dataset.ddsWorker ? ddSolver(root.dataset.ddsWorker) : null;
  const analyse = dds?.analyse ?? null;
  let dd: DdView | null = null;
  let ddKey = '';
  let ddTimer: ReturnType<typeof setTimeout> | undefined;

  let play: Play | null = dds ? readPlay() : null;
  let playDeal = toPbn(deal);
  let playValues: Map<string, number> | null = null;
  let valuesKey = '';

  function requestValues(pv: PlayView) {
    const k = `${toPbn(deal)}|${contractCode(pv.play.contract)}|${pv.play.played.join('')}`;
    if (k === valuesKey) return;
    valuesKey = k;
    playValues = null;
    if (!pv.pos.next || !dds) return;
    dds.cardValues(pv.play, pv.pos)
      .then((values) => {
        if (valuesKey !== k) return;
        playValues = values;
        renderView();
      })
      .catch(() => (ddStatus.textContent = t.ddFailed));
  }

  let autoKey = '';
  /** Plays a defender's best card, the lowest of equal ones, once its values are known. */
  function autoDefend(pv: PlayView) {
    if (!pv.play.auto || !defendersTurn(pv) || !playValues || autoKey === valuesKey) return;
    const k = (autoKey = valuesKey);
    const values = playValues;
    const legal = [...pv.pos.legal];
    const best = Math.max(...legal.map((c) => values.get(c) ?? 0));
    const card = legal.filter((c) => values.get(c) === best).sort((a, b) => RANKS.indexOf(b[1]!) - RANKS.indexOf(a[1]!))[0]!;
    setTimeout(() => {
      if (!play || valuesKey !== k) return;
      play.played.push(card);
      refresh();
    }, 450);
  }

  const renderView = () => {
    root.classList.toggle('hv-polling', !!deal.poll);
    view.classList.toggle('hv-card-poll', !!deal.poll);
    if (deal.poll) {
      view.replaceChildren(pollView(deal, t, play));
      return;
    }
    let pv: PlayView | null = null;
    if (play) {
      pv = { play, pos: position(deal, play), values: null };
      requestValues(pv);
      pv.values = playValues;
      if (dd?.analysis && !dd.busy) pv.ddTricks = dd.analysis.table[play.contract.declarer][play.contract.strain];
      autoDefend(pv);
    }
    view.replaceChildren(diagram(deal, t, dd, pv));
    if (selected !== null) view.querySelector(`.hv-auction [data-index="${selected}"]`)?.classList.add('hv-selected');
  };

  function defaultContract(): PlayContract {
    const c = contract(deal.auction, deal.dealer);
    if (c && c !== 'passout') return { strain: c.strain === 'N' ? 'NT' : c.strain, declarer: c.declarer, level: c.level };
    const fresh = dd && !dd.busy && dealShape(deal).kind === 'full';
    const par = fresh ? dd.analysis?.par.contracts.find((p) => p.level > 0) : undefined;
    if (par) return { strain: par.strain, declarer: par.declarer[0] as Seat, level: par.level };
    return { strain: 'NT', declarer: 'S' };
  }

  const playBtn = h('button', { type: 'button', class: 'hv-play-toggle' });
  playBtn.addEventListener('click', () => {
    play = play && !deal.poll ? null : play ?? { contract: defaultContract(), played: [] };
    deal.poll = null;
    playDeal = toPbn(deal);
    refresh();
  });

  function requestDd(complete: boolean) {
    complete &&= deal.show.dd || !!play;
    const k = complete ? `${toPbn(deal)}|${deal.dealer}|${deal.vul}` : '';
    if (k === ddKey) return;
    ddKey = k;
    clearTimeout(ddTimer);
    ddStatus.textContent = '';
    if (!analyse || !complete) {
      dd = null;
      return;
    }
    dd = { analysis: dd?.analysis ?? null, busy: true };
    ddTimer = setTimeout(async () => {
      try {
        const analysis = await analyse(deal);
        if (!analysis || ddKey !== k) return;
        dd = { analysis, busy: false };
      } catch {
        dd = null;
        ddStatus.textContent = t.ddFailed;
      }
      renderView();
    }, 150);
  }
  const imageDd = () => (deal.show.dd && dd && !dd.busy ? dd.analysis : null);

  const toggle = (label: string, which: 'hcp' | 'dd') => {
    const box = h('input', { type: 'checkbox' });
    box.addEventListener('change', () => { deal.show[which] = box.checked; refresh(); });
    return { box, el: h('label', { class: 'hv-toggle' }, box, label) };
  };
  const hcpToggle = toggle(t.showHcp, 'hcp');
  const ddToggle = toggle(t.showDd, 'dd');
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
    const blob = deal.poll ? pollImage(deal, t, play) : dealImage(deal, t, imageDd());
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      flash(copyImage, t.imageCopied);
    } catch {
      download(await blob);
      flash(copyImage, t.imageSaved);
    }
  });
  const downloadImage = h('button', { type: 'button', class: 'hv-link' }, t.downloadImage);
  downloadImage.addEventListener('click', async () => download(await (deal.poll ? pollImage(deal, t, play) : dealImage(deal, t, imageDd()))));

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
    deal.notes = parsed.notes;
    selected = null;
    refresh();
  });
  auctionInput.addEventListener('blur', () => {
    if (!auctionInput.hasAttribute('aria-invalid')) auctionInput.value = formatAuction(deal.auction, deal.notes);
  });

  const current = () => (selected !== null && selected < deal.auction.length ? selected : deal.auction.length - 1);
  const annotLabel = h('span', { class: 'hv-annot-call' });
  const alertBtn = h('button', { type: 'button', class: 'hv-call hv-alert-btn', 'aria-pressed': 'false' }, t.alert);
  const noteInput = h('input', { class: 'hv-input hv-note-input', autocomplete: 'off', placeholder: t.notePlaceholder, 'aria-label': t.note });
  alertBtn.addEventListener('click', () => {
    const i = current();
    if (i < 0) return;
    deal.notes[i] = { ...deal.notes[i], alert: !deal.notes[i]?.alert };
    refresh();
  });
  noteInput.addEventListener('input', () => {
    const i = current();
    if (i < 0) return;
    deal.notes[i] = { ...deal.notes[i], note: noteInput.value.replace(/[()]/g, '').trim() || undefined };
    refresh();
  });
  const annotRow = h('div', { class: 'hv-annot' }, annotLabel, alertBtn, noteInput);
  const annotHelp = h('p', { class: 'hv-help' }, t.pickCall);

  const callButtons = new Map<Call, HTMLButtonElement>();
  const callButton = (call: Call, cls = 'hv-call') => {
    const b = h('button', { type: 'button', class: cls },
      callParts(call, t).map((p) => (p.suit ? h('span', { class: `hv-suit-${p.suit.toLowerCase()}` }, p.text) : p.text)));
    b.addEventListener('click', () => { deal.auction.push(call); selected = null; refresh(); });
    callButtons.set(call, b);
    return b;
  };
  const undoBtn = h('button', { type: 'button', class: 'hv-call hv-call-wide' }, t.undo);
  undoBtn.addEventListener('click', () => {
    deal.auction.pop();
    deal.notes.length = Math.min(deal.notes.length, deal.auction.length);
    selected = null;
    refresh();
  });
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
    button(t.random, () => { deal.hands = randomHands(); deal.auction = []; deal.notes = []; refresh(); }, 'hv-btn hv-btn-primary'),
    completeBtn,
    button(t.clear, () => {
      for (const seat of SEATS) deal.hands[seat] = emptyHand();
      deal.auction = [];
      deal.notes = [];
      active = 'N';
      refresh();
      handInputs.N.focus();
    }),
  );

  view.addEventListener('click', (e) => {
    const target = e.target as Element;
    if (play) {
      const card = target.closest<HTMLElement>('[data-card]')?.dataset.card;
      const pick = target.closest<HTMLElement>('[data-dd]')?.dataset.dd;
      const act = target.closest<HTMLElement>('[data-act]')?.dataset.act;
      if (card) play.played.push(card);
      if (pick) {
        const [declarer, strain] = pick.split(':') as [Seat, Strain];
        const tricks = dd?.analysis?.table[declarer][strain];
        play = { contract: { declarer, strain, level: tricks && tricks >= 7 ? tricks - 6 : undefined }, played: [], auto: play.auto };
      }
      if (act === 'undo') {
        const declarers = sideOf(play.contract.declarer);
        do play.played.pop();
        while (play.auto && play.played.length && sideOf(position(deal, play).next!) !== declarers);
      }
      if (act === 'auto') play = { ...play, played: [], auto: !play.auto };
      if (act === 'hide') play.hideDefenders = !play.hideDefenders;
      if (act === 'restart') play.played = [];
      if (act === 'close') play = null;
      if (card || pick || act) return refresh();
    }
    const seat = target.closest<HTMLElement>('.hv-hand')?.dataset.seat as Seat | undefined;
    if (seat && !play) handInputs[seat].focus();
    const index = target.closest<HTMLElement>('[data-index]')?.dataset.index;
    if (index !== undefined) {
      selected = Number(index);
      refresh();
      noteInput.focus();
    }
  });

  const pollBtn = h('button', { type: 'button', class: 'hv-play-toggle' }, t.poll);
  pollBtn.addEventListener('click', () => {
    deal.poll = deal.poll ? null : defaultPoll(deal, play);
    refresh();
  });

  const pollYou = h('select', { class: 'hv-input' }, SEATS.map((seat) => h('option', { value: seat }, t.seats[seat])));
  const pollForm = h('select', { class: 'hv-input' },
    h('option', { value: '' }, t.pollNoForm),
    (['teams', 'pairs', 'mp', 'custom'] as const).map((f) => h('option', { value: f }, t.forms[f])));
  const pollFormText = h('input', { class: 'hv-input', placeholder: t.formTextPlaceholder, autocomplete: 'off', 'aria-label': t.pollForm });
  const pollSeats = SEATS.map((seat) => {
    const b = h('button', { type: 'button', class: 'hv-tab', 'data-seat': seat, 'aria-pressed': 'false' }, seat);
    b.addEventListener('click', () => {
      const q = deal.poll!;
      q.visible = q.visible.includes(seat) ? q.visible.filter((s) => s !== seat) : SEATS.filter((s) => s === seat || q.visible.includes(s));
      refresh();
    });
    return b;
  });
  const pollText = h('textarea', { class: 'hv-input hv-poll-input', rows: 4, id: 'hv-poll-text' });
  const pollQuestion = h('input', { class: 'hv-input', id: 'hv-poll-q', placeholder: t.pollQuestion, autocomplete: 'off' });
  const pollCardsInput = h('input', { class: 'hv-input hv-auction-input', id: 'hv-poll-cards', placeholder: 'SA S8 S2 S5', autocomplete: 'off', spellcheck: 'false' });
  const edit = (f: (q: Poll) => void) => () => { if (deal.poll) { f(deal.poll); refresh(); } };
  pollYou.addEventListener('change', edit((q) => {
    const old = q.you;
    q.you = pollYou.value as Seat;
    q.visible = SEATS.filter((s) => s === q.you || (s !== old && q.visible.includes(s)));
  }));
  pollForm.addEventListener('change', edit((q) => (q.form = pollForm.value as Form)));
  pollFormText.addEventListener('input', edit((q) => (q.formText = pollFormText.value)));
  pollText.addEventListener('input', edit((q) => (q.text = pollText.value)));
  pollCardsInput.addEventListener('input', edit((q) => (q.cards = pollCardsInput.value)));
  const hidePlayedBox = h('input', { type: 'checkbox' });
  hidePlayedBox.addEventListener('change', edit((q) => (q.hidePlayed = hidePlayedBox.checked)));
  const hidePlayedRow = h('label', { class: 'hv-toggle' }, hidePlayedBox, t.hidePlayed);
  pollQuestion.addEventListener('input', edit((q) => (q.question = pollQuestion.value.trim() ? pollQuestion.value : '')));
  const pollEditor = h('fieldset', { class: 'hv-poll-edit' },
    h('legend', {}, t.poll),
    h('div', { class: 'hv-poll-row' },
      h('label', {}, h('span', {}, t.pollYou), pollYou),
      h('label', {}, h('span', {}, t.pollForm), pollForm),
    ),
    pollFormText,
    h('div', { class: 'hv-poll-seats' }, h('span', {}, t.pollVisible), h('div', { class: 'hv-tabs' }, pollSeats)),
    h('label', { for: 'hv-poll-text' }, t.pollText), pollText, h('p', { class: 'hv-help' }, t.pollTextHelp),
    h('label', { for: 'hv-poll-cards' }, t.pollCards), pollCardsInput, hidePlayedRow, h('p', { class: 'hv-help' }, t.pollCardsHelp),
    h('label', { for: 'hv-poll-q' }, t.pollQuestionLabel), pollQuestion,
  );

  function syncPollEditor() {
    const q = deal.poll;
    pollEditor.hidden = !q;
    if (!q) return;
    const focused = document.activeElement;
    pollYou.value = q.you;
    pollForm.value = q.form;
    pollFormText.hidden = q.form !== 'custom';
    if (focused !== pollFormText) pollFormText.value = q.formText;
    pollQuestion.placeholder = defaultQuestion(deal, t);
    for (const b of pollSeats) b.setAttribute('aria-pressed', String(q.visible.includes(b.dataset.seat as Seat)));
    if (focused !== pollText) pollText.value = q.text;
    if (focused !== pollQuestion) pollQuestion.value = q.question;
    if (focused !== pollCardsInput) pollCardsInput.value = q.cards;
    hidePlayedBox.checked = !!q.hidePlayed;
    hidePlayedRow.hidden = !pollCardsInput.value.trim();
  }

  root.replaceChildren(
    h('section', { class: 'hv-view' }, view,
      h('div', { class: 'hv-view-opts' }, hcpToggle.el, ddToggle.el, h('span', { class: 'hv-mode-btns' }, pollBtn, playBtn)),
      status, h('div', { class: 'hv-view-links' }, copyImage, downloadImage, copyLink, solver)),
    h('section', { class: 'hv-editor' },
      pollEditor,
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
        auctionInput, auctionError, biddingBox, annotRow, annotHelp,
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
      auctionInput.value = formatAuction(deal.auction, deal.notes);
      auctionInput.removeAttribute('aria-invalid');
      auctionError.textContent = '';
    }
    for (const [call, b] of callButtons) b.disabled = !isLegal(deal.auction, deal.dealer, call);
    undoBtn.disabled = !deal.auction.length;

    const ci = current();
    annotRow.hidden = ci < 0;
    annotHelp.hidden = ci < 0;
    if (ci >= 0) {
      annotLabel.replaceChildren(`${t.callNo(ci + 1)}: `, ...callParts(deal.auction[ci]!, t).map((p) => (p.suit ? h('span', { class: `hv-suit-${p.suit.toLowerCase()}` }, p.text) : p.text)));
      alertBtn.setAttribute('aria-pressed', String(!!deal.notes[ci]?.alert));
      if (focused !== noteInput) noteInput.value = deal.notes[ci]?.note ?? '';
    }
    hcpToggle.box.checked = deal.show.hcp;
    ddToggle.box.checked = deal.show.dd;
    ddToggle.el.hidden = !analyse;

    const dups = duplicates(deal);
    const shape = dealShape(deal);
    const complete = shape.kind === 'full';
    const playable = !!dds && (complete || shape.kind === 'ending');
    if (!playable) play = null;
    if (play && toPbn(deal) !== playDeal) play.played = [];
    playDeal = toPbn(deal);
    playBtn.hidden = !dds;
    pollBtn.setAttribute('aria-pressed', String(!!deal.poll));
    hcpToggle.el.hidden = !!deal.poll;
    ddToggle.el.hidden ||= !!deal.poll;
    syncPollEditor();
    playBtn.disabled = !playable;
    playBtn.textContent = play ? `■ ${t.stopShort}` : `▶ ${t.play}`;
    playBtn.setAttribute('aria-pressed', String(!!play));
    requestDd(playable);
    renderView();
    status.replaceChildren(
      ...dups.map(([card, seats]) => h('span', { class: 'hv-warn' }, t.dup(SUIT_GLYPH[card[0] as 'S'] + card[1], seats.join(', ')))),
      shape.kind === 'full' ? t.done : shape.kind === 'ending' ? t.ending(shape.cards) : shape.kind === 'partial' ? t.missing(shape.missing) : '',
      ddStatus,
    );
    status.classList.toggle('hv-ok', complete || shape.kind === 'ending');
    completeBtn.disabled = SEATS.filter((seat) => handSize(deal.hands[seat]) < 13).length !== 1 || dups.length > 0;
    solver.hidden = !complete;
    if (complete) solver.href = solverUrl(deal);

    writeHash(deal, play);
  }

  window.addEventListener('hashchange', () => {
    const next = readHash();
    const nextPlay = dds ? readPlay() : null;
    const playCode = (p: Play | null) => (p ? contractCode(p.contract) + p.played.join('') + (p.auto ? '!' : '') : '');
    if (next && (key(next) !== key(deal) || playCode(nextPlay) !== playCode(play))) {
      deal = next;
      play = nextPlay;
      playDeal = toPbn(deal);
      refresh();
    }
  });

  setupTheme(t);
  refresh();
}

const root = document.getElementById('handviewer');
if (root) mount(root);
