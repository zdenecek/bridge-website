import { AUCTION_SEATS, SUIT_GLYPH, auctionRows, callParts, contractParts } from './diagram';
import type { Texts } from './i18n';
import { type Deal, type Hand, type Seat, SEATS, SUITS, handSize, hcp, isVulnerable } from './model';

/** The image is always light, so it reads the same pasted anywhere. */
const C = {
  card: '#ffffff', edge: '#e1e5e1', ink: '#222222', muted: '#5f6661', rule: '#e3e6e3',
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

function draw(ctx: Ctx | null, deal: Deal, t: Texts, measure: Ctx): { w: number; h: number } {
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
  const col3 = Math.max(5.5 * F, hands.E);
  const gridW = col1 + col2 + col3 + 2 * GAP_X;
  const row2 = Math.max(handH, COMPASS_SIZE + 0.4 * F);
  const gridH = handH + row2 + handH + 0.3 * F;

  const rows = deal.auction.length ? auctionRows(deal.auction, deal.dealer) : [];
  const result = contractParts(deal, t);
  font(m, 500, AF);
  const colW = [0, 1, 2, 3].map((c) => Math.max(3.4 * AF, ...rows.map((r) => {
    const cell = r[c];
    return cell && 'call' in cell ? partsWidth(m, callParts(cell.call, t)) + AF : 0;
  })));
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
  const auctionH = rows.length ? AROW * (rows.length + 1) + 0.2 * F + (result ? 1.6 * 0.75 * F : 0) : 0;

  const contentW = Math.max(gridW, auctionW, resultW);
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
  const y2 = y0 + handH + 0.15 * F;
  const y3 = y2 + row2 + 0.15 * F;

  drawHand(ctx, deal.hands.N, x2 + (col2 - hands.N) / 2, y0);
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
    if (!handSize(deal.hands[seat])) continue;
    const [c, r] = spots[seat];
    ctx.fillText(String(hcp(deal.hands[seat])), x0 + c * cell + cell / 2, hcpY + r * 1.15 * 0.6 * F + 0.3 * F);
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
        drawParts(ctx, parts, x + (colW[c]! - partsWidth(ctx, parts)) / 2, y + AROW / 2, cellData.call === 'P' ? C.muted : C.ink);
      } else if (cellData) {
        ctx.fillStyle = C.muted;
        ctx.textAlign = 'left';
        ctx.fillText(t.allPass, x + 0.5 * AF, y + AROW / 2);
      }
      x += colW[c]!;
    });
    y += AROW;
  }

  if (result) {
    font(ctx, 400, 0.75 * F);
    drawParts(ctx, result, PAD + (contentW - resultW) / 2, y + 0.2 * F + 0.8 * 0.75 * F, C.muted);
  }
  return { w, h };
}

export async function dealImage(deal: Deal, t: Texts): Promise<Blob> {
  await Promise.all([400, 500, 600, 700].map((wgt) => document.fonts.load(`${wgt} ${F}px Lexend`).catch(() => null)));
  const canvas = document.createElement('canvas');
  const measure = canvas.getContext('2d')!;
  const { w, h } = draw(null, deal, t, measure);
  canvas.width = w * SCALE;
  canvas.height = h * SCALE;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(SCALE, SCALE);
  draw(ctx, deal, t, ctx);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob'))), 'image/png'));
}
