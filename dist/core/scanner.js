import fs from 'node:fs';
import path from 'node:path';
function scanDir(baseDir, currentDir, depthRemaining, results) {
    let dirents;
    try {
        dirents = fs.readdirSync(currentDir, { withFileTypes: true });
    }
    catch {
        return;
    }
    for (const dirent of dirents) {
        if (!dirent.isDirectory() || dirent.isSymbolicLink())
            continue;
        const fullPath = path.join(currentDir, dirent.name);
        results.push({ name: dirent.name, path: fullPath, baseDir });
        if (depthRemaining > 0) {
            scanDir(baseDir, fullPath, depthRemaining - 1, results);
        }
    }
}
export function scanBaseDirs(config) {
    const results = [];
    for (const baseDir of config.baseDirs) {
        if (!fs.existsSync(baseDir))
            continue;
        scanDir(baseDir, baseDir, Math.max(0, config.scanDepth - 1), results);
    }
    return results;
}
