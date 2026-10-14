import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, HttpError, initials, request } from './client';

const respond = (status: number, body?: unknown) =>
	vi.fn().mockResolvedValue(
		new Response(body === undefined ? null : JSON.stringify(body), {
			status,
			headers: { 'Content-Type': 'application/json' },
		}),
	);

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('request', () => {
	it('returns the parsed body on success', async () => {
		vi.stubGlobal('fetch', respond(200, { ok: 1 }));
		await expect(request('GET', '/api/x')).resolves.toEqual({ ok: 1 });
	});

	it('returns undefined on 204', async () => {
		vi.stubGlobal('fetch', respond(204));
		await expect(api.logout()).resolves.toBeUndefined();
	});

	it('flags a 401 as unauthenticated', async () => {
		vi.stubGlobal('fetch', respond(401, { error: 'unauthenticated' }));
		const error = await api.me().catch((e: unknown) => e);
		expect(error).toBeInstanceOf(HttpError);
		expect((error as HttpError).unauthenticated).toBe(true);
		expect((error as HttpError).body).toEqual({ error: 'unauthenticated' });
	});

	it('keeps the refused field of a 400', async () => {
		vi.stubGlobal('fetch', respond(400, { error: 'invalid', field: 'campus' }));
		const error = (await api
			.saveGuild('1', {
				roleId: null,
				campus: 'x',
				studentsOnly: true,
				nickname: 'login',
				logChannelId: null,
			})
			.catch((e: unknown) => e)) as HttpError;
		expect(error.status).toBe(400);
		expect(error.body?.field).toBe('campus');
	});

	it('tolerates a non-JSON error body', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('boom', { status: 502 })));
		const error = (await api.meta().catch((e: unknown) => e)) as HttpError;
		expect(error.status).toBe(502);
		expect(error.body).toBeNull();
	});

	it('sends JSON with a body and encodes the id', async () => {
		const fetchMock = respond(200, {});
		vi.stubGlobal('fetch', fetchMock);
		await api.saveGuild('a/b', {
			roleId: null,
			campus: null,
			studentsOnly: false,
			nickname: 'off',
			logChannelId: null,
		});
		const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
		expect(url).toBe('/api/guilds/a%2Fb');
		expect(init.method).toBe('PUT');
		expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
	});
});

describe('initials', () => {
	it('takes up to two initials', () => {
		expect(initials('42 Paris Students')).toBe('4P');
		expect(initials('   ')).toBe('?');
	});
});
