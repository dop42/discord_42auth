/** Reads an environment variable that the bot cannot run without. */
function required(name: string): string {
	const value = process.env[name]?.trim();
	if (!value) throw new Error(`Missing environment variable: ${name}`);
	return value;
}

/** Reads a random secret, refusing one too short to be one. */
function secret(name: string): string {
	const value = required(name);
	if (value.length < 32) {
		throw new Error(`${name} must be at least 32 characters: openssl rand -hex 32`);
	}
	return value;
}

/**
 * Credentials, deployment URLs and the operator's identity.
 *
 * @remarks Read through getters so that importing a module never fails — only the code paths
 * actually needing a variable complain when it is missing. Every getter here can therefore
 * throw; callers do not repeat that in their own `@throws`. What each Discord server does is
 * not here any more: it lives in the database and is edited from the dashboard.
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
	/** OAuth2 secret of the same Discord application, for the dashboard login. */
	get discordClientSecret() {
		return required('DISCORD_CLIENT_SECRET');
	},
	get ftClientId() {
		return required('FT_CLIENT_ID');
	},
	get ftClientSecret() {
		return required('FT_CLIENT_SECRET');
	},
	/** HMAC key for the verification links. Rotating it invalidates every link already handed out. */
	get stateSecret() {
		return secret('STATE_SECRET');
	},
	/** `postgres://user:password@host:5432/db`. */
	get databaseUrl() {
		return required('DATABASE_URL');
	},

	/** Public base URL of the instance, without a trailing slash. */
	get publicUrl() {
		return required('PUBLIC_URL').replace(/\/$/, '');
	},
	/** Address the HTTP server binds: loopback by default, so only the reverse proxy on the
	 * same machine reaches it. Docker sets `0.0.0.0`, the published port being loopback. */
	get host() {
		return process.env.HOST?.trim() || '127.0.0.1';
	},
	/** Port the HTTP server listens on, behind the reverse proxy. */
	get port() {
		return Number(process.env.PORT ?? 3000);
	},

	/** Redirect URI of the 42 OAuth application. */
	get ftRedirectUri() {
		return `${this.publicUrl}/api/callback`;
	},
	/** Redirect URI of the Discord OAuth2 dashboard login. */
	get discordRedirectUri() {
		return `${this.publicUrl}/auth/callback`;
	},

	/** Who runs the instance and answers data-protection requests; shown on /privacy. */
	get operatorName() {
		return required('OPERATOR_NAME');
	},
	get operatorContact() {
		return required('OPERATOR_CONTACT');
	},
	get hosting() {
		return required('HOSTING_LOCATION');
	},
};
