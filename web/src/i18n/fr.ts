/** Every string of the dashboard. A second language would be another object of this shape. */
export const fr = {
	appName: '42 Auth',
	loading: 'Chargement…',
	retry: 'Réessayer',
	back: 'Retour aux serveurs',

	'landing.eyebrow': 'Bot Discord · intra 42',
	/** Title words; `accent` ones are set bold. */
	'landing.title': [
		{ text: 'Réservez', accent: false },
		{ text: 'votre', accent: false },
		{ text: 'serveur', accent: false },
		{ text: 'aux', accent: false },
		{ text: 'étudiants', accent: true },
		{ text: 'de', accent: false },
		{ text: '42', accent: true },
	],
	'landing.lead':
		'Un bouton, une connexion à l’intra, un rôle. Seuls les comptes 42 valides entrent — et le bot oublie tout dès que le membre s’en va.',
	'landing.steps.title': 'Comment ça marche',
	'landing.steps': [
		{
			n: '01',
			title: 'Le panneau',
			text: 'Vous publiez le panneau avec /panel. Les membres cliquent sur « Se vérifier ».',
		},
		{
			n: '02',
			title: 'L’intra',
			text: 'Ils se connectent avec leur compte 42. Le bot vérifie qu’il est actif et, si vous le voulez, du bon campus.',
		},
		{
			n: '03',
			title: 'Le rôle',
			text: 'Le rôle est donné. Un compte 42 ne sert qu’à un seul compte Discord par serveur.',
		},
	],
	'landing.login': 'Se connecter avec Discord',
	'landing.invite': 'Ajouter le bot',

	'header.logout': 'Se déconnecter',
	'header.login': 'Se connecter',
	'guilds.eyebrow': 'Dashboard',
	'guilds.title': 'Vos serveurs',
	'guilds.present': 'Bot actif',
	'guilds.hint':
		'Seuls les serveurs où vous avez la permission « Gérer le serveur » apparaissent.',
	'guilds.empty': 'Aucun serveur à gérer. Il vous faut la permission « Gérer le serveur ».',
	'guilds.configure': 'Configurer',
	'guilds.add': 'Ajouter le bot',
	'guilds.absent': 'Bot absent',

	'settings.eyebrow': 'Réglages du serveur',
	'settings.verified': (n: number) => (n > 1 ? 'membres vérifiés' : 'membre vérifié'),
	'settings.role': 'Rôle attribué',
	'settings.role.help':
		'Donné aux membres dont le compte 42 est accepté. Sans rôle, la vérification est désactivée.',
	'settings.role.none': '— Aucun (vérification désactivée) —',
	'settings.role.above': 'au-dessus du rôle du bot',
	'settings.role.warn':
		'Certains rôles sont au-dessus du rôle du bot : Discord interdit au bot de les donner. Dans Paramètres du serveur → Rôles, glissez le rôle du bot au-dessus du rôle à attribuer.',
	'settings.campus': 'Campus',
	'settings.campus.help':
		'Écrit comme sur l’intra (ex. « Paris »). Laissez vide pour accepter tous les campus.',
	'settings.students': 'Étudiants actifs uniquement',
	'settings.students.help':
		'Refuse les alumni. Les comptes fermés sont toujours refusés ; le staff est toujours accepté.',
	'settings.nickname': 'Pseudo des membres vérifiés',
	'settings.nickname.help':
		'Le nom affiché sur le serveur après la vérification. Le login devient visible de tous les membres.',
	'settings.nickname.off': 'Inchangé',
	'settings.nickname.login': 'Login de l’intra',
	'settings.nickname.full': 'Nom complet et login',
	'settings.logs': 'Salon de journal',
	'settings.logs.none': 'Aucun',
	'settings.logs.help':
		'Un message par tentative (acceptée ou refusée) : ID Discord, login 42, campus, motif.',
	'settings.logs.retention':
		'Ces messages restent dans Discord, sous la responsabilité des admins du serveur. Supprimez-les selon votre politique de conservation — 3 mois maximum est une durée raisonnable.',
	'settings.dirty': 'Modifications non enregistrées',
	'settings.clean': 'Tout est enregistré',
	'settings.reset': 'Annuler',
	'settings.save': 'Enregistrer',
	'settings.saving': 'Enregistrement…',
	'settings.saved': 'Réglages enregistrés.',
	'settings.invalid': 'Ce champ a été refusé par le serveur.',
	'settings.error': 'L’enregistrement a échoué. Réessayez.',

	'danger.title': 'Zone dangereuse',
	'danger.body':
		'Supprime les réglages et tous les liens Discord ↔ 42 de ce serveur. Les rôles déjà donnés ne sont pas retirés.',
	'danger.button': 'Supprimer toutes les données de ce serveur',
	'danger.confirm': (name: string) => `Tapez « ${name} » pour confirmer.`,
	'danger.cancel': 'Annuler',
	'danger.submit': 'Supprimer définitivement',
	'danger.error': 'La suppression a échoué. Réessayez.',

	'error.forbidden': 'Vous n’avez pas la permission « Gérer le serveur » sur ce serveur.',
	'error.notFound': 'Le bot n’est pas sur ce serveur.',
	'error.generic': 'Impossible de charger les données.',

	'footer.tagline':
		'Réserve un serveur Discord aux comptes de l’intra 42, sans rien garder de plus que nécessaire.',
	'footer.legal': 'Légal',
	'footer.operator': 'Opérateur',
	'footer.unaffiliated': 'Non affilié à Discord Inc. ni à 42.',
	'footer.privacy': 'Confidentialité',
	'footer.terms': 'Conditions d’utilisation',
} as const;
