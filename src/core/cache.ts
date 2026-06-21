import fs from 'node:fs';
import type { CacheFile, ConfigFile, FolderEntry } from '../types.js';
import { scanBaseDirs } from './scanner.js';
import { CACHE_PATH } from './config.js';

function sortedCopy(arr: string[]): string[] {
  return [...arr].map((s) => s.toLowerCase()).sort();
}

export function sameBaseDirs(a: string[], b: string[]): boolean {
  const sa = sortedCopy(a);
  const sb = sortedCopy(b);
  return sa.length === sb.length && sa.every((v, i) => v === sb[i]);
}

function readCache(): CacheFile | null {
  try {
    const raw = fs.readFileSync(CACHE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed && parsed.version === 1 && Array.isArray(parsed.entries)) {
      return parsed as CacheFile;
    }
    return null;
  } catch {
    return null;
  }
}

function writeCache(cache: CacheFile): void {
  const tmpPath = `${CACHE_PATH}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(cache), 'utf-8');
  fs.renameSync(tmpPath, CACHE_PATH);
}

export function isFresh(cache: CacheFile, config: ConfigFile): boolean {
  if (!sameBaseDirs(cache.baseDirs, config.baseDirs)) return false;
  const ttlMs = config.cacheTtlMinutes * 60_000;
  return Date.now() - cache.generatedAt <= ttlMs;
}

function rebuild(config: ConfigFile): FolderEntry[] {
  const entries = scanBaseDirs(config);
  const cache: CacheFile = {
    version: 1,
    generatedAt: Date.now(),
    baseDirs: config.baseDirs,
    entries,
  };
  writeCache(cache);
  return entries;
}

export function getEntries(config: ConfigFile, opts: { forceRefresh?: boolean } = {}): FolderEntry[] {
  if (!opts.forceRefresh) {
    const cache = readCache();
    if (cache && isFresh(cache, config)) {
      return cache.entries;
    }
  }
  return rebuild(config);
}
