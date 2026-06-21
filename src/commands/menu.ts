import { select, confirm } from '@inquirer/prompts';
import { spawn } from 'node:child_process';
import { renderBanner } from '../util/banner.js';
import { runSearch } from './interactive.js';
import { runConfigList } from './config.js';
import { printInfo, printError } from '../util/output.js';

const REPO_URL = 'https://github.com/ignaciobecher/ploc-cli';

type MenuAction = 'search' | 'commands' | 'config' | 'repo' | 'uninstall' | 'exit';

function openInBrowser(url: string): void {
  const opener =
    process.platform === 'win32' ? 'cmd' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  const args =
    process.platform === 'win32' ? ['/c', 'start', '""', url] : [url];
  spawn(opener, args, { stdio: 'ignore', detached: true }).unref();
}

function printCommands(): void {
  const lines = [
    '',
    'Comandos disponibles:',
    '  ploc <nombre>            resuelve <nombre> a una ruta absoluta',
    '  ploc                     abre este menú interactivo',
    '  ploc --refresh <nombre>  fuerza un rescaneo antes de resolver',
    '  ploc refresh             fuerza un rescaneo',
    '  ploc config list         lista los directorios base configurados',
    '  ploc config add <ruta>   agrega un directorio base',
    '  ploc config remove <ruta> elimina un directorio base',
    '  ploc config set-depth <n> define la profundidad de escaneo',
    '  ploc --help              ayuda completa de Commander',
    '',
  ];
  process.stderr.write(lines.join('\n') + '\n');
}

async function confirmUninstall(): Promise<void> {
  const ok = await confirm(
    { message: '¿Desinstalar ploc globalmente? Esto corre "npm uninstall -g ploc".', default: false },
    { output: process.stderr }
  );
  if (!ok) {
    printInfo('desinstalación cancelada.');
    return;
  }
  await new Promise<void>((resolve) => {
    const child = spawn('npm', ['uninstall', '-g', 'ploc'], { stdio: 'inherit', shell: true });
    child.on('close', (code) => {
      if (code === 0) {
        printInfo('ploc fue desinstalado.');
      } else {
        printError(`npm uninstall -g ploc terminó con código ${code}.`);
      }
      resolve();
    });
  });
}

export async function runMenu(): Promise<void> {
  process.stderr.write(renderBanner());

  while (true) {
    let action: MenuAction;
    try {
      action = await select<MenuAction>(
        {
          message: '¿Qué querés hacer?',
          choices: [
            { name: 'Buscar una carpeta', value: 'search' },
            { name: 'Ver comandos disponibles', value: 'commands' },
            { name: 'Ver directorios configurados', value: 'config' },
            { name: 'Abrir repo de GitHub', value: 'repo' },
            { name: 'Desinstalar ploc', value: 'uninstall' },
            { name: 'Salir', value: 'exit' },
          ],
        },
        { output: process.stderr }
      );
    } catch (err) {
      if (err instanceof Error && err.name === 'ExitPromptError') {
        process.exit(1);
      }
      throw err;
    }

    switch (action) {
      case 'search':
        await runSearch();
        return;
      case 'commands':
        printCommands();
        break;
      case 'config':
        process.stderr.write('\n');
        runConfigList();
        process.stderr.write('\n');
        break;
      case 'repo':
        openInBrowser(REPO_URL);
        printInfo(`abriendo ${REPO_URL}`);
        break;
      case 'uninstall':
        await confirmUninstall();
        return;
      case 'exit':
        process.exit(0);
    }
  }
}
