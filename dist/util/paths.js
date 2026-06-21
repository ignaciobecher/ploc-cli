import path from 'node:path';
export function normalizeForCompare(p) {
    return path.resolve(p).toLowerCase();
}
export function toAbsolute(p) {
    return path.resolve(p);
}
