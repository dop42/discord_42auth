import { env } from '../env';
import type { Guild, Member } from './rest';
import { Permissions } from './types';

/**
 * What the bot needs: grant the role, rename, write in the log and hall of fame channels,
 * mirror the campus events, and rename the counter channel.
 */
const BOT_PERMISSIONS =
	Permissions.MANAGE_ROLES |
	Permissions.MANAGE_NICKNAMES |
	Permissions.VIEW_CHANNEL |
	Permissions.SEND_MESSAGES |
	Permissions.MANAGE_EVENTS |
	Permissions.MANAGE_CHANNELS;

/**
 * Tells whether a set of permission bits allows configuring the bot.
 * @remarks Administrator is accepted on its own rather than trusting Discord to have expanded
 * it into every other bit.
 */
export const canManage = (permissions: bigint) =>
	(permissions & (Permissions.ADMINISTRATOR | Permissions.MANAGE_GUILD)) !== 0n;

/**
 * Computes a member's server-wide permissions from their roles.
 * @remarks Server-wide only: channel overwrites cannot grant Manage Server or Administrator,
 * which are the only bits read from this. The owner holds every permission whatever their
 * roles say.
 */
export function basePermissions(guild: Guild, member: Member): bigint {
	if (guild.owner_id === member.user.id) return Permissions.ADMINISTRATOR;
	const held = new Set([guild.id, ...member.roles]);
	return guild.roles
		.filter((role) => held.has(role.id))
		.reduce((bits, role) => bits | BigInt(role.permissions), 0n);
}

/**
 * Returns the position of a member's highest role; 0 for `@everyone` only.
 * @remarks A bot can only grant roles strictly below this.
 */
export function highestPosition(guild: Guild, member: Member): number {
	const held = new Set(member.roles);
	return guild.roles
		.filter((role) => held.has(role.id))
		.reduce((top, role) => Math.max(top, role.position), 0);
}

/** Builds the add-the-bot link, optionally preselecting a server. */
export function inviteUrl(guildId?: string): string {
	const params = new URLSearchParams({
		client_id: env.discordAppId,
		scope: 'bot applications.commands',
		permissions: String(BOT_PERMISSIONS),
	});
	if (guildId) {
		params.set('guild_id', guildId);
		params.set('disable_guild_select', 'true');
	}
	return `https://discord.com/oauth2/authorize?${params}`;
}
