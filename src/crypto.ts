import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { env } from './env';

/**
 * Key for what the instance stores encrypted, derived from its secret.
 * @remarks A separate purpose label keeps it from ever equalling the key that signs the
 * verification links. Rotating `STATE_SECRET` makes every stored token unreadable, which only
 * means each member links their roles again.
 */
const key = () => createHash('sha256').update(`${env.stateSecret}:stored-tokens`).digest();

/** Encrypts a short secret with AES-256-GCM: nonce, tag and ciphertext in one buffer. */
export function seal(plain: string): Buffer {
	const iv = randomBytes(12);
	const cipher = createCipheriv('aes-256-gcm', key(), iv);
	const body = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
	return Buffer.concat([iv, cipher.getAuthTag(), body]);
}

/**
 * Decrypts what `seal` produced.
 * @throws when the buffer was altered or sealed with another secret
 */
export function unseal(sealed: Buffer): string {
	const decipher = createDecipheriv('aes-256-gcm', key(), sealed.subarray(0, 12));
	decipher.setAuthTag(sealed.subarray(12, 28));
	return Buffer.concat([decipher.update(sealed.subarray(28)), decipher.final()]).toString('utf8');
}
