import { env } from '../env';

const DISCORD_API = 'https://discord.com/api/v10';

/**
 * @author dop42
 * @method request
 * @description Calls the Discord REST API with the bot token.
 * @param method {string}
 * @param path {string}
 * @param body {unknown | undefined}
 * @returns {Promise<Response>}
 * @throws {TypeError}
 */
async function request(method: string, path: string, body?: unknown): Promise<Response> {
	return fetch(`${DISCORD_API}${path}`, {
		method,
		headers: {
			Authorization: `Bot ${env.discordBotToken}`,
			'Content-Type': 'application/json',
		},
		body: body === undefined ? undefined : JSON.stringify(body),
	});
}

/**
 * @author dop42
 * @method addRole
 * @description Grants the verified role to a member.
 * @remarks Fails when the bot role sits below the granted role, which is the most common
 * setup mistake; the error text says so because it surfaces in the deployment logs.
 * @param guildId {string}
 * @param userId {string}
 * @param roleId {string}
 * @returns {Promise<void>}
 * @throws {Error}
 */
export async function addRole(guildId: string, userId: string, roleId: string): Promise<void> {
	const response = await request('PUT', `/guilds/${guildId}/members/${userId}/roles/${roleId}`);
	if (!response.ok) {
		throw new Error(
			`Could not grant the role (${response.status}). Check the bot permissions and role order.`,
		);
	}
}

/**
 * @author dop42
 * @method setNickname
 * @description Renames a member to their intra identity.
 * @remarks Best-effort, and deliberately never throws: the role is what grants access, and
 * it has already been given by the time this runs. A rejection here would tell the member
 * the authentication failed and skip the audit line, which is worse than a wrong nickname.
 * @param guildId {string}
 * @param userId {string}
 * @param nick {string}
 * @returns {Promise<void>}
 */
export async function setNickname(guildId: string, userId: string, nick: string): Promise<void> {
	const response = await request('PATCH', `/guilds/${guildId}/members/${userId}`, {
		nick,
	}).catch(() => null);
	if (!response?.ok) {
		console.error(`Could not rename ${userId} in ${guildId}: ${response?.status ?? 'network'}`);
	}
}

/**
 * @author dop42
 * @method postMessage
 * @description Posts a message in the audit log channel.
 * @remarks Never throws: losing a log line must not fail an authentication that succeeded.
 * The failure is reported to the deployment logs instead.
 * @param channelId {string}
 * @param body {unknown}
 * @returns {Promise<void>}
 */
export async function postMessage(channelId: string, body: unknown): Promise<void> {
	const response = await request('POST', `/channels/${channelId}/messages`, body).catch(() => null);
	if (!response?.ok) {
		console.error(`Could not write to log channel ${channelId}: ${response?.status ?? 'network'}`);
	}
}
