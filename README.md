# ploc

```
█████  █       ████   ████ 
█   █  █      █    █ █    █
█████  █      █    █ █     
█      █      █    █ █    █
█      █████   ████   ████ 
```

Resuelve el nombre de una carpeta de proyecto a su ruta absoluta. Pensado
para `cd $(ploc <nombre>)`.

`ploc` nunca cambia de directorio por sí mismo — solo resuelve e imprime
una ruta. Combinalo con la sustitución de comandos de tu shell para hacer
el `cd` real.

## Instalación

La opción de menor fricción hoy es instalar directo desde GitHub — no
requiere cuenta de npm ni publicar nada, solo tener Node.js:

```bash
npm install -g github:ignaciobecher/ploc-cli
```

Eso deja el comando `ploc` disponible globalmente en tu PATH.

### Alternativa: clonar y enlazar

Útil si querés modificar el código localmente:

```bash
git clone https://github.com/ignaciobecher/ploc-cli.git
cd ploc-cli
npm install
npm run build
npm link        # deja `ploc` disponible globalmente
```

### A futuro: registro de npm

Cuando se publique, instalar será tan simple como:

```bash
npm install -g ploc
```

(Todavía no está publicado — ver [Cómo contribuir](#cómo-contribuir) si
querés ayudar a llegar a ese punto.)

## Requisitos

- Node.js >= 18

## Guía paso a paso

1. **Instalá** con alguno de los métodos de arriba. Confirmá que funcionó:

   ```bash
   ploc --version
   ```

2. **Primera ejecución** — corré cualquier comando de `ploc` (por ejemplo
   `ploc` solo, o `ploc mi-proyecto`). Como todavía no existe
   `~/.plocrc.json`, se abre automáticamente un asistente de configuración
   interactivo:

   ```bash
   ploc
   ```

   Te va a pedir, una por una, las carpetas raíz donde tenés tus
   proyectos (podés agregar varias — Documents, Desktop, una carpeta de
   repos separada, un disco distinto, etc) y la profundidad de escaneo
   (cuántos niveles de subcarpetas indexar bajo cada una). Con eso guarda
   `~/.plocrc.json` y continúa con el comando que pediste.

   Este asistente solo se dispara una vez (mientras no exista el archivo
   de config). `ploc --help` y `ploc --version` nunca lo disparan.

3. **¿Querés agregar más carpetas después?**

   ```bash
   ploc config add "C:\Users\tu-usuario\Documents\code"
   ```

   Corré `config add` de nuevo por cada directorio adicional que quieras
   indexar.

4. **Resolvé el nombre de una carpeta**:

   ```bash
   ploc mi-proyecto              # imprime la ruta absoluta en stdout
   ```

5. **Hacé `cd` de verdad** usando la sustitución de comandos de tu shell:

   ```powershell
   cd (ploc mi-proyecto)         # PowerShell
   ```

   ```bash
   cd $(ploc mi-proyecto)        # bash / WSL
   ```

6. **¿No te acordás el nombre exacto?** Corré `ploc` sin argumentos y
   elegí "Buscar una carpeta" en el menú para una búsqueda interactiva, o
   escribí el nombre con errores de tipeo — el matching difuso lo resuelve
   igual:

   ```bash
   ploc                           # abre el menú interactivo
   ploc mi-proyect                # el matching difuso resuelve a mi-proyecto
   ```

7. **¿Una carpeta se movió o cambió de nombre y `ploc` no la encuentra?**
   Forzá un rescaneo:

   ```bash
   ploc --refresh mi-proyecto    # rescanea y luego resuelve
   ploc refresh                  # solo rescanea
   ```

## El menú interactivo

Correr `ploc` sin argumentos muestra el banner y abre un menú con estas
opciones:

- **Buscar una carpeta** — búsqueda interactiva en vivo con matching
  difuso; al confirmar imprime la ruta absoluta en stdout y sale.
- **Ver comandos disponibles** — lista rápida de todos los comandos del
  CLI, sin tener que recordar `--help`.
- **Ver directorios configurados** — muestra los `baseDirs` actuales de
  `~/.plocrc.json`.
- **Abrir repo de GitHub** — abre el repositorio del proyecto en tu
  navegador.
- **Desinstalar ploc** — pide confirmación y, si aceptás, corre
  `npm uninstall -g ploc` por vos.
- **Salir** — cierra el menú sin imprimir nada (exit code 0).

Todo el menú y sus prompts se renderizan en stderr, así que nunca
contaminan la ruta que se imprime en stdout — `cd $(ploc)` funciona igual
que `cd $(ploc mi-proyecto)`.

`Ctrl+C`/`Esc` en cualquier punto cancela con exit code 1 y sin imprimir
nada en stdout.

## Referencia de uso

```bash
ploc mi-proyecto              # imprime la ruta absoluta en stdout

cd (ploc mi-proyecto)         # PowerShell
cd $(ploc mi-proyecto)        # bash / WSL

ploc                          # abre el menú interactivo
ploc mi-proyect                # el matching difuso resuelve igual

ploc --refresh mi-proyecto    # fuerza un rescaneo antes de resolver
ploc refresh                  # solo fuerza un rescaneo

ploc config list
ploc config add <ruta>
ploc config remove <ruta>
ploc config set-depth <n>
```

## Cómo funciona el matching

1. Gana directo el match **exacto** por nombre.
2. Si no, gana el match **parcial**/substring (los prefijos rankean por
   encima de coincidencias en medio de la palabra).
3. Si no, match **difuso** (tolera errores de tipeo) vía Fuse.js, umbral
   `0.4`.

Los empates dentro de un mismo nivel se resuelven por el orden en que se
agregaron los directorios base en la configuración, y luego por longitud
de ruta.

## Cache

El listado de carpetas se cachea en `~/.ploc-cache.json` por 5 minutos
(configurable). El cache también se invalida automáticamente cada vez que
corrés `ploc config add/remove/set-depth`. Usá `--refresh` o
`ploc refresh` para forzar un rescaneo inmediato.

## Configuración

`~/.plocrc.json` guarda:

```json
{
  "version": 1,
  "baseDirs": ["C:\\Users\\tu-usuario\\Documents\\code"],
  "scanDepth": 1,
  "cacheTtlMinutes": 5
}
```

- `baseDirs` — uno o más directorios a escanear (Documents, Desktop,
  Projects, etc), en orden de prioridad para desempates.
- `scanDepth` — cuántos niveles de profundidad escanear bajo cada
  directorio base (por defecto `1` = solo subcarpetas directas).
- `cacheTtlMinutes` — cuánto tiempo se mantiene válido el cache antes de
  un rescaneo automático.

### ¿Cómo hago que `ploc` "busque en todo"?

No existe una opción de "indexar todo el disco" — es intencional, porque
escanear sin límites terminaría indexando `node_modules`, `.git`,
`AppData`, etc., lo cual sería lento y ruidoso. En cambio, `ploc` combina
**directorios base explícitos** + **profundidad acotada**:

- Agregá cada carpeta raíz que te interese como base dir:
  ```bash
  ploc config add "C:\Users\tu-usuario\Documents\programacion"
  ploc config add "D:\otros-proyectos"
  ```
- Si tenés proyectos anidados varios niveles (por ejemplo
  `programacion/clientes/empresa-x/proyecto`), subí la profundidad:
  ```bash
  ploc config set-depth 3
  ```

Con un puñado de carpetas raíz bien elegidas y un `scanDepth` de 2-3 ya
cubrís prácticamente cualquier estructura de proyectos sin indexar
basura.

## Desarrollo

```bash
npm install
npm run dev -- mi-proyecto    # corre desde el código fuente con tsx, sin build
npm test                       # corre los tests unitarios (matcher, cache, config)
npm run build                  # compila TypeScript a dist/
```

> **Importante**: `dist/` está commiteado al repo (no es un build artifact
> ignorado). Esto es necesario porque `npm install -g github:...` no
> instala `devDependencies` (incluido `typescript`), así que no hay forma
> de compilar en la máquina de quien instala — el código compilado tiene
> que venir ya listo en el repo. **Si modificás algo en `src/`, corré
> `npm run build` y commiteá el `dist/` actualizado junto con el cambio.**

Estructura del proyecto:

```
src/
  cli.ts              punto de entrada, configuración de Commander
  commands/           un archivo por subcomando (resolve, refresh, config, menu, interactive)
  core/                escaneo, cache, lectura/escritura de config, lógica de matching
  util/                helpers compartidos (output, paths, banner)
tests/                 tests unitarios (node --test + tsx)
```

## Cómo contribuir

Issues y pull requests son bienvenidos.

- Corré `npm test` antes de enviar un PR.
- Mantené los cambios acotados — esta es una herramienta chica y de
  propósito único.
- Si proponés una nueva regla de matching o una opción de configuración,
  abrí un issue primero para discutir el enfoque.

## Licencia

MIT
