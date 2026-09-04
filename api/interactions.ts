import { handleAuth } from '../src/commands/auth';
import { handleConfig } from '../src/commands/config';
import { AUTH_BUTTON } from '../src/commands/definitions';
import { handlePanel } from '../src/commands/panel';
import { ephemeral, json } from '../src/discord/responses';
import { InteractionResponseType, InteractionType, type Interaction } from '../src/discord/types';
import { isValidRequest } from '../src/discord/verify';
import { env } from '../src/env';
import { resolveLocale, t } from '../src/i18n';
import { toNodeHandler } from '../src/vercel';

/** How far a signed request may be from our clock before we refuse it. */
const MAX_SKEW_SECONDS = 5 * 60;

/**
 * @author dop42
 * @method handle
 * @description Answers every Discord interaction, after proving the request came from Discord.
 * @remarks Registered as the Interactions Endpoint URL. Routes both slash commands and the
 * verification panel's button, which land on the same handler because their payloads carry
 * the same fields. A signature stays valid forever, so
 * freshness is the only thing bounding how long a captured request can be replayed. The
 * guild check should be unreachable, since commands are registered on one guild only; it is
 * there so that inviting the bot elsewhere cannot grant anything. Neither command performs
 * any I/O, which is why Discord's three-second budget is never a concern.
 * @param request {Request}
 * @returns {Promise<Response>}
 */
export async function handle(request: Request): Promise<Response> {
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

	if (interaction.guild_id !== env.guildId) {
		return ephemeral(t(locale, 'error.wrongGuild'));
	}

	try {
		if (interaction.type === InteractionType.MESSAGE_COMPONENT) {
			if (interaction.data?.custom_id !== AUTH_BUTTON) {
				throw new Error(`unknown component: ${interaction.data?.custom_id}`);
			}
			return handleAuth(interaction);
		}

		switch (interaction.data?.name) {
			case 'auth':
				return handleAuth(interaction);
			case 'config':
				return handleConfig(interaction);
			case 'panel':
				return handlePanel(interaction);
			default:
				throw new Error(`unknown command: ${interaction.data?.name}`);
		}
	} catch (error) {
		console.error(error);
		return ephemeral(t(locale, 'error.unknown'));
	}
}

export default toNodeHandler(handle);
