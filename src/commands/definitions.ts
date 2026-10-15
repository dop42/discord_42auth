import { OptionType, Permissions } from '../discord/types';
import { FALLBACK, localizations, t, type MessageKey } from '../i18n';

/** Identifies the panel button in the interactions Discord sends back. */
export const AUTH_BUTTON = 'auth';

/** Builds a command description together with its translations. */
function described(key: MessageKey) {
	return { description: t(FALLBACK, key), description_localizations: localizations(key) };
}

/**
 * The commands this bot registers.
 *
 * @remarks Consumed by `npm run register` only. `src/routes/interactions.ts` dispatches on
 * the command name by hand, so a command added here also needs a `case` there. Names stay in
 * English — Discord requires them lowercase and a localized name would make the
 * documentation unusable — while descriptions follow the reader.
 */
export const commands = [
	{
		name: 'config',
		...described('cmd.config'),
		dm_permission: false,
		default_member_permissions: String(Permissions.MANAGE_GUILD),
	},
	{
		name: 'panel',
		...described('cmd.panel'),
		dm_permission: false,
		default_member_permissions: String(Permissions.MANAGE_GUILD),
	},
	{
		name: 'forget',
		...described('cmd.forget'),
		dm_permission: false,
	},
	{
		name: 'profile',
		...described('cmd.profile'),
		dm_permission: false,
		options: [{ name: 'member', type: OptionType.USER, required: false, ...described('cmd.profile.member') }],
	},
	{
		name: 'helpers',
		...described('cmd.helpers'),
		dm_permission: false,
		options: [
			{
				name: 'project',
				type: OptionType.STRING,
				required: true,
				max_length: 64,
				...described('cmd.helpers.project'),
			},
		],
	},
	{
		name: 'visibility',
		...described('cmd.visibility'),
		dm_permission: false,
		options: [{ name: 'shown', type: OptionType.BOOLEAN, required: true, ...described('cmd.visibility.shown') }],
	},
	{
		name: 'logtime',
		...described('cmd.logtime'),
		dm_permission: false,
		options: [
			{
				name: 'month',
				type: OptionType.STRING,
				required: false,
				min_length: 7,
				max_length: 7,
				...described('cmd.logtime.month'),
			},
		],
	},
	{
		name: 'reminder',
		...described('cmd.reminder'),
		dm_permission: false,
		options: [
			{
				name: 'days',
				type: OptionType.INTEGER,
				required: true,
				min_value: 0,
				max_value: 60,
				...described('cmd.reminder.days'),
			},
		],
	},
];
