import chalk from 'chalk';

const P = ['█████ ', '█   █ ', '█████ ', '█     ', '█     '];
const L = ['█     ', '█     ', '█     ', '█     ', '█████ '];
const O = [' ████ ', '█    █', '█    █', '█    █', ' ████ '];
const C = [' ████ ', '█    █', '█     ', '█    █', ' ████ '];
const LETTERS = [P, L, O, C];

export function renderBanner(): string {
  const rows: string[] = [];
  for (let r = 0; r < 5; r++) {
    rows.push(LETTERS.map((letter) => letter[r]).join(' '));
  }
  const art = rows.map((row) => chalk.magentaBright(row)).join('\n');
  const tagline = chalk.gray('resuelve el nombre de una carpeta a su ruta absoluta');
  return `\n${art}\n${tagline}\n`;
}
