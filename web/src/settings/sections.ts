import type { GuildSettings } from '@shared/api';

/** A category of the settings form, and the settings it holds. */
export interface SettingsSection {
	id: 'access' | 'members' | 'features' | 'moderation';
	fields: Array<keyof GuildSettings>;
}

/**
 * The categories of the settings tab, in page order.
 * @remarks Read by the form, which renders one `<section>` each, and by the navigation, which
 * marks a category holding unsaved edits. A setting belongs to exactly one category.
 */
export const SETTINGS_SECTIONS: SettingsSection[] = [
	{ id: 'access', fields: ['roleId', 'campus', 'studentsOnly'] },
	{ id: 'members', fields: ['roleRules', 'nickname'] },
	{
		id: 'features',
		fields: [
			'helpers',
			'fameChannelId',
			'syncEvents',
			'syncExams',
			'counterChannelId',
			'logChannelId',
		],
	},
	{
		id: 'moderation',
		fields: [
			'automodSpam',
			'automodMentions',
			'automodLanguage',
			'automodKeywords',
			'automodAlertChannelId',
		],
	},
];

/** Element id of a category, and of its heading, which takes the focus when it is jumped to. */
export const sectionId = (id: string) => `section-${id}`;
export const headingId = (id: string) => `section-${id}-title`;
