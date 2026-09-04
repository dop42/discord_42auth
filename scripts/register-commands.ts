import 'dotenv/config';
import { commands } from '../src/commands/definitions';
import { env } from '../src/env';

/**
 * @author dop42
 * @method main
 * @description Publishes the slash commands on the one server this deployment serves.
 * @remarks Guild commands rather than global ones: they appear instantly instead of taking
 * up to an hour to propagate, and they exist only where the bot is meant to be used. Run
 * again whenever `src/commands/definitions.ts` or a `cmd.*` translation changes.
 * @returns {Promise<void>}
 * @throws {Error}
 */
async function main(): Promise<void> {
	const response = await fetch(
		`https://discord.com/api/v10/applications/${env.discordAppId}/guilds/${env.guildId}/commands`,
		{
			method: 'PUT',
			headers: {
				Authorization: `Bot ${env.discordBotToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(commands),
		},
	);

	if (!response.ok) {
		throw new Error(`Discord refused the commands (${response.status}): ${await response.text()}`);
	}
	console.log(`Registered ${commands.length} commands on guild ${env.guildId}.`);
}

main().catch((error) => {
	console.error(error.message);
	process.exit(1);
});
