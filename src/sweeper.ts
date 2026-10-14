import type { GuildSettings } from '../shared/api';
import { audit } from './audit';
import { db } from './db/pool';
import { botGuildIds, DiscordError, getGuild, getMember } from './discord/rest';
import { fetchAppToken, fetchCoalitions, fetchUser, FtError, primaryCampus } from './ft/api';
import { resolveLocale } from './i18n';
import { deleteLink } from './links';
import { syncRuleRoles, unlink } from './membership';
import { checkEligibility, matchingRoles, type Eligibility } from './rules';
import { deleteGuild, getSettings } from './settings';

/** How often the sweeper runs. */
const INTERVAL_MS = 60 * 60 * 1000;
/** Members checked per run; 500 an hour covers 12 000 links a day. */
const BATCH = 500;
/** Pause between two member checks, well under Discord's rate limits. */
const PAUSE_MS = 250;

/** 42 accounts looked up again per run: 100 an hour re-checks 16 800 links a week. */
const FT_BATCH = 100;

const pause = () => new Promise((resolve) => setTimeout(resolve, PAUSE_MS));

/** Rows the sweeper deleted, and roles it took back. */
export interface SweepResult {
	sessions: number;
	guilds: number;
	links: number;
	revoked: number;
}

/**
 * Deletes what the bot no longer has a reason to keep.
 * @remarks This is the retention policy, enforced. Expired dashboard sessions go first. Then
 * every server the bot was removed from loses its settings and links — only when Discord
 * returned the bot's full server list, never on a partial one. Last, the links least
 * recently checked are re-checked against the server: a member who left loses their link.
 * Only "Unknown Member" deletes; any other answer leaves the row for the next run, and a 429
 * ends the run early. Then `recheck` looks the oldest 42 accounts up again.
 */
export async function sweep(): Promise<SweepResult> {
	const deleted = { sessions: 0, guilds: 0, links: 0, revoked: 0 };

	const sessions = await db().query('DELETE FROM sessions WHERE expires_at < now()');
	deleted.sessions = sessions.rowCount ?? 0;

	const present = await botGuildIds();
	const { rows: known } = await db().query<{ guild_id: string }>('SELECT guild_id FROM guilds');
	for (const { guild_id } of known) {
		if (present.has(guild_id)) continue;
		await deleteGuild(guild_id);
		deleted.guilds++;
	}

	const { rows: links } = await db().query<{ guild_id: string; user_id: string }>(
		`SELECT guild_id, user_id FROM links
		 WHERE checked_at < now() - interval '1 day'
		 ORDER BY checked_at LIMIT $1`,
		[BATCH],
	);
	for (const { guild_id, user_id } of links) {
		try {
			if (await getMember(guild_id, user_id)) {
				await db().query(
					'UPDATE links SET checked_at = now() WHERE guild_id = $1 AND user_id = $2',
					[guild_id, user_id],
				);
			} else if (await deleteLink(guild_id, user_id)) {
				deleted.links++;
			}
		} catch (failure) {
			// A refusal for one member leaves the row for the next run; a 429, a timeout or an
			// outage ends this run, since every member after it would fail the same way.
			if (!(failure instanceof DiscordError) || failure.status === 429) {
				console.error(`sweep stopped: ${(failure as Error).message}`);
				break;
			}
		}
		await pause();
	}

	const rechecked = await recheck();
	deleted.links += rechecked.left;
	deleted.revoked = rechecked.revoked;
	return deleted;
}

/**
 * Looks the 42 accounts verified longest ago up again, and acts on what changed.
 * @remarks A verification is a snapshot: an account closed, gone alumni or moved to another
 * campus since must not keep the role. Each account is re-judged with the server's current
 * rules; a refused one is unlinked exactly as `/forget` would, and the log channel says why.
 * A kept one has its rule roles brought up to date — a piscine that ended, a new coalition.
 * Accounts are checked once a week, through the background lane of the 42 rate limiter.
 * Any 42 or Discord failure ends the run and leaves the rest for the next hour.
 */
async function recheck(): Promise<{ left: number; revoked: number }> {
	const result = { left: 0, revoked: 0 };
	const { rows } = await db().query<{ guild_id: string; user_id: string; ft_id: number; ft_login: string }>(
		`SELECT guild_id, user_id, ft_id, ft_login FROM links
		 WHERE ft_checked_at < now() - interval '7 days'
		 ORDER BY ft_checked_at LIMIT $1`,
		[FT_BATCH],
	);
	if (!rows.length) return result;

	const token = await fetchAppToken();
	const settingsOf = new Map<string, GuildSettings>();
	const localeOf = new Map<string, string>();

	for (const link of rows) {
		try {
			const settings = settingsOf.get(link.guild_id) ?? (await getSettings(link.guild_id));
			settingsOf.set(link.guild_id, settings);

			const member = await getMember(link.guild_id, link.user_id);
			if (!member) {
				if (await deleteLink(link.guild_id, link.user_id)) result.left++;
				continue;
			}

			const user = await fetchUser(link.ft_id, token);
			const eligibility: Eligibility = user
				? checkEligibility(user, settings)
				: { ok: false, reason: 'rule.inactive' };

			if (!settings.roleId) {
				// Verification is switched off: nothing to judge, nothing to take back.
			} else if (!eligibility.ok) {
				await unlink(link.guild_id, link.user_id, settings, member);
				const locale =
					localeOf.get(link.guild_id) ??
					resolveLocale((await getGuild(link.guild_id)).preferred_locale);
				localeOf.set(link.guild_id, locale);
				await audit(settings.logChannelId, locale, {
					userId: link.user_id,
					login: user?.login ?? link.ft_login,
					campus: user ? primaryCampus(user)?.name : undefined,
					outcome: 'revoked',
					reason: { key: eligibility.reason, params: eligibility.params },
				});
				result.revoked++;
				continue;
			} else if (user && settings.roleRules.length) {
				const coalitions = settings.roleRules.some((rule) => rule.kind === 'coalition')
					? await fetchCoalitions(user.id, token, 'background')
					: [];
				await syncRuleRoles(
					link.guild_id,
					member,
					matchingRoles(user, coalitions, settings.roleRules),
					settings,
				);
			}

			await db().query(
				`UPDATE links SET ft_checked_at = now(), checked_at = now(), ft_login = $3
				 WHERE guild_id = $1 AND user_id = $2`,
				[link.guild_id, link.user_id, user?.login ?? link.ft_login],
			);
		} catch (failure) {
			if (
				failure instanceof FtError ||
				failure instanceof DiscordError ||
				(failure as Error).name === 'TimeoutError'
			) {
				console.error(`recheck stopped: ${(failure as Error).message}`);
				break;
			}
			throw failure;
		}
		await pause();
	}
	return result;
}

/**
 * Runs `sweep` a minute after boot, then every hour, never two at once.
 * @returns stops the timers
 */
export function startSweeper(): () => void {
	let running = false;
	const run = async () => {
		if (running) return;
		running = true;
		try {
			const deleted = await sweep();
			console.log(
				`sweep: ${deleted.sessions} sessions, ${deleted.guilds} servers, ${deleted.links} links deleted, ${deleted.revoked} revoked`,
			);
		} catch (failure) {
			console.error('sweep failed:', failure);
		} finally {
			running = false;
		}
	};
	const first = setTimeout(run, 60 * 1000);
	const every = setInterval(run, INTERVAL_MS);
	return () => {
		clearTimeout(first);
		clearInterval(every);
	};
}
