/**
 * @author dop42
 * @method required
 * @description Reads an environment variable that the bot cannot run without.
 * @param name {string}
 * @returns {string}
 * @throws {Error}
 */
function required(name: string): string {
	const value = process.env[name];
	if (!value) throw new Error(`Missing environment variable: ${name}`);
	return value;
}

/**
 * Credentials and deployment URLs.
 *
 * @remarks Read through getters so that importing a module never fails at build time —
 * only the code paths actually needing a variable complain when it is missing. Every getter
 * here can therefore throw; callers do not repeat that in their own `@throws`.
 */
export const env = {
	get discordAppId() {
		return required('DISCORD_APP_ID');
	},
	get discordPublicKey() {
		return required('DISCORD_PUBLIC_KEY');
	},
	get discordBotToken() {
		return required('DISCORD_BOT_TOKEN');
	},
	/** The one server this deployment serves. Commands are registered there only. */
	get guildId() {
		return required('GUILD_ID');
	},
	get ftClientId() {
		return required('FT_CLIENT_ID');
	},
	get ftClientSecret() {
		return required('FT_CLIENT_SECRET');
	},
	/** HMAC key for the `/auth` links. Rotating it invalidates every link already handed out. */
	get stateSecret() {
		const secret = required('STATE_SECRET');
		if (secret.length < 32) {
			throw new Error('STATE_SECRET must be at least 32 characters: openssl rand -hex 32');
		}
		return secret;
	},

	/** Public base URL of the deployment, without a trailing slash. */
	get publicUrl() {
		const explicit = process.env.PUBLIC_URL;
		if (explicit) return explicit.replace(/\/$/, '');
		const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
		if (vercel) return `https://${vercel}`;
		throw new Error('Missing environment variable: PUBLIC_URL');
	},

	/** URL registered as the redirect URI of the 42 OAuth application. */
	get redirectUri() {
		return `${this.publicUrl}/api/callback`;
	},
};
