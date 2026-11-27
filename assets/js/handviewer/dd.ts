import { connectDdsWorker } from 'bridge-dds-wasm/client';
import type { DdTable, Par } from 'bridge-dds-wasm';
import { type Deal, toPbn } from './model';
import { type Play, type Position, sideOf, startPbn } from './play';

export type { DdTable, Par };
export interface Analysis { table: DdTable; par: Par }

type Client = ReturnType<typeof connectDdsWorker>;

/** One solver worker for the page, started on first use; calls run one after another. */
export function ddSolver(workerUrl: string) {
  let client: Client | null = null;
  const connect = () => (client ??= connectDdsWorker(new Worker(workerUrl, { type: 'module' })));
  const tables = new Map<string, Analysis>();
  const plays = new Map<string, Map<string, number>>();

  /** Table and par; null when a newer request came in meanwhile. */
  let latest = '';
  async function analyse(deal: Deal): Promise<Analysis | null> {
    const key = `${toPbn(deal)}|${deal.dealer}|${deal.vul}`;
    latest = key;
    const hit = tables.get(key);
    if (hit) return hit;
    const result = await connect().analyse(toPbn(deal), { dealer: deal.dealer, vulnerability: deal.vul });
    tables.set(key, result);
    return key === latest ? result : null;
  }

  /** Total tricks the side to play ends with after each card it may play now. */
  async function cardValues(play: Play, pos: Position): Promise<Map<string, number>> {
    const key = `${startPbn(pos)}|${play.contract.strain}|${pos.leader}|${pos.trick.join('')}`;
    let values = plays.get(key);
    if (!values) {
      const { cards } = await connect().solveBoard(startPbn(pos), {
        trump: play.contract.strain, leader: pos.leader, trick: pos.trick as never, solutions: 3,
      });
      values = new Map();
      for (const c of cards) for (const card of [c.card, ...c.equals]) values.set(card, c.tricks);
      plays.set(key, values);
    }
    const won = pos.won[sideOf(pos.next!)];
    return new Map([...values].map(([card, n]) => [card, n + won]));
  }

  return { analyse, cardValues };
}
