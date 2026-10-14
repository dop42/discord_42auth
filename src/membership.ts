import type { GuildSettings } from '../shared/api';
import { addRole, removeRole, setNickname, type Member } from './discord/rest';
import { deleteLink, findByMember } from './links';

/**
 * @author dop42
 * @method ruleRoleIds
 * @description Returns the roles the server's role rules hand out, without the verified role.
 * @param settings {GuildSettings}
 * @returns {Set<string>}
 */
function ruleRoleIds(settings: GuildSettings): Set<string> {
	const ids = new Set(settings.roleRules.map((rule) => rule.roleId));
	if (settings.roleId) ids.delete(settings.roleId);
	return ids;
}

/**
 * @author dop42
 * @method syncRuleRoles
 * @description Gives a verified member the rule roles they earn and takes back the others.
 * @remarks Only roles named by a rule are touched; whatever else the member holds is the
 * admins' business. Best-effort per role: a role the bot cannot manage any more is logged
 * and skipped, the next re-check tries again.
 * @param guildId {string}
 * @param member {Member}
 * @param wanted {string[]} from `matchingRoles`
 * @param settings {GuildSettings}
 * @returns {Promise<void>}
 */
export async function syncRuleRoles(
	guildId: string,
	member: Member,
	wanted: string[],
	settings: GuildSettings,
): Promise<void> {
	const managed = ruleRoleIds(settings);
	const held = new Set(member.roles);
	for (const roleId of wanted) {
		if (!managed.has(roleId) || held.has(roleId)) continue;
		await addRole(guildId, member.user.id, roleId).catch((failure: unknown) => console.error(failure));
	}
	for (const roleId of managed) {
		if (held.has(roleId) && !wanted.includes(roleId)) {
			await removeRole(guildId, member.user.id, roleId);
		}
	}
}

/**
 * @author dop42
 * @method unlink
 * @description Forgets a member's link and takes back every role and nickname it gave them.
 * @remarks The link goes first, since that is what was asked for; the roles and the nickname
 * follow on a best-effort basis. The nickname is only cleared when it is still one the bot
 * set, so a name the member chose afterwards is left alone. A member who already left has
 * nothing to take back.
 * @param guildId {string}
 * @param userId {string}
 * @param settings {GuildSettings}
 * @param member {Member | null} null when they are not in the server any more
 * @returns {Promise<{ linked: boolean; rolesRemoved: boolean }>} whether there was a link,
 * and whether every role came off
 */
export async function unlink(
	guildId: string,
	userId: string,
	settings: GuildSettings,
	member: Member | null,
): Promise<{ linked: boolean; rolesRemoved: boolean }> {
	const link = await findByMember(guildId, userId);
	if (!link || !(await deleteLink(guildId, userId))) return { linked: false, rolesRemoved: true };
	if (!member) return { linked: true, rolesRemoved: true };

	const nick = member.nick ?? '';
	if (nick === link.ftLogin || nick.endsWith(` (${link.ftLogin})`)) {
		await setNickname(guildId, userId, null);
	}

	const roles = new Set(ruleRoleIds(settings));
	if (settings.roleId) roles.add(settings.roleId);
	let rolesRemoved = true;
	for (const roleId of roles) {
		if (member.roles.includes(roleId) && !(await removeRole(guildId, userId, roleId))) {
			rolesRemoved = false;
		}
	}
	return { linked: true, rolesRemoved };
}
