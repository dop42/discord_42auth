import { createHmac, timingSafeEqual } from 'node:crypto';
import { SNOWFLAKE } from './discord/types';
import { env } from './env';

/** Short enough to keep the replay window small, long enough to log into the intra. */
const TTL_SECONDS = 5 * 60;

export interface AuthState {
	guildId: string;
	userId: string;
	/** Member's language, for the pages of the flow. */
	locale: string;
	/** Server's language, for the audit log addressed to its admins. */
	guildLocale: string;
	/** Unix timestamp (seconds) after which the state is refused. */
	exp: number;
}

/**
 * @author dop42
 * @method sign
 * @description Signs a state payload with the deployment secret.
 * @param payload {string}
 * @returns {string}
 */
function sign(payload: string): string {
	return createHmac('sha256', env.stateSecret).update(payload).digest('base64url');
}

/**
 * @author dop42
 * @method createState
 * @description Builds the signed state that ties a verification link to one Discord member.
 * @remarks The signature makes the link unforgeable and impossible to retarget at another
 * member. It says nothing about who is holding it: whoever completes the 42 login grants
 * the role to the member named in the state. A link is a credential, not an invitation.
 * @param member {Omit<AuthState, 'exp'>}
 * @returns {string}
 */
export function createState(member: Omit<AuthState, 'exp'>): string {
	const state: AuthState = { ...member, exp: Math.floor(Date.now() / 1000) + TTL_SECONDS };
	const payload = Buffer.from(JSON.stringify(state)).toString('base64url');
	return `${payload}.${sign(payload)}`;
}

/**
 * @author dop42
 * @method readState
 * @description Verifies a state and returns it, or null when it is forged, malformed or expired.
 * @remarks Exactly two dot-separated segments are accepted, so trailing junk cannot ride
 * along on an otherwise valid signature, and the length guard before `timingSafeEqual` is
 * load-bearing because that function throws on a mismatch. The shape is re-checked after the
 * signature so that a fork changing `createState` cannot turn a typo into a forged snowflake
 * reaching the Discord REST routes.
 * @param raw {string | null}
 * @returns {AuthState | null}
 */
export function readState(raw: string | null): AuthState | null {
	if (!raw) return null;
	const parts = raw.split('.');
	if (parts.length !== 2) return null;
	const [payload, signature] = parts;
	if (!payload || !signature) return null;

	const expected = Buffer.from(sign(payload));
	const given = Buffer.from(signature);
	if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

	const state = JSON.parse(Buffer.from(payload, 'base64url').toString()) as AuthState;
	const wellFormed =
		SNOWFLAKE.test(state.guildId) &&
		SNOWFLAKE.test(state.userId) &&
		typeof state.locale === 'string' &&
		typeof state.guildLocale === 'string' &&
		typeof state.exp === 'number';
	if (!wellFormed || state.exp < Math.floor(Date.now() / 1000)) return null;
	return state;
}
