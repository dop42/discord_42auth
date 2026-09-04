import { primaryCampus, type FtUser } from './ft/api';
import type { MessageKey } from './i18n';
import type { Settings } from './settings';

/** A refusal names a message key rather than a sentence, so it can be shown in any language. */
export type Eligibility =
	| { ok: true }
	| { ok: false; reason: MessageKey; params?: Record<string, string> };

/**
 * @author dop42
 * @method checkEligibility
 * @description Decides whether a verified 42 account may receive the role.
 * @remarks A closed account is refused whatever the settings say, staff included — that test
 * is deliberately outside `studentsOnly`, which governs alumni only. Staff then bypass the
 * remaining criteria on purpose: they belong to no single campus and are not students, yet
 * they are the people most likely to need access.
 * @param user {FtUser}
 * @param settings {Settings}
 * @returns {Eligibility}
 */
export function checkEligibility(user: FtUser, settings: Settings): Eligibility {
	if (!user['active?']) return { ok: false, reason: 'rule.inactive' };

	if (user['staff?']) return { ok: true };

	if (settings.studentsOnly && user['alumni?']) {
		return { ok: false, reason: 'rule.inactive' };
	}

	if (settings.campus) {
		const campus = primaryCampus(user);
		if (campus?.name.toLowerCase() !== settings.campus.toLowerCase()) {
			return {
				ok: false,
				reason: 'rule.wrongCampus',
				params: { campus: settings.campus, userCampus: campus?.name ?? '?' },
			};
		}
	}

	return { ok: true };
}

/**
 * @author dop42
 * @method nicknameFor
 * @description Builds the nickname to apply after a successful auth, or null in `off` mode.
 * @remarks Discord caps a nickname at 32 characters. The login is the identifying half, so
 * it is the part kept whole when the full name has to be cut, and the cut is made on code
 * points rather than UTF-16 units so a name cannot be split mid-character.
 * @param user {FtUser}
 * @param settings {Settings}
 * @returns {string | null}
 */
export function nicknameFor(user: FtUser, settings: Settings): string | null {
	const MAX = 32;
	const cut = (text: string, max: number) => [...text].slice(0, max).join('');

	switch (settings.nickname) {
		case 'login':
			return cut(user.login, MAX);
		case 'full': {
			const suffix = ` (${user.login})`;
			if (suffix.length >= MAX) return cut(user.login, MAX);
			const name = cut(user.usual_full_name ?? '', MAX - suffix.length).trim();
			return name ? name + suffix : cut(user.login, MAX);
		}
		default:
			return null;
	}
}
