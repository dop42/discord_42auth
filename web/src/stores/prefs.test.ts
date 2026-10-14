import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { usePrefsStore } from './prefs';

beforeEach(() => {
	setActivePinia(createPinia());
	delete document.documentElement.dataset.theme;
});

describe('prefs', () => {
	it('switches language, remembers it and sets <html lang>', () => {
		const prefs = usePrefsStore();
		expect(prefs.t['settings.save']).toBe('Enregistrer');
		prefs.setLocale('en');
		expect(prefs.t['settings.save']).toBe('Save');
		expect(document.documentElement.lang).toBe('en');
		expect(localStorage.getItem('locale')).toBe('en');
	});

	it('falls back to English for a browser that does not speak French', () => {
		localStorage.removeItem('locale');
		expect(usePrefsStore().locale).toBe('en');
	});

	it('toggles the theme on <html> and remembers it', () => {
		const prefs = usePrefsStore();
		expect(prefs.theme).toBe('light');
		prefs.toggleTheme();
		expect(document.documentElement.dataset.theme).toBe('dark');
		expect(localStorage.getItem('theme')).toBe('dark');
		prefs.toggleTheme();
		localStorage.removeItem('theme');
	});
});
