import type { BotPermission } from '../../shared/api';
import { env } from '../env';
import type { Guild, Member } from './rest';
import { Permissions } from './types';

/**
 * What the bot needs: grant the role, rename, write in the log and hall of fame channels,
 * announce the exams, rename the counter channel, and keep the AutoMod rules.
 */
const NEEDED: Record<BotPermission, bigint> = {
	manageRoles: Permissions.MANAGE_ROLES,
	manageNicknames: Permissions.MANAGE_NICKNAMES,
	viewChannel: Permissions.VIEW_CHANNEL,
	sendMessages: Permissions.SEND_MESSAGES,
	manageChannels: Permissions.MANAGE_CHANNELS,
	manageGuild: Permissions.MANAGE_GUILD,
};
const BOT_PERMISSIONS = Object.values(NEEDED).reduce((bits, bit) => bits | bit, 0n);

/**
 * Lists what the bot asks for and its roles do not give it on a server.
 * @remarks Server-wide only: a channel overwrite can still take one back in a single channel.
 */
export function missingPermissions(guild: Guild, bot: Member): BotPermission[] {
	const held = basePermissions(guild, bot);
	if (held & Permissions.ADMINISTRATOR) return [];
	return (Object.entries(NEEDED) as Array<[BotPermission, bigint]>)
		.filter(([, bit]) => (held & bit) === 0n)
		.map(([name]) => name);
}

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
