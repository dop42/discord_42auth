import { Permissions } from '../discord/types';
import { FALLBACK, localizations, t, type MessageKey } from '../i18n';

/**
 * @author dop42
 * @method described
 * @description Builds a command description together with its translations.
 * @param key {MessageKey}
 * @returns {{ description: string; description_localizations: Record<string, string> }}
 */
function described(key: MessageKey) {
	return { description: t(FALLBACK, key), description_localizations: localizations(key) };
}

/**
 * The commands this bot registers.
 *
 * @remarks Consumed by `npm run register` only. `api/interactions.ts` dispatches on the
 * command name by hand, so a command added here also needs a `case` there. Names stay in
 * English — Discord requires them lowercase and a localized name would make the
 * documentation unusable — while descriptions follow the reader.
 */
export const commands = [
	{
		name: 'auth',
		...described('cmd.auth'),
		dm_permission: false,
	},
	{
		name: 'config',
		...described('cmd.config'),
		dm_permission: false,
		default_member_permissions: String(Permissions.MANAGE_GUILD),
	},
];
