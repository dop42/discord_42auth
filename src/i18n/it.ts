import type { Messages } from './types';

export const it: Messages = {
	'cmd.config': "Mostra la configurazione dell'autenticazione 42 di questo server",
	'cmd.panel': 'Pubblica il pannello di verifica in questo canale',

	'error.notInGuild': 'Questo comando funziona solo in un server.',
	'error.wrongGuild': 'Questo bot è configurato per un altro server.',
	'error.unknown': 'Qualcosa è andato storto. Chiedi a un admin di controllare i log del deploy.',

	'auth.notConfigured': 'Questo server non è ancora configurato — un admin deve impostare `ROLE_ID` nel deploy.',
	'auth.notice': 'Accedi con il pulsante qui sotto. Questo link è personale e scade tra 5 minuti — non condividerlo mai.',
	'auth.button': "Accedi all'intra 42",

	'panel.title': 'Verifica 42',
	'panel.body': 'Collega il tuo account 42 per accedere a questo server.',
	'panel.button': 'Verificami',

	'config.noPermission': 'Ti serve il permesso **Gestisci server** per vedere le impostazioni.',

	'show.role': 'Ruolo',
	'show.role.unset': '_non impostato, la verifica è disattivata_',
	'show.campus': 'Campus',
	'show.campus.any': '_tutti_',
	'show.students': 'Solo studenti attivi',
	'show.nickname': 'Nickname',
	'show.nickname.off': 'invariato',
	'show.nickname.login': 'login intra (`jdoe`)',
	'show.nickname.full': 'nome completo + login (`John Doe (jdoe)`)',
	'show.logs': 'Canale di log',
	'show.logs.none': '_nessuno_',
	'show.yes': 'sì',
	'show.no': 'no',
	'show.hint': "Queste impostazioni vengono dalle variabili d'ambiente — modificale su Vercel e ridistribuisci.",

	'rule.inactive': 'Questo account 42 non è attivo (alumni o account chiuso).',
	'rule.wrongCampus': 'Questo server è riservato al campus {campus}, il tuo è {userCampus}.',

	'page.cancelled.title': 'Autenticazione annullata',
	'page.cancelled.body': "Hai negato l'accesso al tuo account 42.",
	'page.invalid.title': 'Link non valido',
	'page.invalid.body': 'Questo link è scaduto o malformato. Premi di nuovo il pulsante di verifica.',
	'page.refused.title': 'Accesso negato',
	'page.notConfigured.title': 'Server non configurato',
	'page.notConfigured.body': 'Nessun ruolo è configurato. Chiedi a un admin di impostare ROLE_ID nel deploy.',
	'page.failed.title': 'Autenticazione fallita',
	'page.failed.body': 'Qualcosa è andato storto dalla nostra parte. Riprova tra poco.',

	'log.ok': 'Autenticazione riuscita',
	'log.refused': 'Autenticazione rifiutata',
	'log.discord': 'Discord',
	'log.account': 'Account 42',
	'log.campus': 'Campus',
	'log.reason': 'Motivo',
	'log.unknown': 'sconosciuto',
};
