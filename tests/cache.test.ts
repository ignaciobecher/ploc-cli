import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sameBaseDirs, isFresh } from '../src/core/cache.ts';
import type { CacheFile, ConfigFile } from '../src/types.ts';

test('sameBaseDirs ignores order and case', () => {
  assert.equal(sameBaseDirs(['C:\\A', 'C:\\B'], ['c:\\b', 'c:\\a']), true);
  assert.equal(sameBaseDirs(['C:\\A'], ['C:\\A', 'C:\\B']), false);
});

test('isFresh is true within TTL and matching base dirs', () => {
  const config: ConfigFile = { version: 1, baseDirs: ['C:\\A'], scanDepth: 1, cacheTtlMinutes: 5 };
  const cache: CacheFile = { version: 1, generatedAt: Date.now(), baseDirs: ['C:\\A'], entries: [] };
  assert.equal(isFresh(cache, config), true);
});

test('isFresh is false when TTL expired', () => {
  const config: ConfigFile = { version: 1, baseDirs: ['C:\\A'], scanDepth: 1, cacheTtlMinutes: 5 };
  const cache: CacheFile = {
    version: 1,
    generatedAt: Date.now() - 10 * 60_000,
    baseDirs: ['C:\\A'],
    entries: [],
  };
  assert.equal(isFresh(cache, config), false);
});

test('isFresh is false when base dirs differ even within TTL', () => {
  const config: ConfigFile = { version: 1, baseDirs: ['C:\\A', 'C:\\B'], scanDepth: 1, cacheTtlMinutes: 5 };
  const cache: CacheFile = { version: 1, generatedAt: Date.now(), baseDirs: ['C:\\A'], entries: [] };
  assert.equal(isFresh(cache, config), false);
});
