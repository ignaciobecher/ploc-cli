import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { ConfigFile } from '../types.js';
import { normalizeForCompare, toAbsolute } from '../util/paths.js';
import { printInfo, printError } from '../util/output.js';

const CONFIG_PATH = path.join(os.homedir(), '.plocrc.json');
export const CACHE_PATH = path.join(os.homedir(), '.ploc-cache.json');

function defaultConfig(): ConfigFile {
  const documents = path.join(os.homedir(), 'Documents');
  const baseDir = fs.existsSync(documents) ? documents : os.homedir();
  return {
    version: 1,
    baseDirs: [baseDir],
    scanDepth: 1,
    cacheTtlMinutes: 5,
  };
}

export function isValidConfig(value: unknown): value is ConfigFile {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    v.version === 1 &&
    Array.isArray(v.baseDirs) &&
    v.baseDirs.every((b) => typeof b === 'string') &&
    typeof v.scanDepth === 'number' &&
    typeof v.cacheTtlMinutes === 'number'
  );
}

export function loadConfig(): ConfigFile {
  if (!fs.existsSync(CONFIG_PATH)) {
    const config = defaultConfig();
    saveConfig(config);
    printInfo(
      `no config found, created ${CONFIG_PATH} with default base dir ${config.baseDirs[0]}. Run "ploc config add <path>" to add more.`
    );
    return config;
  }

  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!isValidConfig(parsed)) {
      throw new Error('invalid config shape');
    }
    return parsed;
  } catch {
    const config = defaultConfig();
    saveConfig(config);
    printInfo(`config file at ${CONFIG_PATH} was invalid, reset to defaults.`);
    return config;
  }
}

export function saveConfig(config: ConfigFile): void {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

function invalidateCache(): void {
  try {
    fs.unlinkSync(CACHE_PATH);
  } catch {
    // no cache file to remove, nothing to do
  }
}

export function addBaseDir(rawPath: string): string {
  const absolute = toAbsolute(rawPath);
  if (!fs.existsSync(absolute) || !fs.statSync(absolute).isDirectory()) {
    printError(`"${absolute}" does not exist or is not a directory.`);
  }
  const config = loadConfig();
  const already = config.baseDirs.some(
    (b) => normalizeForCompare(b) === normalizeForCompare(absolute)
  );
  if (!already) {
    config.baseDirs.push(absolute);
    saveConfig(config);
    invalidateCache();
  }
  return absolute;
}

export function removeBaseDir(rawPath: string): boolean {
  const config = loadConfig();
  const before = config.baseDirs.length;
  const exactTarget = normalizeForCompare(toAbsolute(rawPath));

  let filtered = config.baseDirs.filter((b) => normalizeForCompare(b) !== exactTarget);
  if (filtered.length === before) {
    // fall back to matching by basename for convenience (e.g. "Programacion" instead of full path)
    const basenameTarget = path.basename(rawPath).toLowerCase();
    filtered = config.baseDirs.filter((b) => path.basename(b).toLowerCase() !== basenameTarget);
  }

  const changed = filtered.length !== before;
  if (changed) {
    config.baseDirs = filtered;
    saveConfig(config);
    invalidateCache();
  }
  return changed;
}

export function setScanDepth(depth: number): void {
  if (!Number.isInteger(depth) || depth < 0) {
    printError('scan depth must be a non-negative integer.');
  }
  const config = loadConfig();
  config.scanDepth = depth;
  saveConfig(config);
  invalidateCache();
}

export { CONFIG_PATH };
