import type { RuleKind } from '@shared/api';

/** Every string of the dashboard, in French. `en.ts` has the same shape, checked by `Messages`. */
export const fr = {
	appName: '42 Auth',
	loading: 'Chargement…',
	retry: 'Réessayer',
	back: 'Retour aux serveurs',
	skip: 'Aller au contenu',
	crumb: 'Fil d’Ariane',
	'theme.toLight': 'Passer au thème clair',
	'theme.toDark': 'Passer au thème sombre',
	'locale.label': 'Langue',

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
			text: 'Vous publiez le panneau depuis le dashboard ou avec /panel. Les membres cliquent sur « Se vérifier ».',
		},
		{
			n: '02',
			title: 'L’intra',
			text: 'Ils se connectent avec leur compte 42. Le bot vérifie qu’il est actif et, si vous le voulez, du bon campus.',
		},
		{
			n: '03',
			title: 'Le rôle',
			text: 'Le rôle est donné, plus ceux de son campus, de son cursus, de sa coalition, de son niveau ou de ses projets. Tout est revérifié chaque semaine.',
		},
	],
	'landing.login': 'Se connecter avec Discord',
	'landing.invite': 'Ajouter le bot',

	'header.logout': 'Se déconnecter',
	'header.login': 'Se connecter',
	'guilds.eyebrow': 'Dashboard',
	'guilds.title': 'Vos',
	'guilds.titleAccent': 'serveurs',
	'guilds.list': 'Serveurs',
	'guilds.present': 'Bot actif',
	'guilds.hint':
		'Seuls les serveurs où vous avez la permission « Gérer le serveur » apparaissent.',
	'guilds.empty': 'Aucun serveur à gérer. Il vous faut la permission « Gérer le serveur ».',
	'guilds.configure': 'Configurer',
	'guilds.add': 'Ajouter le bot',
	'guilds.absent': 'Bot absent',

	'settings.eyebrow': 'Réglages du serveur',
	'tabs.label': 'Sections du serveur',
	'tabs.settings': 'Réglages',
	'tabs.members': 'Membres',
	'settings.verified': (n: number): string => (n > 1 ? 'membres vérifiés' : 'membre vérifié'),
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
	'settings.campus.any': 'Tous les campus',
	'settings.students': 'Étudiants actifs uniquement',
	'settings.students.help':
		'Refuse les alumni. Les comptes fermés sont toujours refusés ; le staff est toujours accepté. Revérifié chaque semaine : un membre devenu alumni perd le rôle.',
	'settings.helpers': 'Entraide au campus',
	'settings.helpers.help':
		'Permet aux membres vérifiés de taper /helpers minishell pour voir qui, sur le serveur, est au campus en ce moment et a validé le projet, avec son poste. Chaque membre peut se masquer avec /visibility.',
	'settings.nickname': 'Pseudo des membres vérifiés',
	'settings.nickname.help':
		'Le nom affiché sur le serveur après la vérification. Le login devient visible de tous les membres.',
	'settings.nickname.off': 'Inchangé',
	'settings.nickname.offExample': 'pseudo actuel',
	'settings.nickname.login': 'Login de l’intra',
	'settings.nickname.full': 'Nom complet et login',
	'settings.logs': 'Salon de journal',
	'settings.logs.none': 'Aucun',
	'settings.logs.help':
		'Un message par tentative (acceptée ou refusée) et par vérification retirée lors du contrôle hebdomadaire : ID Discord, login 42, campus, motif.',
	'settings.logs.retention':
		'Ces messages restent dans Discord, sous la responsabilité des admins du serveur. Supprimez-les selon votre politique de conservation — 3 mois maximum est une durée raisonnable.',
	'settings.rules': 'Rôles supplémentaires',
	'settings.rules.help':
		'Donnés en plus du rôle vérifié, aux membres qui remplissent la condition. Revérifiés chaque semaine : le rôle de piscine part quand la piscine se termine, un rôle de niveau arrive dès qu’il est atteint.',
	'settings.rules.kind': 'Condition',
	'settings.rules.value': 'Valeur',
	'settings.rules.role': 'Rôle donné',
	'settings.rules.pickRole': 'Choisir un rôle',
	'settings.rules.kinds': {
		campus: 'Campus',
		cursus: 'Cursus en cours',
		coalition: 'Coalition',
		level: 'Niveau minimum',
		project: 'Projet validé',
		pool: 'Piscine',
	} satisfies Record<RuleKind, string>,
	'settings.rules.placeholders': {
		campus: 'Paris',
		cursus: '42cursus ou c-piscine',
		coalition: 'The Order',
		level: '10',
		project: 'minishell',
		pool: '2025 ou 2025-07',
	} satisfies Record<RuleKind, string>,
	'settings.rules.add': 'Ajouter une règle',
	'settings.rules.remove': (n: number) => `Retirer la règle ${String(n)}`,
	'settings.rules.rule': (n: number) => `Règle ${String(n)}`,
	'settings.rules.empty': 'Aucune règle : seul le rôle vérifié est donné.',
	'settings.rules.max': 'Vous avez atteint le maximum de 25 règles.',
	'settings.rules.invalid': (n: number) =>
		`La règle ${String(n)} a été refusée : valeur vide ou mal formée (un niveau est un nombre, une piscine s’écrit 2025 ou 2025-07), ou rôle que le bot ne peut pas donner.`,
	'settings.dirty': 'Modifications non enregistrées',
	'settings.clean': 'Tout est enregistré',
	'settings.reset': 'Annuler',
	'settings.save': 'Enregistrer',
	'settings.saving': 'Enregistrement…',
	'settings.leaveConfirm': 'Des modifications ne sont pas enregistrées. Quitter quand même ?',
	'settings.saved': 'Réglages enregistrés.',
	'settings.invalid': 'Ce champ a été refusé par le serveur.',
	'settings.error': 'L’enregistrement a échoué. Réessayez.',

	'panel.title': 'Panneau de vérification',
	'panel.help':
		'Publie le message avec le bouton « Se vérifier » dans un salon, comme /panel. Il reste valable pour toujours.',
	'panel.channel': 'Salon',
	'panel.pick': 'Choisir un salon',
	'panel.post': 'Publier le panneau',
	'panel.posting': 'Publication…',
	'panel.posted': (name: string) => `Panneau publié dans #${name}.`,
	'panel.cannotPost':
		'Le bot n’a pas pu écrire dans ce salon. Vérifiez qu’il peut le voir et y envoyer des messages.',
	'panel.error': 'La publication a échoué. Réessayez.',
	'panel.needsRole':
		'Choisissez et enregistrez d’abord un rôle : sans lui, le bouton répond que le serveur n’est pas configuré.',

	'members.title': 'Membres vérifiés',
	'members.help':
		'Le lien Discord ↔ 42 de chaque membre. Délier retire le lien, les rôles et le pseudo donnés par le bot ; le membre peut se revérifier.',
	'members.search': 'Rechercher',
	'members.searchPlaceholder': 'Login 42 ou ID Discord',
	'members.login': 'Login 42',
	'members.discord': 'ID Discord',
	'members.date': 'Vérifié le',
	'members.actions': 'Actions',
	'members.empty': 'Aucun membre vérifié pour l’instant.',
	'members.noMatch': 'Aucun membre ne correspond à cette recherche.',
	'members.unlink': 'Délier',
	'members.unlinkLabel': (login: string) => `Délier ${login}`,
	'members.confirm': 'Confirmer',
	'members.confirmLabel': (login: string) => `Confirmer : délier ${login}`,
	'members.cancel': 'Annuler',
	'members.unlinked': (login: string) => `${login} a été délié.`,
	'members.unlinkError': 'Impossible de délier ce membre. Réessayez.',
	'members.loadError': 'Impossible de charger les membres.',
	'members.copy': (id: string) => `Copier l’ID ${id}`,
	'members.copied': 'ID copié.',
	'members.prev': 'Précédent',
	'members.next': 'Suivant',
	'members.page': (page: number, pages: number) => `Page ${String(page)} sur ${String(pages)}`,
	'members.total': (n: number): string =>
		n > 1 ? `${String(n)} membres` : `${String(n)} membre`,

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
	'error.rateLimited': 'Trop de requêtes. Patientez une minute avant de réessayer.',

	'footer.tagline':
		'Réserve un serveur Discord aux comptes de l’intra 42, sans rien garder de plus que nécessaire.',
	'footer.legal': 'Légal',
	'footer.operator': 'Opérateur',
	'footer.unaffiliated': 'Non affilié à Discord Inc. ni à 42.',
	'footer.privacy': 'Confidentialité',
	'footer.terms': 'Conditions d’utilisation',

	'legal.privacy': 'Politique de confidentialité',
	'legal.terms': 'Conditions d’utilisation',
	'legal.updated': 'Dernière mise à jour :',

	date: (iso: string) =>
		new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(iso)),
};

/** The shape every language must fill in. */
export type Messages = typeof fr;
