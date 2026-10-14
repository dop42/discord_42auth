import type { Messages } from './types';

export const nl: Messages = {
	'cmd.config': 'De 42-authenticatie-instellingen van deze server tonen',
	'cmd.panel': 'Het verificatiepaneel in dit kanaal plaatsen',
	'cmd.forget': 'Je 42-koppeling op deze server wissen en de geverifieerde rol inleveren',

	'error.notInGuild': 'Dit commando werkt alleen binnen een server.',
	'error.unknown': 'Er ging iets mis. Probeer het zo opnieuw.',

	'auth.notConfigured': 'Deze server is nog niet ingesteld — een admin moet een rol kiezen in het dashboard.',
	'auth.notice': 'Log in met de knop hieronder. Deze link is persoonlijk en verloopt over 5 minuten — deel hem nooit.',
	'auth.privacy': 'Verificatie koppelt je Discord-account aan je 42-id en login zolang je op deze server blijft. `/forget` wist het. [Privacy]({privacy})',
	'auth.button': 'Inloggen op het 42-intranet',

	'panel.title': '42-verificatie',
	'panel.body': 'Koppel je 42-account om toegang te krijgen tot deze server.',
	'panel.button': 'Verifiëren',

	'config.noPermission': 'Je hebt de permissie **Server beheren** nodig om de instellingen te zien.',
	'forget.done': 'Je 42-koppeling op deze server is gewist en de geverifieerde rol verwijderd.',
	'forget.none': 'Er is op deze server geen 42-account aan je gekoppeld.',
	'forget.roleKept': 'Je 42-koppeling is gewist, maar de rol kon niet worden verwijderd — vraag een admin.',

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
	'show.hint': 'Wijzig deze instellingen in het dashboard: {url}',

	'rule.inactive': 'Dit 42-account is niet actief (alumnus of gesloten account).',
	'rule.wrongCampus': 'Deze server is beperkt tot campus {campus}, die van jou is {userCampus}.',
	'rule.alreadyLinked': 'Dit 42-account is al gekoppeld aan een ander lid van deze server.',

	'page.cancelled.title': 'Authenticatie geannuleerd',
	'page.cancelled.body': 'Je hebt toegang tot je 42-account geweigerd.',
	'page.invalid.title': 'Ongeldige link',
	'page.invalid.body': 'Deze link is verlopen of ongeldig. Druk opnieuw op de verificatieknop.',
	'page.refused.title': 'Toegang geweigerd',
	'page.notConfigured.title': 'Server niet ingesteld',
	'page.notConfigured.body': 'Er is nog geen rol ingesteld. Vraag een admin er een te kiezen in het dashboard.',
	'page.failed.title': 'Authenticatie mislukt',
	'page.failed.body': 'Er ging iets mis aan onze kant. Probeer het zo meteen opnieuw.',

	'log.ok': 'Authenticatie geslaagd',
	'log.refused': 'Authenticatie geweigerd',
	'log.revoked': 'Verificatie ingetrokken',
	'log.discord': 'Discord',
	'log.account': '42-account',
	'log.campus': 'Campus',
	'log.reason': 'Reden',
	'log.unknown': 'onbekend',
};
