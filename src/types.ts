export interface FolderEntry {
  name: string;
  path: string;
  baseDir: string;
}

export interface CacheFile {
  version: 1;
  generatedAt: number;
  baseDirs: string[];
  entries: FolderEntry[];
}

export interface ConfigFile {
  version: 1;
  baseDirs: string[];
  scanDepth: number;
  cacheTtlMinutes: number;
}

export type MatchTier = 'exact' | 'partial' | 'fuzzy';

export interface MatchResult {
  entry: FolderEntry;
  tier: MatchTier;
  score: number;
}
