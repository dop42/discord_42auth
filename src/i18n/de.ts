import type { Messages } from './types';

export const de: Messages = {
	'cmd.config': 'Die 42-Authentifizierungseinstellungen dieses Servers anzeigen',
	'cmd.panel': 'Das Verifizierungs-Panel in diesem Kanal posten',
	'cmd.forget': 'Deine 42-Verknüpfung auf diesem Server löschen und die Rolle abgeben',

	'error.notInGuild': 'Dieser Befehl funktioniert nur innerhalb eines Servers.',
	'error.unknown': 'Etwas ist schiefgelaufen. Versuche es gleich noch einmal.',

	'auth.notConfigured': 'Dieser Server ist noch nicht eingerichtet — ein Admin muss im Dashboard eine Rolle wählen.',
	'auth.notice': 'Melde dich mit dem Button unten an. Dieser Link ist persönlich und läuft in 5 Minuten ab — teile ihn niemals.',
	'auth.privacy': 'Die Verifizierung verknüpft dein Discord-Konto mit deiner 42-ID und deinem Login, solange du auf diesem Server bist. `/forget` löscht sie. [Datenschutz]({privacy})',
	'auth.button': 'Im 42-Intranet anmelden',

	'panel.title': '42-Verifizierung',
	'panel.body': 'Verknüpfe deinen 42-Account, um Zugang zu diesem Server zu erhalten.',
	'panel.button': 'Verifizieren',

	'config.noPermission': 'Du brauchst die Berechtigung **Server verwalten**, um die Einstellungen zu sehen.',
	'forget.done': 'Deine 42-Verknüpfung auf diesem Server ist gelöscht und die Rolle entfernt.',
	'forget.none': 'Auf diesem Server ist kein 42-Konto mit dir verknüpft.',
	'forget.roleKept': 'Deine 42-Verknüpfung ist gelöscht, aber die Rolle konnte nicht entfernt werden — frag einen Admin.',

	'show.role': 'Rolle',
	'show.role.unset': '_nicht gesetzt, die Verifizierung ist deaktiviert_',
	'show.campus': 'Campus',
	'show.campus.any': '_alle_',
	'show.students': 'Nur aktive Studierende',
	'show.nickname': 'Nickname',
	'show.nickname.off': 'unverändert',
	'show.nickname.login': 'Intra-Login (`jdoe`)',
	'show.nickname.full': 'Vollständiger Name + Login (`John Doe (jdoe)`)',
	'show.logs': 'Protokollkanal',
	'show.logs.none': '_keiner_',
	'show.yes': 'ja',
	'show.no': 'nein',
	'show.hint': 'Ändere diese Einstellungen im Dashboard: {url}',

	'rule.inactive': 'Dieser 42-Account ist nicht aktiv (Alumni oder geschlossener Account).',
	'rule.wrongCampus': 'Dieser Server ist auf den Campus {campus} beschränkt, deiner ist {userCampus}.',
	'rule.alreadyLinked': 'Dieses 42-Konto ist bereits mit einem anderen Mitglied dieses Servers verknüpft.',

	'page.cancelled.title': 'Authentifizierung abgebrochen',
	'page.cancelled.body': 'Du hast den Zugriff auf deinen 42-Account verweigert.',
	'page.invalid.title': 'Ungültiger Link',
	'page.invalid.body': 'Dieser Link ist abgelaufen oder fehlerhaft. Drücke erneut auf den Verifizierungs-Button.',
	'page.refused.title': 'Zugang verweigert',
	'page.notConfigured.title': 'Server nicht konfiguriert',
	'page.notConfigured.body': 'Es ist keine Rolle eingerichtet. Bitte einen Admin, im Dashboard eine zu wählen.',
	'page.failed.title': 'Authentifizierung fehlgeschlagen',
	'page.failed.body': 'Auf unserer Seite ist etwas schiefgelaufen. Versuche es gleich noch einmal.',

	'log.ok': 'Authentifizierung erfolgreich',
	'log.refused': 'Authentifizierung abgelehnt',
	'log.discord': 'Discord',
	'log.account': '42-Account',
	'log.campus': 'Campus',
	'log.reason': 'Grund',
	'log.unknown': 'unbekannt',
};
