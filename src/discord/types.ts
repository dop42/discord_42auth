/** Discord ids are 17-20 digit snowflakes; they end up in REST paths. */
export const SNOWFLAKE = /^\d{17,20}$/;

export const InteractionType = { PING: 1, APPLICATION_COMMAND: 2, MESSAGE_COMPONENT: 3 } as const;
export const InteractionResponseType = { PONG: 1, CHANNEL_MESSAGE: 4 } as const;

export const MessageFlags = {
	EPHEMERAL: 1 << 6,
	/** Opts a message into Components V2: `content` and `embeds` become forbidden. */
	IS_COMPONENTS_V2: 1 << 15,
} as const;

/** Component types used by the audit log and the verification panel. */
export const ComponentType = {
	ACTION_ROW: 1,
	BUTTON: 2,
	TEXT_DISPLAY: 10,
	SEPARATOR: 14,
	CONTAINER: 17,
} as const;

/** Button styles this bot uses: a click that comes back to us, and a plain link out. */
export const ButtonStyle = { PRIMARY: 1, LINK: 5 } as const;

/** Permission bits this bot checks or requires. */
export const Permissions = {
	ADMINISTRATOR: 1n << 3n,
	MANAGE_GUILD: 1n << 5n,
	VIEW_CHANNEL: 1n << 10n,
	SEND_MESSAGES: 1n << 11n,
	MANAGE_NICKNAMES: 1n << 27n,
	MANAGE_ROLES: 1n << 28n,
} as const;

/** Channel types the audit log can be posted in: text and announcement. */
export const TEXT_CHANNEL_TYPES = new Set([0, 5]);

export interface Interaction {
	type: number;
	guild_id?: string;
	member?: {
		user: { id: string };
		/** Server nickname, null when the member has none. */
		nick?: string | null;
		/** Permissions in the invoking channel, as a decimal string of `Permissions` bits. */
		permissions: string;
	};
	data?: {
		/** Present on a command interaction. */
		name?: string;
		/** Present on a component interaction; identifies which button was pressed. */
		custom_id?: string;
	};
	/** Language of the member running the command. */
	locale?: string;
	/** Language of the server, used for messages addressed to its admins. */
	guild_locale?: string;
}
