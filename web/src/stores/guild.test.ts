import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sampleDetail } from '@/test/fixtures';
import { useGuildStore } from './guild';

const json = (status: number, body?: unknown) =>
	new Response(body === undefined ? null : JSON.stringify(body), { status });

beforeEach(() => {
	setActivePinia(createPinia());
});
afterEach(() => {
	vi.unstubAllGlobals();
});

describe('guild store', () => {
	it('is clean after hydrate and dirty after an edit', () => {
		const store = useGuildStore();
		store.hydrate(sampleDetail());
		expect(store.dirty).toBe(false);
		if (store.draft) store.draft.campus = 'Paris';
		expect(store.dirty).toBe(true);
		if (store.draft) store.draft.campus = null;
		expect(store.dirty).toBe(false);
	});

	it('becomes clean again once saved, and trims the campus', async () => {
		const store = useGuildStore();
		store.hydrate(sampleDetail());
		if (store.draft) store.draft.campus = '  Paris ';
		const fetchMock = vi.fn((_url: string, init: RequestInit) =>
			Promise.resolve(json(200, JSON.parse(init.body as string))),
		);
		vi.stubGlobal('fetch', fetchMock);
		await store.save();
		expect(JSON.parse(fetchMock.mock.calls[0]?.[1].body as string)).toMatchObject({
			campus: 'Paris',
		});
		expect(store.saveState).toBe('saved');
		expect(store.dirty).toBe(false);
	});

	it('records the refused field on 400', async () => {
		const store = useGuildStore();
		store.hydrate(sampleDetail());
		if (store.draft) store.draft.logChannelId = '300000000000000009';
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(json(400, { error: 'invalid', field: 'logChannelId' })),
		);
		await store.save();
		expect(store.saveState).toBe('invalid');
		expect(store.invalidField).toBe('logChannelId');
		expect(store.dirty).toBe(true);
	});

	it('calls the unauthenticated handler on 401', async () => {
		const store = useGuildStore();
		const handler = vi.fn();
		store.setUnauthenticatedHandler(handler);
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json(401, { error: 'unauthenticated' })));
		await store.load('1');
		expect(handler).toHaveBeenCalledOnce();
	});

	it('maps 403 and 404 to load states', async () => {
		const store = useGuildStore();
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json(403, { error: 'forbidden' })));
		await store.load('1');
		expect(store.loadState).toBe('forbidden');
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json(404, { error: 'not_found' })));
		await store.load('1');
		expect(store.loadState).toBe('notFound');
	});

	it('keeps edits typed while a save is in flight', async () => {
		const store = useGuildStore();
		store.hydrate(sampleDetail());
		if (store.draft) store.draft.campus = 'Paris';
		let answer: (response: Response) => void = () => undefined;
		vi.stubGlobal(
			'fetch',
			vi.fn(() => new Promise<Response>((resolve) => (answer = resolve))),
		);
		const saving = store.save();
		if (store.draft) store.draft.campus = 'Lyon';
		answer(json(200, { ...sampleDetail().settings, campus: 'Paris' }));
		await saving;
		expect(store.detail?.settings.campus).toBe('Paris');
		expect(store.draft?.campus).toBe('Lyon');
		expect(store.dirty).toBe(true);
	});

	it('drops the reply of a server the user already left', async () => {
		const store = useGuildStore();
		const answers: Array<(response: Response) => void> = [];
		vi.stubGlobal(
			'fetch',
			vi.fn(() => new Promise<Response>((resolve) => answers.push(resolve))),
		);
		const first = store.load('1');
		const second = store.load('2');
		const other = { ...sampleDetail(), guild: { id: '2', name: 'B', icon: null } };
		answers[1]?.(json(200, other));
		await second;
		answers[0]?.(json(200, sampleDetail()));
		await first;
		expect(store.detail?.guild.id).toBe('2');
	});

	it('forgets the settings of an erased server', async () => {
		const store = useGuildStore();
		store.hydrate(sampleDetail());
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json(204)));
		expect(await store.erase()).toBe(true);
		expect(store.detail).toBeNull();
		expect(store.draft).toBeNull();
	});
});
