#!/usr/bin/env node
import { Command } from 'commander';
import { runResolve } from './commands/resolve.js';
import { runRefresh } from './commands/refresh.js';
import { runInteractive } from './commands/interactive.js';
import { runConfigList, runConfigAdd, runConfigRemove, runConfigSetDepth } from './commands/config.js';
import { printError } from './util/output.js';

const program = new Command();

program
  .name('ploc')
  .description('Resolve a project folder name to its absolute path.')
  .version('1.0.0')
  .argument('[query]', 'folder name to resolve')
  .option('--refresh', 'force a cache rebuild before resolving')
  .action(async (query: string | undefined, opts: { refresh?: boolean }) => {
    try {
      if (query) {
        runResolve(query, opts);
      } else {
        await runInteractive();
      }
    } catch (err) {
      printError(err instanceof Error ? err.message : String(err));
    }
  });

program
  .command('refresh')
  .description('force a cache rebuild')
  .action(() => {
    try {
      runRefresh();
    } catch (err) {
      printError(err instanceof Error ? err.message : String(err));
    }
  });

const config = program.command('config').description('manage configured base directories');

config
  .command('list')
  .description('list configured base directories')
  .action(() => {
    try {
      runConfigList();
    } catch (err) {
      printError(err instanceof Error ? err.message : String(err));
    }
  });

config
  .command('add <path>')
  .description('add a base directory')
  .action((path: string) => {
    try {
      runConfigAdd(path);
    } catch (err) {
      printError(err instanceof Error ? err.message : String(err));
    }
  });

config
  .command('remove <path>')
  .description('remove a base directory')
  .action((path: string) => {
    try {
      runConfigRemove(path);
    } catch (err) {
      printError(err instanceof Error ? err.message : String(err));
    }
  });

config
  .command('set-depth <n>')
  .description('set scan depth')
  .action((n: string) => {
    try {
      runConfigSetDepth(n);
    } catch (err) {
      printError(err instanceof Error ? err.message : String(err));
    }
  });

program.parseAsync(process.argv);
