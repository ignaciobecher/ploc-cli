import { search } from '@inquirer/prompts';
import { loadConfig } from '../core/config.js';
import { getEntries } from '../core/cache.js';
import { rankAll } from '../core/matcher.js';
import { printResult } from '../util/output.js';
export async function runSearch() {
    const config = loadConfig();
    const entries = getEntries(config);
    try {
        const selected = await search({
            message: 'ploc >',
            source: async (term) => {
                const ranked = rankAll(term ?? '', entries, config);
                return ranked.map((r) => ({
                    name: `${r.entry.name}  (${r.tier})`,
                    value: r.entry,
                }));
            },
        }, { output: process.stderr });
        printResult(selected.path);
    }
    catch (err) {
        if (err instanceof Error && err.name === 'ExitPromptError') {
            process.exit(1);
        }
        throw err;
    }
}
