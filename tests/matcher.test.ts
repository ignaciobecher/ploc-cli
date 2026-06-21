import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findBest, rankAll } from '../src/core/matcher.ts';
import type { ConfigFile, FolderEntry } from '../src/types.ts';

const config: ConfigFile = {
  version: 1,
  baseDirs: ['C:\\base1', 'C:\\base2'],
  scanDepth: 1,
  cacheTtlMinutes: 5,
};

const entries: FolderEntry[] = [
  { name: 'desktop-erp', path: 'C:\\base1\\desktop-erp', baseDir: 'C:\\base1' },
  { name: 'desktop-erp-old', path: 'C:\\base1\\desktop-erp-old', baseDir: 'C:\\base1' },
  { name: 'autino-front', path: 'C:\\base1\\autino-front', baseDir: 'C:\\base1' },
  { name: 'DESKTOP-ERP', path: 'C:\\base2\\DESKTOP-ERP', baseDir: 'C:\\base2' },
];

test('exact match beats partial and fuzzy', () => {
  const result = findBest('desktop-erp', entries, config);
  assert.equal(result?.tier, 'exact');
  assert.equal(result?.entry.baseDir, 'C:\\base1'); // base dir priority order
});

test('case-insensitive exact match', () => {
  const subset = entries.filter((e) => e.name === 'DESKTOP-ERP');
  const result = findBest('desktop-erp', subset, config);
  assert.equal(result?.tier, 'exact');
});

test('partial match wins when no exact match exists', () => {
  const subset = entries.filter((e) => e.name !== 'desktop-erp' && e.name !== 'DESKTOP-ERP');
  const result = findBest('desktop-erp', subset, config);
  assert.equal(result?.tier, 'partial');
  assert.equal(result?.entry.name, 'desktop-erp-old');
});

test('fuzzy match resolves typos when no exact/partial exists', () => {
  const subset = entries.filter((e) => e.name === 'autino-front');
  const result = findBest('autno-frnt', subset, config);
  assert.equal(result?.tier, 'fuzzy');
  assert.equal(result?.entry.name, 'autino-front');
});

test('no match returns null', () => {
  const result = findBest('zzznotreal', entries, config);
  assert.equal(result, null);
});

test('rankAll returns exact tier entries before partial/fuzzy', () => {
  const ranked = rankAll('desktop-erp', entries, config);
  assert.ok(ranked.length > 0);
  assert.equal(ranked[0].tier, 'exact');
});
