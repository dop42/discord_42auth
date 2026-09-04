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
 * @description Replies with a message only the member who ran the command can see.
 * @param content {string}
 * @returns {Response}
 */
export function ephemeral(content: string): Response {
	return json({
		type: InteractionResponseType.CHANNEL_MESSAGE,
		data: { content, flags: MessageFlags.EPHEMERAL },
	});
}
