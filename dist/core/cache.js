import fs from 'node:fs';
import { scanBaseDirs } from './scanner.js';
import { CACHE_PATH } from './config.js';
function sortedCopy(arr) {
    return [...arr].map((s) => s.toLowerCase()).sort();
}
export function sameBaseDirs(a, b) {
    const sa = sortedCopy(a);
    const sb = sortedCopy(b);
    return sa.length === sb.length && sa.every((v, i) => v === sb[i]);
}
function readCache() {
    try {
        const raw = fs.readFileSync(CACHE_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && parsed.version === 1 && Array.isArray(parsed.entries)) {
            return parsed;
        }
        return null;
    }
    catch {
        return null;
    }
}
function writeCache(cache) {
    const tmpPath = `${CACHE_PATH}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(cache), 'utf-8');
    fs.renameSync(tmpPath, CACHE_PATH);
}
export function isFresh(cache, config) {
    if (!sameBaseDirs(cache.baseDirs, config.baseDirs))
        return false;
    const ttlMs = config.cacheTtlMinutes * 60_000;
    return Date.now() - cache.generatedAt <= ttlMs;
}
function rebuild(config) {
    const entries = scanBaseDirs(config);
    const cache = {
        version: 1,
        generatedAt: Date.now(),
        baseDirs: config.baseDirs,
        entries,
    };
    writeCache(cache);
    return entries;
}
export function getEntries(config, opts = {}) {
    if (!opts.forceRefresh) {
        const cache = readCache();
        if (cache && isFresh(cache, config)) {
            return cache.entries;
        }
    }
    return rebuild(config);
}
