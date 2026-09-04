import { InteractionResponseType, MessageFlags } from './types';

/**
 * @author dop42
 * @method json
 * @description Wraps a value in the JSON response Discord expects from an interaction.
 * @param body {unknown}
 * @returns {Response}
 */
export function json(body: unknown): Response {
	return new Response(JSON.stringify(body), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
}

/**
 * @author dop42
 * @method ephemeral
 * @description Replies with plain text only the member who acted can see.
 * @param content {string}
 * @returns {Response}
 */
export function ephemeral(content: string): Response {
	return json({
		type: InteractionResponseType.CHANNEL_MESSAGE,
		data: { content, flags: MessageFlags.EPHEMERAL },
	});
}

/**
 * @author dop42
 * @method componentMessage
 * @description Replies with a Components V2 message.
 * @remarks `IS_COMPONENTS_V2` forbids `content` and `embeds`, so everything the member reads
 * lives inside the components themselves. Ephemeral is a separate flag on the same bitfield.
 * @param components {unknown[]}
 * @param isEphemeral {boolean | undefined}
 * @returns {Response}
 */
export function componentMessage(components: unknown[], isEphemeral?: boolean): Response {
	const flags = MessageFlags.IS_COMPONENTS_V2 | (isEphemeral ? MessageFlags.EPHEMERAL : 0);
	return json({ type: InteractionResponseType.CHANNEL_MESSAGE, data: { flags, components } });
}
