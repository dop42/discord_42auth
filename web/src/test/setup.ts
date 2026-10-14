import { beforeEach, vi } from 'vitest';

// jsdom has no matchMedia; the theme store asks it for the system preference.
vi.stubGlobal(
	'matchMedia',
	vi.fn((query: string) => ({
		matches: false,
		media: query,
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
	})),
);

// The tests read French strings; jsdom's browser speaks English.
beforeEach(() => {
	localStorage.setItem('locale', 'fr');
});
