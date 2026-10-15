/** Discord ids are 17-20 digit snowflakes; they end up in REST paths. */
export const SNOWFLAKE = /^\d{17,20}$/;

export const InteractionType = { PING: 1, APPLICATION_COMMAND: 2, MESSAGE_COMPONENT: 3 } as const;
export const InteractionResponseType = {
	PONG: 1,
	CHANNEL_MESSAGE: 4,
	/** "Thinking…" now, the message later through `editReply`; buys 15 minutes instead of 3 s. */
	DEFERRED_CHANNEL_MESSAGE: 5,
} as const;

/** Option types this bot's commands declare. */
export const OptionType = { STRING: 3, INTEGER: 4, BOOLEAN: 5, USER: 6 } as const;

export const MessageFlags = {
	EPHEMERAL: 1 << 6,
	/** Opts a message into Components V2: `content` and `embeds` become forbidden. */
	IS_COMPONENTS_V2: 1 << 15,
} as const;

/** Component types used by the audit log, the verification panel and `/profile`. */
export const ComponentType = {
	ACTION_ROW: 1,
	BUTTON: 2,
	/** Text with an accessory beside it, here the intra picture. */
	SECTION: 9,
	TEXT_DISPLAY: 10,
	THUMBNAIL: 11,
	SEPARATOR: 14,
	CONTAINER: 17,
} as const;

/** Button styles this bot uses: a click that comes back to us, and a plain link out. */
export const ButtonStyle = { PRIMARY: 1, LINK: 5 } as const;

/** Permission bits this bot checks or requires. */
export const Permissions = {
	/** Renames the voice channel of the campus counter. */
	MANAGE_CHANNELS: 1n << 4n,
	ADMINISTRATOR: 1n << 3n,
	MANAGE_GUILD: 1n << 5n,
	VIEW_CHANNEL: 1n << 10n,
	SEND_MESSAGES: 1n << 11n,
	MANAGE_NICKNAMES: 1n << 27n,
	MANAGE_ROLES: 1n << 28n,
	/** Creates, updates and removes the Discord events mirroring the campus ones. */
	MANAGE_EVENTS: 1n << 33n,
} as const;

/** Channel types the audit log can be posted in: text and announcement. */
export const TEXT_CHANNEL_TYPES = new Set([0, 5]);

/** Channel type the campus counter is shown on: a voice channel, whose name everyone sees. */
export const VOICE_CHANNEL_TYPE = 2;

export interface Interaction {
	type: number;
	/** Lets the reply be edited later, for 15 minutes; as secret as a password meanwhile. */
	token: string;
	guild_id?: string;
	member?: {
		user: { id: string };
		/** Ids of the roles the member holds. */
		roles: string[];
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
		/** Options the member filled in; a user option's value is their id. */
		options?: Array<{ name: string; type: number; value: string | number | boolean }>;
	};
	/** Language of the member running the command. */
	locale?: string;
	/** Language of the server, used for messages addressed to its admins. */
	guild_locale?: string;
}

/** Returns the value of one option of a command, or undefined when it was left empty. */
export function optionValue(
	interaction: Interaction,
	name: string,
): string | number | boolean | undefined {
	return interaction.data?.options?.find((option) => option.name === name)?.value;
}
