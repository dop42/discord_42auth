import type { MemberPage } from '@shared/api';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useMembersStore } from './members';

const page = (n: number, total: number, members = 1): MemberPage => ({
	members: Array.from({ length: members }, (_, i) => ({
		userId: `10000000000000000${String(i)}`,
		ftLogin: `login${String(i)}`,
		verifiedAt: '2026-10-01T00:00:00.000Z',
	})),
	total,
	page: n,
	pageSize: 50,
});

const reply = (status: number, body?: unknown) =>
	new Response(body === undefined ? null : JSON.stringify(body), { status });

beforeEach(() => {
	setActivePinia(createPinia());
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('members store', () => {
	it('sends the search and the page, and counts the pages', async () => {
		const fetchMock = vi.fn().mockResolvedValue(reply(200, page(0, 120)));
		vi.stubGlobal('fetch', fetchMock);
		const store = useMembersStore();
		await store.load('1', ' jd ', 0);
		expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/guilds/1/members?q=jd&page=0');
		expect(store.pages).toBe(3);
	});

	it('goes back a page when the last member of a page is unlinked', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(reply(200, page(2, 101)))
			.mockResolvedValueOnce(reply(204))
			.mockResolvedValueOnce(reply(200, page(1, 100, 50)));
		vi.stubGlobal('fetch', fetchMock);
		const store = useMembersStore();
		await store.load('1', '', 2);
		expect(await store.unlink('100000000000000000')).toBe(true);
		expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({ method: 'DELETE' });
		expect(fetchMock.mock.calls[2]?.[0]).toBe('/api/guilds/1/members?q=&page=1');
		expect(store.page).toBe(1);
	});

	it('reports a 429 as rate limited', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply(429, { error: 'rate_limited' })));
		const store = useMembersStore();
		await store.load('1', '', 0);
		expect(store.loadState).toBe('rateLimited');
	});
});
