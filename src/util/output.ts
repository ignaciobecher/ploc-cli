export function printResult(absolutePath: string): never {
  process.stdout.write(absolutePath + '\n');
  process.exit(0);
}

export function printError(message: string): never {
  process.stderr.write(`ploc: ${message}\n`);
  process.exit(1);
}

export function printInfo(message: string): void {
  process.stderr.write(`ploc: ${message}\n`);
}
