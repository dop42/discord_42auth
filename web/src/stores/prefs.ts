import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { en } from '@/i18n/en';
import { fr, type Messages } from '@/i18n/fr';

export const LOCALES = ['fr', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export type Theme = 'light' | 'dark';

const bundles: Record<Locale, Messages> = { fr, en };

/** Reads a remembered choice; storage can be blocked, which only means nothing is remembered. */
function recall(key: string): string | null {
	try {
		return localStorage.getItem(key);
	} catch {
		return null;
	}
}

function remember(key: string, value: string): void {
	try {
		localStorage.setItem(key, value);
	} catch {
		// Blocked storage: the choice lasts for this page only.
	}
}

/** French for a French-speaking browser, English for everyone else, unless a choice was made. */
function initialLocale(): Locale {
	const saved = recall('locale');
	if (saved === 'fr' || saved === 'en') return saved;
	return navigator.languages.some((tag) => tag.toLowerCase().startsWith('fr')) ? 'fr' : 'en';
}

/** The theme in effect: the one chosen, or what the system asks for (see `public/theme.js`). */
function initialTheme(): Theme {
	const saved = recall('theme');
	if (saved === 'light' || saved === 'dark') return saved;
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Per-viewer display choices: language and theme. Remembered in this browser only. */
export const usePrefsStore = defineStore('prefs', () => {
	const locale = ref<Locale>(initialLocale());
	const theme = ref<Theme>(initialTheme());
	const t = computed(() => bundles[locale.value]);

	document.documentElement.lang = locale.value;

	function setLocale(value: Locale): void {
		locale.value = value;
		document.documentElement.lang = value;
		remember('locale', value);
	}

	function toggleTheme(): void {
		theme.value = theme.value === 'dark' ? 'light' : 'dark';
		document.documentElement.dataset.theme = theme.value;
		remember('theme', theme.value);
	}

	return { locale, theme, t, setLocale, toggleTheme };
});
