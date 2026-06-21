import { loadConfig } from '../core/config.js';
import { getEntries } from '../core/cache.js';
import { findBest } from '../core/matcher.js';
import { printResult, printError } from '../util/output.js';

export function runResolve(query: string, opts: { refresh?: boolean }): never {
  const config = loadConfig();
  const entries = getEntries(config, { forceRefresh: opts.refresh });
  const result = findBest(query, entries, config);

  if (!result) {
    printError(`no folder matching "${query}" found in configured base dirs.`);
  }

  printResult(result.entry.path);
}
