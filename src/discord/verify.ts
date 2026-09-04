import { createPublicKey, verify } from 'node:crypto';

/** DER prefix turning a raw 32-byte Ed25519 key into an SPKI key. */
const SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');

/**
 * @author dop42
 * @method isValidRequest
 * @description Verifies that a request really was signed by Discord.
 * @remarks Any request failing this must be answered with a 401, otherwise anyone could
 * impersonate Discord and drive the bot. Fails closed: a missing header, a malformed
 * signature or an unusable public key all return false rather than throwing.
 * @param rawBody {string}
 * @param signature {string | null}
 * @param timestamp {string | null}
 * @param publicKey {string}
 * @returns {boolean}
 */
export function isValidRequest(
	rawBody: string,
	signature: string | null,
	timestamp: string | null,
	publicKey: string,
): boolean {
	if (!signature || !timestamp) return false;
	try {
		const key = createPublicKey({
			key: Buffer.concat([SPKI_PREFIX, Buffer.from(publicKey, 'hex')]),
			format: 'der',
			type: 'spki',
		});
		return verify(null, Buffer.from(timestamp + rawBody), key, Buffer.from(signature, 'hex'));
	} catch {
		return false;
	}
}
