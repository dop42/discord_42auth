import { InteractionResponseType, MessageFlags } from './types';

/** Wraps a value in the JSON response Discord expects from an interaction. */
export function json(body: unknown): Response {
	return new Response(JSON.stringify(body), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
}

/** Replies with plain text only the member who acted can see. */
export function ephemeral(content: string): Response {
	return json({
		type: InteractionResponseType.CHANNEL_MESSAGE,
		data: { content, flags: MessageFlags.EPHEMERAL },
	});
}

/**
 * Replies with a Components V2 message.
 * @remarks `IS_COMPONENTS_V2` forbids `content` and `embeds`, so everything the member reads
 * lives inside the components themselves. Ephemeral is a separate flag on the same bitfield.
 */
export function componentMessage(components: unknown[], isEphemeral?: boolean): Response {
	const flags = MessageFlags.IS_COMPONENTS_V2 | (isEphemeral ? MessageFlags.EPHEMERAL : 0);
	return json({ type: InteractionResponseType.CHANNEL_MESSAGE, data: { flags, components } });
}

/**
 * Acknowledges an interaction now and answers it later with `editReply`.
 * @remarks For a command that waits on the 42 API, whose rate limit can hold a call longer
 * than Discord's three-second budget.
 */
export function deferred(isEphemeral?: boolean): Response {
	return json({
		type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE,
		data: { flags: isEphemeral ? MessageFlags.EPHEMERAL : 0 },
	});
}
