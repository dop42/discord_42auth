import { handleAuth } from '../commands/auth';
import { handleConfig } from '../commands/config';
import { AUTH_BUTTON } from '../commands/definitions';
import { handleForget } from '../commands/forget';
import { handlePanel } from '../commands/panel';
import { ephemeral, json } from '../discord/responses';
import { InteractionResponseType, InteractionType, type Interaction } from '../discord/types';
import { isValidRequest } from '../discord/verify';
import { env } from '../env';
import { resolveLocale, t } from '../i18n';

/** How far a signed request may be from our clock before we refuse it. */
const MAX_SKEW_SECONDS = 5 * 60;

/**
 * Answers every Discord interaction, after proving the request came from Discord.
 * @remarks Registered as the Interactions Endpoint URL. Routes the slash commands and the
 * verification panel's button, which is the only way a member starts an authentication. A
 * signature stays valid forever, so freshness is the only thing bounding how long a captured
 * request can be replayed. Every server is served from the same endpoint now; what one does
 * is read from the database by its id, so an interaction outside a server is refused.
 */
export async function handleInteraction(request: Request): Promise<Response> {
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

	if (!interaction.guild_id) return ephemeral(t(locale, 'error.notInGuild'));

	try {
		if (interaction.type === InteractionType.MESSAGE_COMPONENT) {
			if (interaction.data?.custom_id !== AUTH_BUTTON) {
				throw new Error(`unknown component: ${interaction.data?.custom_id}`);
			}
			return await handleAuth(interaction);
		}

		switch (interaction.data?.name) {
			case 'config':
				return await handleConfig(interaction);
			case 'panel':
				return handlePanel(interaction);
			case 'forget':
				return await handleForget(interaction);
			default:
				throw new Error(`unknown command: ${interaction.data?.name}`);
		}
	} catch (error) {
		console.error(error);
		return ephemeral(t(locale, 'error.unknown'));
	}
}
