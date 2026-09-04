import { bundles, FALLBACK } from '../src/i18n';
import { en } from '../src/i18n/en';
import type { MessageKey } from '../src/i18n/types';

const DISCORD_DESCRIPTION_MAX = 100;

/**
 * @author dop42
 * @method placeholders
 * @description Lists the sorted `{placeholder}` names a message uses.
 * @param text {string}
 * @returns {Array<string | undefined>}
 */
const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

/**
 * @author dop42
 * @method main
 * @description Guards the locale bundles against the two mistakes TypeScript cannot catch.
 * @remarks A `cmd.*` translation longer than Discord's 100 characters would fail
 * `npm run register` with an opaque error, and a renamed `{placeholder}` would silently
 * show braces to users. Nothing else in the repo catches either.
 * @returns {void}
 */
function main(): void {
	const problems: string[] = [];

	for (const [locale, messages] of Object.entries(bundles)) {
		for (const key of Object.keys(en) as MessageKey[]) {
			const text = messages[key];

			if (key.startsWith('cmd.') && text.length > DISCORD_DESCRIPTION_MAX) {
				problems.push(
					`${locale} ${key}: ${text.length} characters, Discord allows ${DISCORD_DESCRIPTION_MAX}`,
				);
			}

			const expected = placeholders(en[key]).join(',');
			const actual = placeholders(text).join(',');
			if (expected !== actual) {
				problems.push(`${locale} ${key}: placeholders are {${actual}}, expected {${expected}}`);
			}
		}
	}

	if (problems.length) {
		console.error(problems.join('\n'));
		process.exit(1);
	}
	console.log(`${Object.keys(bundles).length} locales OK (fallback: ${FALLBACK}).`);
}

main();
