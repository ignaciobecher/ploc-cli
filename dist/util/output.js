export function printResult(absolutePath) {
    process.stdout.write(absolutePath + '\n');
    process.exit(0);
}
export function printError(message) {
    process.stderr.write(`ploc: ${message}\n`);
    process.exit(1);
}
export function printInfo(message) {
    process.stderr.write(`ploc: ${message}\n`);
}
