import fs from 'node:fs';
import os from 'node:os';
import { input, number, confirm } from '@inquirer/prompts';
import { saveConfig } from '../core/config.js';
import { toAbsolute } from '../util/paths.js';
import { printInfo } from '../util/output.js';
async function promptOneDir(isFirst) {
    const message = isFirst
        ? 'Carpeta raíz a indexar (ej: C:\\Users\\tu-usuario\\Documents\\proyectos):'
        : 'Otra carpeta raíz (Enter para terminar):';
    const raw = await input({ message }, { output: process.stderr });
    const trimmed = raw.trim();
    if (!trimmed)
        return null;
    const absolute = toAbsolute(trimmed);
    if (!fs.existsSync(absolute) || !fs.statSync(absolute).isDirectory()) {
        printInfo(`"${absolute}" no existe o no es un directorio, se ignora.`);
        return null;
    }
    return absolute;
}
export async function runFirstTimeSetup() {
    process.stderr.write('\nNo encontré configuración previa. Vamos a armarla.\n\n');
    const baseDirs = [];
    let first = true;
    while (true) {
        const dir = await promptOneDir(first);
        first = false;
        if (!dir)
            break;
        if (!baseDirs.includes(dir))
            baseDirs.push(dir);
        const addAnother = await confirm({ message: '¿Agregar otra carpeta?', default: false }, { output: process.stderr });
        if (!addAnother)
            break;
    }
    if (baseDirs.length === 0) {
        const documents = os.homedir() + '/Documents';
        baseDirs.push(fs.existsSync(documents) ? documents : os.homedir());
        printInfo('no se ingresó ninguna carpeta, usando la carpeta de usuario por defecto.');
    }
    const scanDepth = await number({
        message: 'Profundidad de escaneo (niveles de subcarpetas a indexar):',
        default: 2,
        min: 0,
        max: 10,
    }, { output: process.stderr });
    const config = {
        version: 1,
        baseDirs,
        scanDepth: scanDepth ?? 2,
        cacheTtlMinutes: 5,
    };
    saveConfig(config);
    printInfo(`configuración guardada. Carpetas: ${baseDirs.join(', ')} (profundidad ${config.scanDepth}).`);
    return config;
}
