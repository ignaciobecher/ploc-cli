import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { input, number, confirm, checkbox } from '@inquirer/prompts';
import { saveConfig } from '../core/config.js';
import { toAbsolute } from '../util/paths.js';
import { printInfo } from '../util/output.js';
const CANDIDATE_NAMES = [
    'Documents',
    'Desktop',
    'Downloads',
    'Documentos',
    'Escritorio',
    'Descargas',
    'projects',
    'Projects',
    'proyectos',
    'Proyectos',
    'repos',
    'code',
    'dev',
    'workspace',
];
function detectCandidates() {
    const home = os.homedir();
    const found = [];
    for (const name of CANDIDATE_NAMES) {
        const candidate = path.join(home, name);
        if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
            found.push(candidate);
        }
    }
    // also look one level inside Documents/Desktop for a projects-like folder
    for (const parent of [path.join(home, 'Documents'), path.join(home, 'Desktop')]) {
        if (!fs.existsSync(parent))
            continue;
        let entries;
        try {
            entries = fs.readdirSync(parent, { withFileTypes: true });
        }
        catch {
            continue;
        }
        for (const entry of entries) {
            if (!entry.isDirectory())
                continue;
            if (/^(projects?|proyectos?|repos?|code|dev|workspace)$/i.test(entry.name)) {
                const full = path.join(parent, entry.name);
                if (!found.includes(full))
                    found.push(full);
            }
        }
    }
    return found;
}
async function promptManualDir(isFirst) {
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
async function promptDirs() {
    const candidates = detectCandidates();
    const baseDirs = [];
    if (candidates.length > 0) {
        const selected = await checkbox({
            message: 'Elegí las carpetas que querés indexar (espacio para marcar, enter para confirmar):',
            choices: candidates.map((c) => ({ name: c, value: c, checked: true })),
        }, { output: process.stderr });
        baseDirs.push(...selected);
        const addMore = await confirm({ message: '¿Agregar alguna otra carpeta manualmente?', default: false }, { output: process.stderr });
        if (!addMore)
            return baseDirs;
    }
    else {
        process.stderr.write('No encontré carpetas típicas (Documents, Desktop, proyectos...). Ingresá las tuyas:\n');
    }
    let first = baseDirs.length === 0;
    while (true) {
        const dir = await promptManualDir(first);
        first = false;
        if (!dir)
            break;
        if (!baseDirs.includes(dir))
            baseDirs.push(dir);
        const addAnother = await confirm({ message: '¿Agregar otra carpeta?', default: false }, { output: process.stderr });
        if (!addAnother)
            break;
    }
    return baseDirs;
}
export async function runFirstTimeSetup() {
    process.stderr.write('\nNo encontré configuración previa. Vamos a armarla.\n\n');
    const baseDirs = await promptDirs();
    if (baseDirs.length === 0) {
        const documents = os.homedir() + '/Documents';
        baseDirs.push(fs.existsSync(documents) ? documents : os.homedir());
        printInfo('no se eligió ninguna carpeta, usando la carpeta de usuario por defecto.');
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
