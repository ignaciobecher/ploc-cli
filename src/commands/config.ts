import { loadConfig, addBaseDir, removeBaseDir, setScanDepth } from '../core/config.js';
import { printInfo, printError } from '../util/output.js';

export function runConfigList(): void {
  const config = loadConfig();
  for (const dir of config.baseDirs) {
    process.stdout.write(dir + '\n');
  }
}

export function runConfigAdd(rawPath: string): void {
  const absolute = addBaseDir(rawPath);
  printInfo(`added base dir: ${absolute}`);
}

export function runConfigRemove(rawPath: string): void {
  const changed = removeBaseDir(rawPath);
  if (!changed) {
    printError(`no configured base dir matches "${rawPath}".`);
  }
  printInfo(`removed base dir: ${rawPath}`);
}

export function runConfigSetDepth(depthArg: string): void {
  const depth = Number.parseInt(depthArg, 10);
  if (Number.isNaN(depth)) {
    printError(`"${depthArg}" is not a valid integer.`);
  }
  setScanDepth(depth);
  printInfo(`scan depth set to ${depth}`);
}
