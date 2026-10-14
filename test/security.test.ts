import assert from 'node:assert/strict';
import { createHmac, generateKeyPairSync, sign } from 'node:crypto';
import { test } from 'node:test';
import { isValidRequest } from '../src/discord/verify';
import { handleInteraction } from '../src/routes/interactions';
import { createState, readState } from '../src/state';

const SECRET = 'x'.repeat(32);
process.env.STATE_SECRET = SECRET;

const { publicKey, privateKey } = generateKeyPairSync('ed25519');
/** The raw 32-byte key, hex-encoded, as the Discord portal shows it. */
const PUBLIC_KEY = publicKey.export({ format: 'der', type: 'spki' }).subarray(-32).toString('hex');
process.env.DISCORD_PUBLIC_KEY = PUBLIC_KEY;

const signed = (timestamp: string, body: string) =>
	sign(null, Buffer.from(timestamp + body), privateKey).toString('hex');

const now = () => String(Math.floor(Date.now() / 1000));

const interaction = (body: string, timestamp: string, signature: string | null) =>
	new Request('http://localhost/api/interactions', {
		method: 'POST',
		headers: {
			'x-signature-timestamp': timestamp,
			...(signature === null ? {} : { 'x-signature-ed25519': signature }),
		},
		body,
	});

const member = { guildId: '100000000000000001', userId: '100000000000000002', locale: 'fr', guildLocale: 'fr' };

test('a request signed with the Discord key is accepted', () => {
	const timestamp = now();
	assert.equal(isValidRequest('{"type":1}', signed(timestamp, '{"type":1}'), timestamp, PUBLIC_KEY), true);
});

test('a forged, altered or unsigned request is refused without throwing', () => {
	const timestamp = now();
	const signature = signed(timestamp, '{"type":1}');
	assert.equal(isValidRequest('{"type":2}', signature, timestamp, PUBLIC_KEY), false);
	assert.equal(isValidRequest('{"type":1}', signature, String(Number(timestamp) + 1), PUBLIC_KEY), false);
	assert.equal(isValidRequest('{"type":1}', 'zz', timestamp, PUBLIC_KEY), false);
	assert.equal(isValidRequest('{"type":1}', null, timestamp, PUBLIC_KEY), false);
	assert.equal(isValidRequest('{"type":1}', signature, null, PUBLIC_KEY), false);
	assert.equal(isValidRequest('{"type":1}', signature, timestamp, 'not-a-key'), false);
});

test('the interactions endpoint answers a signed PING and refuses a bad signature', async () => {
	const body = '{"type":1}';
	const timestamp = now();
	const ok = await handleInteraction(interaction(body, timestamp, signed(timestamp, body)));
	assert.equal(ok.status, 200);
	assert.deepEqual(await ok.json(), { type: 1 });

	const forged = await handleInteraction(interaction(body, timestamp, signed(timestamp, '{"type":2}')));
	assert.equal(forged.status, 401);
	const unsigned = await handleInteraction(interaction(body, timestamp, null));
	assert.equal(unsigned.status, 401);
});

test('a correctly signed but stale interaction is refused', async () => {
	const body = '{"type":1}';
	const old = String(Math.floor(Date.now() / 1000) - 10 * 60);
	const response = await handleInteraction(interaction(body, old, signed(old, body)));
	assert.equal(response.status, 401);
});

test('a verification state round-trips for the member it names', () => {
	const state = readState(createState(member));
	assert.ok(state);
	assert.equal(state.userId, member.userId);
	assert.equal(state.guildId, member.guildId);
});

test('a state with an altered payload or signature is refused', () => {
	const [payload, signature] = createState(member).split('.') as [string, string];
	const other = Buffer.from(
		JSON.stringify({ ...member, userId: '100000000000000003', exp: Math.floor(Date.now() / 1000) + 60 }),
	).toString('base64url');
	assert.equal(readState(`${other}.${signature}`), null);
	assert.equal(readState(`${payload}.${signature.slice(0, -2)}AA`), null);
	assert.equal(readState(`${payload}.${signature}.extra`), null);
	assert.equal(readState(payload), null);
	assert.equal(readState(''), null);
	assert.equal(readState(null), null);
});

test('an expired state is refused', (t) => {
	const raw = createState(member);
	const issued = Date.now();
	t.mock.method(Date, 'now', () => issued + 6 * 60 * 1000);
	assert.equal(readState(raw), null);
});

test('a state signed with the secret but carrying a malformed id is refused', () => {
	const payload = Buffer.from(
		JSON.stringify({ ...member, userId: '../../users/@me', exp: Math.floor(Date.now() / 1000) + 60 }),
	).toString('base64url');
	const signature = createHmac('sha256', SECRET).update(payload).digest('base64url');
	assert.equal(readState(`${payload}.${signature}`), null);
});
