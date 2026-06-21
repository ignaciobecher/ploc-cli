import path from 'node:path';

export function normalizeForCompare(p: string): string {
  return path.resolve(p).toLowerCase();
}

export function toAbsolute(p: string): string {
  return path.resolve(p);
}
