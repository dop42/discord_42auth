import { en } from './en';
import { fr } from './fr';
import { es } from './es';
import { de } from './de';
import { it } from './it';
import { nl } from './nl';
import { ptBR } from './pt-br';
import type { MessageKey, Messages } from './types';

export type { MessageKey };

/**
 * Every shipped bundle, keyed by Discord locale code.
 *
 * @remarks Also read by `scripts/check-locales.ts`, which is why it is exported.
 * Adding a language means copying `en.ts`, translating it, and adding it here.
 * @see https://discord.com/developers/docs/reference#locales
 */
export const bundles: Record<string, Messages> = {
	'en-US': en,
	fr,
	'es-ES': es,
	de,
	it,
	nl,
	'pt-BR': ptBR,
};

/** Bundle used when a locale is unknown; must be a key of `bundles`. */
export const FALLBACK = 'en-US';

/**
 * @author dop42
 * @method resolveLocale
 * @description Maps a Discord locale onto a bundle that is actually shipped.
 * @remarks Exact code first, then any bundle sharing its language
 * (`en-GB` to `en-US`, `es-419` to `es-ES`), then English.
 * @param raw {string | undefined}
 * @returns {string}
 */
export function resolveLocale(raw: string | undefined): string {
	if (!raw) return FALLBACK;
	if (Object.hasOwn(bundles, raw)) return raw;
	const language = raw.split('-')[0];
	return Object.keys(bundles).find((code) => code.split('-')[0] === language) ?? FALLBACK;
}

/**
 * @author dop42
 * @method t
 * @description Translates a key, replacing every `{placeholder}` with the given values.
 * @remarks Falls back to English for an unknown locale. A missing key cannot happen:
 * `Messages` makes one a compile error.
 * @param locale {string}
 * @param key {MessageKey}
 * @param params {Record<string, string | number> | undefined}
 * @returns {string}
 */
export function t(
	locale: string,
	key: MessageKey,
	params: Record<string, string | number> = {},
): string {
	const template = bundles[locale]?.[key] ?? en[key];
	return template.replace(/\{(\w+)\}/g, (match, name: string) =>
		name in params ? String(params[name]) : match,
	);
}

/**
 * @author dop42
 * @method localizations
 * @description Returns one key translated into every locale but the fallback.
 * @remarks Shaped for Discord's `description_localizations` field.
 * @param key {MessageKey}
 * @returns {Record<string, string>}
 */
export function localizations(key: MessageKey): Record<string, string> {
	return Object.fromEntries(
		Object.entries(bundles)
			.filter(([code]) => code !== FALLBACK)
			.map(([code, messages]) => [code, messages[key]]),
	);
}

/**
 * @author dop42
 * @method localeFromHeader
 * @description Picks a locale from the first language of an Accept-Language header, ignoring q-weights.
 * @remarks Used when no state tells us the member's language, which happens on an
 * expired or forged link.
 * @param acceptLanguage {string | null}
 * @returns {string}
 */
export function localeFromHeader(acceptLanguage: string | null): string {
	const first = acceptLanguage?.split(',')[0]?.split(';')[0]?.trim();
	return resolveLocale(first);
}
