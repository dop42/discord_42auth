/** Discord ids are 17-20 digit snowflakes; they end up in REST paths. */
export const SNOWFLAKE = /^\d{17,20}$/;

export const InteractionType = { PING: 1 } as const;
export const InteractionResponseType = { PONG: 1, CHANNEL_MESSAGE: 4 } as const;

export const MessageFlags = {
	EPHEMERAL: 1 << 6,
	/** Opts a message into Components V2: `content` and `embeds` become forbidden. */
	IS_COMPONENTS_V2: 1 << 15,
} as const;

/** Components V2 types used by the audit log. */
export const ComponentType = {
	TEXT_DISPLAY: 10,
	SEPARATOR: 14,
	CONTAINER: 17,
} as const;

/** Permission bits this bot checks or requires. */
export const Permissions = { ADMINISTRATOR: 1n << 3n, MANAGE_GUILD: 1n << 5n } as const;

export interface Interaction {
	type: number;
	guild_id?: string;
	member?: {
		user: { id: string };
		/** Permissions in the invoking channel, as a decimal string of `Permissions` bits. */
		permissions: string;
	};
	data?: { name: string };
	/** Language of the member running the command. */
	locale?: string;
	/** Language of the server, used for messages addressed to its admins. */
	guild_locale?: string;
}
