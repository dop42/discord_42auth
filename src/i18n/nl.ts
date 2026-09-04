import type { Messages } from './types';

export const nl: Messages = {
	'cmd.auth': 'Verifieer je 42-account om toegang te krijgen tot deze server',
	'cmd.config': 'De 42-authenticatie-instellingen van deze server tonen',
	'cmd.panel': 'Het verificatiepaneel in dit kanaal plaatsen',

	'error.notInGuild': 'Dit commando werkt alleen binnen een server.',
	'error.wrongGuild': 'Deze bot is voor een andere server ingesteld.',
	'error.unknown': 'Er ging iets mis. Vraag een admin om de deployment-logs te bekijken.',

	'auth.notConfigured': 'Deze server is nog niet ingesteld — een admin moet `ROLE_ID` in de deployment zetten.',
	'auth.notice': 'Log in met de knop hieronder. Deze link is persoonlijk en verloopt over 5 minuten — deel hem nooit.',
	'auth.button': 'Inloggen op het 42-intranet',

	'panel.title': '42-verificatie',
	'panel.body': 'Koppel je 42-account om toegang te krijgen tot deze server.',
	'panel.button': 'Verifiëren',

	'config.noPermission': 'Je hebt de permissie **Server beheren** nodig om de instellingen te zien.',

	'show.role': 'Rol',
	'show.role.unset': '_niet ingesteld, verificatie is uitgeschakeld_',
	'show.campus': 'Campus',
	'show.campus.any': '_alle_',
	'show.students': 'Alleen actieve studenten',
	'show.nickname': 'Bijnaam',
	'show.nickname.off': 'ongewijzigd',
	'show.nickname.login': 'intra-login (`jdoe`)',
	'show.nickname.full': 'volledige naam + login (`John Doe (jdoe)`)',
	'show.logs': 'Logkanaal',
	'show.logs.none': '_geen_',
	'show.yes': 'ja',
	'show.no': 'nee',
	'show.hint': 'Deze instellingen komen uit omgevingsvariabelen — pas ze aan op Vercel en deploy opnieuw.',

	'rule.inactive': 'Dit 42-account is niet actief (alumnus of gesloten account).',
	'rule.wrongCampus': 'Deze server is beperkt tot campus {campus}, die van jou is {userCampus}.',

	'page.cancelled.title': 'Authenticatie geannuleerd',
	'page.cancelled.body': 'Je hebt toegang tot je 42-account geweigerd.',
	'page.invalid.title': 'Ongeldige link',
	'page.invalid.body': 'Deze link is verlopen of ongeldig. Haal een nieuwe via het verificatiepaneel, of voer /auth uit.',
	'page.refused.title': 'Toegang geweigerd',
	'page.notConfigured.title': 'Server niet ingesteld',
	'page.notConfigured.body': 'Er is nog geen rol ingesteld. Vraag een admin om ROLE_ID in de deployment te zetten.',
	'page.failed.title': 'Authenticatie mislukt',
	'page.failed.body': 'Er ging iets mis aan onze kant. Probeer het zo meteen opnieuw.',

	'log.ok': 'Authenticatie geslaagd',
	'log.refused': 'Authenticatie geweigerd',
	'log.discord': 'Discord',
	'log.account': '42-account',
	'log.campus': 'Campus',
	'log.reason': 'Reden',
	'log.unknown': 'onbekend',
};
