/**
 * JSON contract between the server (`src/dashboard`) and the dashboard (`web/`).
 *
 * @remarks Types only, imported by both sides, so a field renamed on one side is a compile
 * error on the other. Every route below lives under the same origin as the dashboard and
 * authenticates with the `__Host-session` cookie; a mutating request must also carry an
 * `Origin` header equal to the public URL, which browsers do on their own for `fetch`.
 * Too many requests from one address answer 429 with a `Retry-After`.
 */

export const NICKNAME_MODES = ['off', 'login', 'full'] as const;

/** `off` leaves the nickname alone, `login` sets the intra login, `full` sets "Full Name (login)". */
export type NicknameMode = (typeof NICKNAME_MODES)[number];

export const RULE_KINDS = ['campus', 'cursus', 'coalition'] as const;

/**
 * What a role rule looks at: the primary campus, a cursus the member is currently in
 * (`42cursus`, `c-piscine`…), or one of their coalitions. Compared case-insensitively with
 * the name or the slug the intra uses.
 */
export type RuleKind = (typeof RULE_KINDS)[number];

/** An extra role granted on top of the verified one, to members matching the condition. */
export interface RoleRule {
	kind: RuleKind;
	value: string;
	roleId: string;
}

/** Most rules a server may have. */
export const MAX_ROLE_RULES = 25;

/** What one Discord server does. Ids are snowflakes as strings; `null` means unset. */
export interface GuildSettings {
	/** Role granted once the 42 account is verified. Without it verification is disabled. */
	roleId: string | null;
	/** Campus name as on the intra, compared case-insensitively. `null` accepts any. */
	campus: string | null;
	/** Refuse alumni. Closed accounts are refused regardless of this. */
	studentsOnly: boolean;
	nickname: NicknameMode;
	/** Channel receiving one audit message per attempt. `null` disables the audit log. */
	logChannelId: string | null;
	/** Extra roles by campus, cursus or coalition, checked again every week. */
	roleRules: RoleRule[];
}

/** `GET /api/meta` — public, no session needed. */
export interface Meta {
	/** Who runs this instance and answers data-protection requests. */
	operator: { name: string; contact: string };
	/** Where the data is hosted, as free text, e.g. "France (self-hosted)". */
	hosting: string;
	/** Add-the-bot URL, without a preselected server. */
	inviteUrl: string;
}

/** A server listed on the home page. Only servers the viewer can manage are listed. */
export interface GuildSummary {
	id: string;
	name: string;
	/** Discord icon hash; `https://cdn.discordapp.com/icons/{id}/{icon}.webp`. */
	icon: string | null;
	/** False when the bot is not in the server yet; `inviteUrl` then adds it there. */
	botPresent: boolean;
	inviteUrl: string;
}

/** `GET /api/me` — 204 with no body without a session. Other routes answer 401 then. */
export interface Me {
	user: { id: string; username: string; avatar: string | null };
	guilds: GuildSummary[];
}

export interface RoleOption {
	id: string;
	name: string;
	/** Discord colour as an integer, 0 meaning none. */
	color: number;
	/** False when the role sits above the bot's highest role, or is managed by an integration. */
	assignable: boolean;
}

export interface ChannelOption {
	id: string;
	name: string;
}

/** `GET /api/guilds/:id` — 403 when the viewer cannot manage it, 404 when the bot is not in it. */
export interface GuildDetail {
	guild: { id: string; name: string; icon: string | null };
	settings: GuildSettings;
	/** Roles the dashboard may offer, highest first, without `@everyone`. */
	roles: RoleOption[];
	/** Text and announcement channels, in Discord order. */
	channels: ChannelOption[];
	/** Members currently linked to a 42 account in this server. */
	verifiedCount: number;
}

/** One verified member, as the members tab lists them. */
export interface LinkedMember {
	userId: string;
	ftLogin: string;
	/** ISO date of the verification. */
	verifiedAt: string;
}

/** `GET /api/guilds/:id/members?q=&page=` — 50 per page, newest first, `q` filters on the login. */
export interface MemberPage {
	members: LinkedMember[];
	total: number;
	page: number;
	pageSize: number;
}

/** `POST /api/guilds/:id/panel` — posts the verification panel in that channel, answers 204. */
export interface PanelRequest {
	channelId: string;
}

/**
 * `PUT /api/guilds/:id` takes a full `GuildSettings` and answers the saved `GuildSettings`.
 * `DELETE /api/guilds/:id` erases the settings and every link of that server, answers 204.
 * `DELETE /api/guilds/:id/members/:userId` unlinks one member and takes their roles back,
 * answers 204. A panel the bot cannot post answers 502 `{ error: 'cannot_post' }`.
 * `POST /auth/logout` ends the session, answers 204.
 * `GET /auth/login` starts the Discord login; `GET /auth/callback` ends it on `/`.
 */
export interface ApiError {
	/** Stable machine-readable code, e.g. `unauthenticated`, `forbidden`, `invalid`. */
	error: string;
	/** For `invalid`: the field that was refused. */
	field?: keyof GuildSettings | 'channelId';
	/** For an invalid `roleRules`: which rule. */
	index?: number;
}
