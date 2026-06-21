import { loadConfig } from '../core/config.js';
import { getEntries } from '../core/cache.js';
import { printInfo } from '../util/output.js';

export function runRefresh(): void {
  const config = loadConfig();
  const entries = getEntries(config, { forceRefresh: true });
  printInfo(`cache refreshed, ${entries.length} folders indexed across ${config.baseDirs.length} base dir(s).`);
}
