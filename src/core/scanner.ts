import fs from 'node:fs';
import path from 'node:path';
import type { ConfigFile, FolderEntry } from '../types.js';

function scanDir(baseDir: string, currentDir: string, depthRemaining: number, results: FolderEntry[]): void {
  let dirents: fs.Dirent[];
  try {
    dirents = fs.readdirSync(currentDir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const dirent of dirents) {
    if (!dirent.isDirectory() || dirent.isSymbolicLink()) continue;
    const fullPath = path.join(currentDir, dirent.name);
    results.push({ name: dirent.name, path: fullPath, baseDir });
    if (depthRemaining > 0) {
      scanDir(baseDir, fullPath, depthRemaining - 1, results);
    }
  }
}

export function scanBaseDirs(config: ConfigFile): FolderEntry[] {
  const results: FolderEntry[] = [];
  for (const baseDir of config.baseDirs) {
    if (!fs.existsSync(baseDir)) continue;
    scanDir(baseDir, baseDir, Math.max(0, config.scanDepth - 1), results);
  }
  return results;
}
