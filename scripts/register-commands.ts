import 'dotenv/config';
import { commands } from '../src/commands/definitions';
import { env } from '../src/env';
import { ROLE_METADATA } from '../src/linkedRoles';

/** Replaces a whole command list on Discord. */
async function put(path: string, body: unknown[]): Promise<void> {
	const response = await fetch(`https://discord.com/api/v10/applications/${env.discordAppId}${path}`, {
		method: 'PUT',
		headers: {
			Authorization: `Bot ${env.discordBotToken}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(body),
	});
	if (!response.ok) {
		throw new Error(`Discord refused the commands (${response.status}): ${await response.text()}`);
	}
}

/**
 * Publishes the slash commands globally, for every server the bot joins.
 * @remarks Global commands can take a few minutes to show up in a client. `GUILD_ID`, when
 * still set from the single-server era, names the server whose old guild commands are
 * cleared, so they do not show twice next to the global ones. The Linked Roles fields go up
 * with them. Run again whenever `src/commands/definitions.ts`, a `cmd.*` translation or
 * `ROLE_METADATA` changes.
 */
async function main(): Promise<void> {
	await put('/commands', commands);
	console.log(`Registered ${commands.length} global commands.`);
	await put('/role-connections/metadata', ROLE_METADATA);
	console.log(`Registered ${ROLE_METADATA.length} Linked Roles fields.`);

	const legacy = process.env.GUILD_ID?.trim();
	if (legacy) {
		await put(`/guilds/${legacy}/commands`, []);
		console.log(`Cleared the old guild commands of ${legacy}.`);
	}
}

main().catch((error) => {
	console.error(error.message);
	process.exit(1);
});
