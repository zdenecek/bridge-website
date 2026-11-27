import { connectDdsWorker } from 'bridge-dds-wasm/client';
import type { DdTable, Par } from 'bridge-dds-wasm';
import { type Deal, toPbn } from './model';

export type { DdTable, Par };
export interface Analysis { table: DdTable; par: Par }

type Client = ReturnType<typeof connectDdsWorker>;

/** Runs the solver in a worker, one deal at a time; a newer request makes older ones moot. */
export function ddAnalyser(workerUrl: string) {
  let client: Client | null = null;
  const cache = new Map<string, Analysis>();
  let latest = '';

  return async (deal: Deal): Promise<Analysis | null> => {
    const key = `${toPbn(deal)}|${deal.dealer}|${deal.vul}`;
    latest = key;
    const hit = cache.get(key);
    if (hit) return hit;
    client ??= connectDdsWorker(new Worker(workerUrl, { type: 'module' }));
    const result = await client.analyse(toPbn(deal), { dealer: deal.dealer, vulnerability: deal.vul });
    cache.set(key, result);
    return key === latest ? result : null;
  };
}
