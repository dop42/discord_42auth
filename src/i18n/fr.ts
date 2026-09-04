import type { Messages } from './types';

export const fr: Messages = {
	'cmd.auth': 'Vérifie ton compte 42 pour accéder à ce serveur',
	'cmd.config': "Afficher la configuration de l'authentification 42 de ce serveur",
	'cmd.panel': 'Publier le panneau de vérification dans ce salon',

	'error.notInGuild': 'Cette commande ne fonctionne que dans un serveur.',
	'error.wrongGuild': 'Ce bot est configuré pour un autre serveur.',
	'error.unknown': "Une erreur est survenue. Demande à un admin de consulter les logs du déploiement.",

	'auth.notConfigured': "Ce serveur n'est pas encore configuré — un admin doit définir `ROLE_ID` sur le déploiement.",
	'auth.notice': "Connecte-toi avec le bouton ci-dessous. Ce lien est personnel et expire dans 5 minutes — ne le partage jamais.",
	'auth.button': "Se connecter sur l'intra 42",

	'panel.title': 'Vérification 42',
	'panel.body': 'Lie ton compte 42 pour accéder à ce serveur.',
	'panel.button': 'Se vérifier',

	'config.noPermission': 'Il te faut la permission **Gérer le serveur** pour voir la configuration.',

	'show.role': 'Rôle',
	'show.role.unset': '_non défini, `/auth` est désactivé_',
	'show.campus': 'Campus',
	'show.campus.any': '_tous_',
	'show.students': 'Étudiants actifs uniquement',
	'show.nickname': 'Pseudo',
	'show.nickname.off': 'inchangé',
	'show.nickname.login': 'login intra (`jdoe`)',
	'show.nickname.full': 'nom complet + login (`John Doe (jdoe)`)',
	'show.logs': 'Salon de logs',
	'show.logs.none': '_aucun_',
	'show.yes': 'oui',
	'show.no': 'non',
	'show.hint': "Ces réglages viennent des variables d'environnement — modifie-les sur Vercel, puis redéploie.",

	'rule.inactive': "Ce compte 42 n'est pas actif (alumni ou compte fermé).",
	'rule.wrongCampus': 'Ce serveur est réservé au campus {campus}, le tien est {userCampus}.',

	'page.cancelled.title': 'Authentification annulée',
	'page.cancelled.body': "Tu as refusé l'accès à ton compte 42.",
	'page.invalid.title': 'Lien invalide',
	'page.invalid.body': 'Ce lien a expiré ou est malformé. Relance /auth.',
	'page.refused.title': 'Accès refusé',
	'page.notConfigured.title': 'Serveur non configuré',
	'page.notConfigured.body': "Aucun rôle n'est configuré. Demande à un admin de définir ROLE_ID sur le déploiement.",
	'page.failed.title': "Échec de l'authentification",
	'page.failed.body': 'Une erreur est survenue de notre côté. Réessaie dans un instant.',

	'log.ok': 'Authentification réussie',
	'log.refused': 'Authentification refusée',
	'log.discord': 'Discord',
	'log.account': 'Compte 42',
	'log.campus': 'Campus',
	'log.reason': 'Motif',
	'log.unknown': 'inconnu',
};
