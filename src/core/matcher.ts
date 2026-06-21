import Fuse from 'fuse.js';
import type { ConfigFile, FolderEntry, MatchResult } from '../types.js';

function baseDirRank(entry: FolderEntry, baseDirs: string[]): number {
  const idx = baseDirs.findIndex(
    (b) => b.toLowerCase() === entry.baseDir.toLowerCase()
  );
  return idx === -1 ? baseDirs.length : idx;
}

function findExact(query: string, entries: FolderEntry[], baseDirs: string[]): MatchResult[] {
  const q = query.toLowerCase();
  const matches = entries.filter((e) => e.name.toLowerCase() === q);
  matches.sort((a, b) => {
    const rankDiff = baseDirRank(a, baseDirs) - baseDirRank(b, baseDirs);
    if (rankDiff !== 0) return rankDiff;
    return a.path.length - b.path.length;
  });
  return matches.map((entry) => ({ entry, tier: 'exact', score: 0 }));
}

function findPartial(query: string, entries: FolderEntry[], baseDirs: string[]): MatchResult[] {
  const q = query.toLowerCase();
  const matches = entries.filter((e) => e.name.toLowerCase().includes(q));
  matches.sort((a, b) => {
    const aPrefix = a.name.toLowerCase().startsWith(q) ? 0 : 1;
    const bPrefix = b.name.toLowerCase().startsWith(q) ? 0 : 1;
    if (aPrefix !== bPrefix) return aPrefix - bPrefix;
    if (a.name.length !== b.name.length) return a.name.length - b.name.length;
    return baseDirRank(a, baseDirs) - baseDirRank(b, baseDirs);
  });
  return matches.map((entry, i) => ({ entry, tier: 'partial', score: i }));
}

function findFuzzy(query: string, entries: FolderEntry[], baseDirs: string[]): MatchResult[] {
  const fuse = new Fuse(entries, {
    keys: ['name'],
    threshold: 0.4,
    distance: 100,
    ignoreLocation: true,
    minMatchCharLength: 2,
    includeScore: true,
    isCaseSensitive: false,
  });
  const results = fuse.search(query);
  const withScore = results
    .filter((r) => r.score !== undefined && r.score <= 0.4)
    .map((r) => ({ entry: r.item, tier: 'fuzzy' as const, score: r.score ?? 1 }));

  withScore.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    return baseDirRank(a.entry, baseDirs) - baseDirRank(b.entry, baseDirs);
  });
  return withScore;
}

export function findBest(query: string, entries: FolderEntry[], config: ConfigFile): MatchResult | null {
  const exact = findExact(query, entries, config.baseDirs);
  if (exact.length > 0) return exact[0];

  const partial = findPartial(query, entries, config.baseDirs);
  if (partial.length > 0) return partial[0];

  const fuzzy = findFuzzy(query, entries, config.baseDirs);
  if (fuzzy.length > 0) return fuzzy[0];

  return null;
}

export function rankAll(query: string, entries: FolderEntry[], config: ConfigFile, limit = 15): MatchResult[] {
  if (!query) {
    return entries
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, limit)
      .map((entry) => ({ entry, tier: 'partial' as const, score: 0 }));
  }

  const exact = findExact(query, entries, config.baseDirs);
  const partial = findPartial(query, entries, config.baseDirs).filter(
    (p) => !exact.some((e) => e.entry.path === p.entry.path)
  );
  const fuzzy = findFuzzy(query, entries, config.baseDirs).filter(
    (f) => !exact.some((e) => e.entry.path === f.entry.path) && !partial.some((p) => p.entry.path === f.entry.path)
  );

  return [...exact, ...partial, ...fuzzy].slice(0, limit);
}
