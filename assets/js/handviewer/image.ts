import type { Analysis } from './dd';
import { AUCTION_SEATS, DD_SEATS, DD_STRAINS, SUIT_GLYPH, asksCall, auctionRows, callParts, contractParts, parParts, strainParts } from './diagram';
import type { Texts } from './i18n';
import { noteNumbers } from './auction';
import type { Play } from './play';
import { type Run, defaultQuestion, paragraphs, pollContract, pollDeal, pollMeta, richRuns, trickTable } from './poll';
import { type Deal, type Hand, type Seat, SEATS, SUITS, dealShape, handSize, hcp, isVulnerable } from './model';

/** The image is always light, so it reads the same pasted anywhere. */
const C = {
  card: '#ffffff', edge: '#e1e5e1', ink: '#222222', muted: '#5f6661', rule: '#e3e6e3', alert: '#ffe6a3', question: '#eef5ee', won: '#d9efd4',
  vul: '#d93636', nonvul: '#1a881a',
  S: '#33339b', H: '#ff0000', D: '#ff9b00', C: '#32ad01',
};

const FAMILY = "Lexend, Verdana, sans-serif";
const F = 22;
const SCALE = 2;
const LH = 1.35 * F;
const COMPASS_SIZE = 5.4 * F;
const PAD = 1.5 * F;
const GAP_X = 0.5 * F;
const AF = 0.8 * F;
const AROW = 1.55 * AF;
const DF = 0.62 * F;
const DD_CELL = 1.75 * DF;
const DD_ROW = 1.3 * DF;

type Ctx = CanvasRenderingContext2D;
type Part = { text: string; suit?: string };

function font(ctx: Ctx, weight: number, size: number, spacing = 0) {
  ctx.font = `${weight} ${size}px ${FAMILY}`;
  if ('letterSpacing' in ctx) (ctx as Ctx & { letterSpacing: string }).letterSpacing = `${spacing}px`;
}

function cardsText(hand: Hand, suit: (typeof SUITS)[number]) {
  return hand[suit] || (handSize(hand) ? '—' : '');
}

function handWidth(ctx: Ctx, hand: Hand) {
  font(ctx, 500, F, 0.06 * F);
  return 1.3 * F + Math.max(...SUITS.map((s) => ctx.measureText(cardsText(hand, s)).width));
}

function drawHand(ctx: Ctx, hand: Hand, x: number, y: number) {
  ctx.textBaseline = 'middle';
  SUITS.forEach((suit, i) => {
    const cy = y + i * LH + LH / 2;
    font(ctx, 500, F);
    ctx.textAlign = 'center';
    ctx.fillStyle = C[suit];
    ctx.globalAlpha = handSize(hand) ? 1 : 0.3;
    ctx.fillText(SUIT_GLYPH[suit], x + F / 2, cy);
    ctx.globalAlpha = 1;
    font(ctx, 500, F, 0.06 * F);
    ctx.textAlign = 'left';
    ctx.fillStyle = C.ink;
    ctx.fillText(cardsText(hand, suit), x + 1.3 * F, cy);
  });
}

function drawCompass(ctx: Ctx, deal: Deal, cx: number, cy: number) {
  const k = COMPASS_SIZE / 168;
  const discs = [
    { seat: 'N', x: 84, y: 42, angle: 0 },
    { seat: 'E', x: 126, y: 84, angle: 90 },
    { seat: 'S', x: 84, y: 126, angle: 180 },
    { seat: 'W', x: 42, y: 84, angle: 270 },
  ] as const;
  ctx.save();
  ctx.translate(cx - COMPASS_SIZE / 2, cy - COMPASS_SIZE / 2);
  ctx.scale(k, k);
  for (const { seat, x, y, angle } of discs) {
    ctx.fillStyle = isVulnerable(seat, deal.vul) ? C.vul : C.nonvul;
    if (seat === deal.dealer) {
      ctx.save();
      ctx.translate(84, 84);
      ctx.rotate((angle * Math.PI) / 180);
      ctx.translate(-84, -84);
      ctx.fill(new Path2D('M84 2.4 L103.8 22.2 A28 28 0 1 1 64.2 22.2 Z'));
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(x, y, 28, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#fff';
    font(ctx, 700, 34);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(seat, x, y + 1);
  }
  ctx.restore();
}

function partsWidth(ctx: Ctx, parts: Part[]) {
  return parts.reduce((w, p) => w + ctx.measureText(p.text).width, 0);
}

function drawParts(ctx: Ctx, parts: Part[], x: number, y: number, ink = C.ink) {
  ctx.textAlign = 'left';
  for (const p of parts) {
    ctx.fillStyle = p.suit ? C[p.suit as 'S'] : ink;
    ctx.fillText(p.text, x, y);
    x += ctx.measureText(p.text).width;
  }
}

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function draw(ctx: Ctx | null, deal: Deal, t: Texts, measure: Ctx, dd: Analysis | null): { w: number; h: number } {
  const m = measure;
  const hands = Object.fromEntries(SEATS.map((s) => [s, handWidth(m, deal.hands[s])])) as Record<Seat, number>;
  const handH = 4 * LH;

  font(m, 700, 1.6 * F);
  const numW = deal.board ? m.measureText(String(deal.board)).width : 0;
  font(m, 400, 0.6 * F);
  const sub = `${t.vuls[deal.vul]} / ${deal.dealer}`;
  const headerW = Math.max(numW, m.measureText(sub).width);
  const hcpW = 3 * 1.4 * 0.6 * F;

  const col1 = Math.max(5.5 * F, hands.W, headerW, hcpW);
  const col2 = Math.max(hands.N, hands.S, COMPASS_SIZE + 0.4 * F);
  const shape = dealShape(deal);
  const full = shape.kind === 'full';
  const showHcp = deal.show.hcp && shape.kind !== 'ending';
  const ddW = dd ? 6 * DD_CELL : 0;
  const ddH = dd ? 5 * DD_ROW : 0;
  const par = dd && full ? [{ text: 'Par ' }, ...parParts(dd.par, t)] : [];
  font(m, 500, DF);
  const parW = par.length ? partsWidth(m, par) : 0;
  const col3 = Math.max(5.5 * F, hands.E, ddW, parW);
  const gridW = col1 + col2 + col3 + 2 * GAP_X;
  const row2 = Math.max(handH, COMPASS_SIZE + 0.4 * F);
  const row1 = Math.max(handH, ddH);
  const gridH = row1 + row2 + handH + 0.3 * F;

  const ask = asksCall(deal);
  const rows = deal.auction.length || ask ? auctionRows(deal.auction, deal.dealer, ask) : [];
  const result = contractParts(deal, t);
  font(m, 500, AF);
  const numbers = noteNumbers(deal.notes);
  const colW = [0, 1, 2, 3].map((c) => Math.max(3.4 * AF, ...rows.map((r) => {
    const cell = r[c];
    return cell && 'call' in cell ? partsWidth(m, callParts(cell.call, t)) + 1.6 * AF : 0;
  })));
  const NF = 0.68 * F;
  const NROW = 1.45 * NF;
  font(m, 400, NF);
  const noteLines = [...numbers].map(([i, n]) => ({ n: String(n), text: deal.notes[i]!.note! }));
  const notesW = Math.max(0, ...noteLines.map((l) => m.measureText(l.text).width + 1.2 * NF));
  const notesH = noteLines.length ? 0.4 * F + noteLines.length * NROW : 0;
  for (const r of rows) {
    const c = r.findIndex((cell) => cell && 'allPass' in cell);
    if (c < 0) continue;
    const need = m.measureText(t.allPass).width + AF;
    const have = colW.slice(c).reduce((a, b) => a + b, 0);
    if (need > have) colW[3] += need - have;
  }
  const auctionW = colW.reduce((a, b) => a + b, 0);
  font(m, 400, 0.75 * F);
  const resultW = result ? partsWidth(m, result) : 0;
  const auctionH = rows.length ? AROW * (rows.length + 1) + notesH + 0.2 * F + (result ? 1.6 * 0.75 * F : 0) : 0;

  const contentW = Math.max(gridW, auctionW, resultW, notesW);
  const w = Math.ceil(contentW + 2 * PAD);
  const h = Math.ceil(gridH + (auctionH ? 1.1 * F + auctionH : 0) + 2 * PAD);
  if (!ctx) return { w, h };

  roundRect(ctx, 0.5, 0.5, w - 1, h - 1, 16);
  ctx.fillStyle = C.card;
  ctx.fill();
  ctx.strokeStyle = C.edge;
  ctx.lineWidth = 1;
  ctx.stroke();

  const x0 = PAD + (contentW - gridW) / 2;
  const y0 = PAD;
  const x2 = x0 + col1 + GAP_X;
  const x3 = x2 + col2 + GAP_X;
  const y2 = y0 + row1 + 0.15 * F;
  const y3 = y2 + row2 + 0.15 * F;

  drawHand(ctx, deal.hands.N, x2 + (col2 - hands.N) / 2, y0 + row1 - handH);
  drawHand(ctx, deal.hands.S, x2 + (col2 - hands.S) / 2, y3);
  drawHand(ctx, deal.hands.W, x0 + col1 - hands.W, y2 + (row2 - handH) / 2);
  drawHand(ctx, deal.hands.E, x3, y2 + (row2 - handH) / 2);
  drawCompass(ctx, deal, x2 + col2 / 2, y2 + row2 / 2);

  const hx = x0 + headerW / 2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  if (deal.board) {
    font(ctx, 700, 1.6 * F);
    ctx.fillStyle = C.ink;
    ctx.fillText(String(deal.board), hx, y0);
  }
  font(ctx, 400, 0.6 * F);
  ctx.fillStyle = C.muted;
  ctx.fillText(sub, hx, y0 + (deal.board ? 1.75 * F : 0));

  font(ctx, 600, 0.6 * F);
  ctx.textBaseline = 'middle';
  const cell = 1.4 * 0.6 * F;
  const hcpY = y3 + handH - 3 * 1.15 * 0.6 * F;
  const spots: Record<Seat, [number, number]> = { N: [1, 0], E: [2, 1], S: [1, 2], W: [0, 1] };
  for (const seat of SEATS) {
    if (!showHcp || !handSize(deal.hands[seat])) continue;
    const [c, r] = spots[seat];
    ctx.fillText(String(hcp(deal.hands[seat])), x0 + c * cell + cell / 2, hcpY + r * 1.15 * 0.6 * F + 0.3 * F);
  }

  if (dd) {
    const dx = x3 + col3 - ddW;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    DD_STRAINS.forEach((st, c) => {
      font(ctx, 600, DF);
      const p = strainParts(st, t);
      drawParts(ctx, p.map((q) => ({ ...q, suit: undefined })), dx + (c + 1.5) * DD_CELL - partsWidth(ctx, p) / 2, y0 + DD_ROW / 2, C.muted);
    });
    ctx.fillStyle = C.rule;
    ctx.fillRect(dx, y0 + DD_ROW, ddW, 1);
    DD_SEATS.forEach((seat, r) => {
      const cy = y0 + (r + 1.5) * DD_ROW;
      font(ctx, 600, DF);
      ctx.textAlign = 'center';
      ctx.fillStyle = C.muted;
      ctx.fillText(seat, dx + DD_CELL / 2, cy);
      DD_STRAINS.forEach((st, c) => {
        const n = dd.table[seat][st];
        const makes = full && n >= 7;
        font(ctx, makes ? 700 : 400, DF);
        ctx.fillStyle = makes ? C.ink : C.muted;
        ctx.fillText(String(n), dx + (c + 1.5) * DD_CELL, cy);
      });
    });
    font(ctx, 500, DF);
    ctx.textBaseline = 'alphabetic';
    if (par.length) drawParts(ctx, par, x3 + col3 - parW, y3 + handH - 0.2 * F, C.muted);
  }

  if (!rows.length) return { w, h };

  const ax = PAD + (contentW - auctionW) / 2;
  let y = y0 + gridH + 1.1 * F;
  let x = ax;
  ctx.textBaseline = 'middle';
  AUCTION_SEATS.forEach((seat, c) => {
    const pw = 2.4 * AF;
    roundRect(ctx, x + (colW[c]! - pw) / 2, y + 0.12 * AROW, pw, 0.76 * AROW, 0.38 * AROW);
    ctx.fillStyle = isVulnerable(seat, deal.vul) ? C.vul : C.nonvul;
    ctx.fill();
    font(ctx, 700, 0.75 * AF);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(seat, x + colW[c]! / 2, y + AROW / 2 + 1);
    x += colW[c]!;
  });
  y += AROW;
  ctx.fillStyle = C.rule;
  ctx.fillRect(ax, y, auctionW, 1);

  font(ctx, 500, AF);
  for (const r of rows) {
    x = ax;
    r.forEach((cellData, c) => {
      if (cellData && 'call' in cellData) {
        const parts = callParts(cellData.call, t);
        const pw = partsWidth(ctx, parts);
        const px = x + (colW[c]! - pw) / 2;
        if (deal.notes[cellData.index]?.alert) {
          roundRect(ctx, px - 0.25 * AF, y + 0.14 * AROW, pw + 0.5 * AF, 0.72 * AROW, 0.2 * AF);
          ctx.fillStyle = C.alert;
          ctx.fill();
        }
        drawParts(ctx, parts, px, y + AROW / 2, cellData.call === 'P' ? C.muted : C.ink);
        const n = numbers.get(cellData.index);
        if (n) {
          font(ctx, 600, 0.6 * AF);
          ctx.fillStyle = C.muted;
          ctx.fillText(String(n), px + pw + 0.3 * AF, y + AROW * 0.3);
          font(ctx, 500, AF);
        }
      } else if (cellData && 'ask' in cellData) {
        font(ctx, 700, AF);
        ctx.fillStyle = C.nonvul;
        ctx.textAlign = 'center';
        ctx.fillText('?', x + colW[c]! / 2, y + AROW / 2);
        font(ctx, 500, AF);
      } else if (cellData) {
        ctx.fillStyle = C.muted;
        ctx.textAlign = 'left';
        ctx.fillText(t.allPass, x + 0.5 * AF, y + AROW / 2);
      }
      x += colW[c]!;
    });
    y += AROW;
  }

  if (noteLines.length) {
    y += 0.4 * F;
    const nx = PAD + (contentW - Math.max(auctionW, notesW)) / 2;
    for (const line of noteLines) {
      font(ctx, 600, 0.75 * NF);
      ctx.fillStyle = C.muted;
      ctx.textAlign = 'left';
      ctx.fillText(line.n, nx, y + NROW * 0.4);
      font(ctx, 400, NF);
      ctx.fillStyle = C.ink;
      ctx.fillText(line.text, nx + 1.2 * NF, y + NROW / 2);
      y += NROW;
    }
  }

  if (result) {
    font(ctx, 400, 0.75 * F);
    drawParts(ctx, result, PAD + (contentW - resultW) / 2, y + 0.2 * F + 0.8 * 0.75 * F, C.muted);
  }
  return { w, h };
}

async function loadFonts() {
  await Promise.all([400, 500, 600, 700].map((wgt) => document.fonts.load(`${wgt} ${F}px Lexend`).catch(() => null)));
}

function dealCanvas(deal: Deal, t: Texts, dd: Analysis | null): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const measure = canvas.getContext('2d')!;
  const { w, h } = draw(null, deal, t, measure, dd);
  canvas.width = w * SCALE;
  canvas.height = h * SCALE;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(SCALE, SCALE);
  draw(ctx, deal, t, ctx, dd);
  return canvas;
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob'))), 'image/png'));
}

export async function dealImage(deal: Deal, t: Texts, dd: Analysis | null = null): Promise<Blob> {
  await loadFonts();
  return toBlob(dealCanvas(deal, t, dd));
}

type Placed = Run & { x: number };

/** Breaks styled text into lines no wider than maxW, keeping a bid like 1♦ together. */
function wrap(m: Ctx, list: Run[], size: number, weight: number, maxW: number): Placed[][] {
  const pieces = list.flatMap((r) => r.text.split(/(\s+)/).filter(Boolean).map((text) => ({ ...r, text })));
  const width = (p: Run) => {
    font(m, p.bold ? 700 : weight, size);
    return m.measureText(p.text).width;
  };
  font(m, weight, size);
  const space = m.measureText(' ').width;
  const lines: Placed[][] = [[]];
  let x = 0;
  let gap = false;
  let word: Run[] = [];
  const flush = () => {
    if (!word.length) return;
    const w = word.reduce((a, p) => a + width(p), 0);
    if (x > 0 && x + (gap ? space : 0) + w > maxW) {
      lines.push([]);
      x = 0;
    } else if (gap && x > 0) x += space;
    for (const p of word) {
      lines[lines.length - 1]!.push({ ...p, x });
      x += width(p);
    }
    word = [];
    gap = false;
  };
  for (const p of pieces) {
    if (/^\s+$/.test(p.text)) {
      flush();
      gap = true;
    } else word.push(p);
  }
  flush();
  return lines;
}

function drawLines(ctx: Ctx | null, lines: Placed[][], x: number, y: number, size: number, weight: number, color: string, lh: number) {
  if (ctx) {
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    lines.forEach((line, i) => {
      for (const p of line) {
        font(ctx, p.bold ? 700 : weight, size);
        ctx.fillStyle = p.suit ? C[p.suit] : color;
        ctx.fillText(p.text, x + p.x, y + i * lh + size);
      }
    });
  }
  return lines.length * lh;
}

const POLL_W = 24 * F;

function drawPanel(ctx: Ctx | null, m: Ctx, deal: Deal, t: Texts, play: Play | null, x: number, y0: number): number {
  const poll = deal.poll!;
  let y = y0;
  const text = (list: Run[], size: number, weight: number, color: string, lh = 1.45) =>
    (y += drawLines(ctx, wrap(m, list, size, weight, POLL_W), x, y, size, weight, color, lh * size));

  text([{ text: t.youAre(t.seats[poll.you]) }], 1.5 * F, 700, C.ink, 1.2);
  y += 0.45 * F;
  text(richRuns(pollMeta(deal, poll, t, play).join(' · ')), 0.78 * F, 400, C.muted);
  for (const para of paragraphs(poll.text)) {
    y += 0.55 * F;
    text(para, 0.92 * F, 400, C.ink);
  }

  const table = trickTable(deal, play);
  if (table) {
    y += 0.8 * F;
    const dummy = SEATS[(SEATS.indexOf(pollContract(deal, play)!.declarer) + 2) % 4];
    const mark = (seat: Seat) => (seat === poll.you ? ` (${t.youMark})` : seat === dummy ? ` (${t.dummyMark})` : '');
    const heads = [t.trick, ...table.seats.map((s) => t.seats[s] + mark(s))];
    const HS = 0.72 * F;
    const RS = 0.85 * F;
    font(m, 600, HS);
    const cols = heads.map((hd) => m.measureText(hd).width + 1.1 * F);
    const rowH = 1.9 * RS;
    if (ctx) {
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      let cx = x;
      heads.forEach((hd, i) => {
        font(ctx, 600, HS);
        ctx.fillStyle = C.muted;
        ctx.fillText(hd, cx + cols[i]! / 2, y + rowH / 2);
        cx += cols[i]!;
      });
      const tw = cols.reduce((a, b) => a + b, 0);
      ctx.fillStyle = C.rule;
      ctx.fillRect(x, y + rowH, tw, 1);
      table.rows.forEach((row, r) => {
        const cy = y + (r + 1.5) * rowH;
        let px = x;
        font(ctx, 500, RS);
        ctx.fillStyle = C.ink;
        ctx.textAlign = 'center';
        ctx.fillText(String(row.n), px + cols[0]! / 2, cy);
        px += cols[0]!;
        table.seats.forEach((seat, i) => {
          const card = row.cards[seat];
          if (row.ask === seat) {
            font(ctx, 700, RS);
            ctx.fillStyle = C.nonvul;
            ctx.textAlign = 'center';
            ctx.fillText('?', px + cols[i + 1]! / 2, cy);
          }
          if (card) {
            font(ctx, row.winner === seat ? 700 : 500, RS);
            const g = SUIT_GLYPH[card[0] as 'S'];
            const gw = ctx.measureText(g).width;
            const rw = ctx.measureText(card[1]!).width;
            const sx = px + (cols[i + 1]! - gw - rw) / 2;
            const won = row.winner === seat;
            const led = row.leader === seat;
            if (won || led) {
              roundRect(ctx, sx - 0.3 * RS, cy - 0.72 * RS, gw + rw + 0.6 * RS, 1.44 * RS, 0.3 * RS);
              if (won) {
                ctx.fillStyle = C.won;
                ctx.fill();
              }
              if (led) {
                ctx.strokeStyle = C.muted;
                ctx.lineWidth = 1;
                ctx.stroke();
              }
            }
            ctx.textAlign = 'left';
            ctx.fillStyle = C[card[0] as 'S'];
            ctx.fillText(g, sx, cy);
            ctx.fillStyle = C.ink;
            ctx.fillText(card[1]!, sx + gw, cy);
          }
          px += cols[i + 1]!;
        });
        ctx.fillStyle = C.rule;
        ctx.fillRect(x, y + (r + 2) * rowH, tw, 1);
      });
    }
    y += rowH * (table.rows.length + 1);
  }

  y += 1 * F;
  const QS = 0.95 * F;
  const pad = 0.85 * F;
  const lines = wrap(m, richRuns(poll.question || defaultQuestion(deal, t)), QS, 700, POLL_W - 2 * pad);
  const boxH = lines.length * 1.4 * QS + 2 * pad;
  if (ctx) {
    roundRect(ctx, x, y, POLL_W, boxH, 0.7 * F);
    ctx.fillStyle = C.question;
    ctx.fill();
    drawLines(ctx, lines, x + pad, y + pad, QS, 700, C.ink, 1.4 * QS);
  }
  y += boxH;
  return y - y0;
}

/** The whole poll screen: the seat's view of the deal on the left, the text and question on the right. */
export async function pollImage(deal: Deal, t: Texts, play: Play | null): Promise<Blob> {
  await loadFonts();
  const left = dealCanvas(pollDeal(deal, deal.poll!), t, null);
  const lw = left.width / SCALE;
  const lh = left.height / SCALE;
  const OUT = 1.3 * F;
  const GAP = 1.8 * F;
  const m = document.createElement('canvas').getContext('2d')!;
  const panelH = drawPanel(null, m, deal, t, play, 0, 0);
  const w = Math.ceil(2 * OUT + lw + GAP + POLL_W);
  const h = Math.ceil(2 * OUT + Math.max(lh, panelH + 0.4 * F));
  const canvas = document.createElement('canvas');
  canvas.width = w * SCALE;
  canvas.height = h * SCALE;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(SCALE, SCALE);
  roundRect(ctx, 0.5, 0.5, w - 1, h - 1, 18);
  ctx.fillStyle = C.card;
  ctx.fill();
  ctx.strokeStyle = C.edge;
  ctx.stroke();
  ctx.drawImage(left, OUT, OUT, lw, lh);
  drawPanel(ctx, ctx, deal, t, play, OUT + lw + GAP, OUT + 0.4 * F);
  return toBlob(canvas);
}
