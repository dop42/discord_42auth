import { handleAuth } from '../src/commands/auth';
import { handleConfig } from '../src/commands/config';
import { ephemeral, json } from '../src/discord/responses';
import { InteractionResponseType, InteractionType, type Interaction } from '../src/discord/types';
import { isValidRequest } from '../src/discord/verify';
import { env } from '../src/env';
import { resolveLocale, t } from '../src/i18n';

/** How far a signed request may be from our clock before we refuse it. */
const MAX_SKEW_SECONDS = 5 * 60;

/**
 * @author dop42
 * @method handler
 * @description Answers every Discord interaction, after proving the request came from Discord.
 * @remarks Registered as the Interactions Endpoint URL. A signature stays valid forever, so
 * freshness is the only thing bounding how long a captured request can be replayed. Neither command performs any
 * I/O, which is why Discord's three-second budget is never a concern.
 * @param request {Request}
 * @returns {Promise<Response>}
 */
export default async function handler(request: Request): Promise<Response> {
	const body = await request.text();
	const timestamp = request.headers.get('x-signature-timestamp');

	const valid = isValidRequest(
		body,
		request.headers.get('x-signature-ed25519'),
		timestamp,
		env.discordPublicKey,
	);
	if (!valid) return new Response('invalid request signature', { status: 401 });

	const age = Math.abs(Date.now() / 1000 - Number(timestamp));
	if (!Number.isFinite(age) || age > MAX_SKEW_SECONDS) {
		return new Response('stale request', { status: 401 });
	}

	const interaction = JSON.parse(body) as Interaction;

	if (interaction.type === InteractionType.PING) {
		return json({ type: InteractionResponseType.PONG });
	}

	const locale = resolveLocale(interaction.locale);

	// Commands are only registered on one guild, so this should be unreachable —
	// it is here so that inviting the bot elsewhere cannot grant anything.
	if (interaction.guild_id !== env.guildId) {
		return ephemeral(t(locale, 'error.wrongGuild'));
	}

	try {
		switch (interaction.data?.name) {
			case 'auth':
				return handleAuth(interaction);
			case 'config':
				return handleConfig(interaction);
			default:
				throw new Error(`unknown command: ${interaction.data?.name}`);
		}
	} catch (error) {
		console.error(error);
		return ephemeral(t(locale, 'error.unknown'));
	}
}
