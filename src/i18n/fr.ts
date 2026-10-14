import type { Messages } from './types';

export const fr: Messages = {
	'cmd.config': "Afficher la configuration de l'authentification 42 de ce serveur",
	'cmd.panel': 'Publier le panneau de vérification dans ce salon',
	'cmd.forget': 'Effacer ton lien 42 sur ce serveur et rendre le rôle vérifié',

	'error.notInGuild': 'Cette commande ne fonctionne que dans un serveur.',
	'error.unknown': 'Une erreur est survenue. Réessaie dans un instant.',

	'auth.notConfigured': 'Ce serveur n\'est pas encore configuré — un admin doit choisir un rôle sur le dashboard.',
	'auth.notice': "Connecte-toi avec le bouton ci-dessous. Ce lien est personnel et expire dans 5 minutes — ne le partage jamais.",
	'auth.privacy': 'La vérification lie ton compte Discord à ton identifiant et ton login 42 tant que tu restes sur ce serveur. `/forget` l\'efface. [Confidentialité]({privacy})',
	'auth.button': "Se connecter sur l'intra 42",

	'panel.title': 'Vérification 42',
	'panel.body': 'Lie ton compte 42 pour accéder à ce serveur.',
	'panel.button': 'Se vérifier',

	'config.noPermission': 'Il te faut la permission **Gérer le serveur** pour voir la configuration.',
	'forget.done': 'Ton lien 42 sur ce serveur est effacé et le rôle vérifié retiré.',
	'forget.none': 'Aucun compte 42 n\'est lié à toi sur ce serveur.',
	'forget.roleKept': 'Ton lien 42 est effacé, mais le rôle vérifié n\'a pas pu être retiré — demande à un admin.',

	'show.role': 'Rôle',
	'show.role.unset': '_non défini, la vérification est désactivée_',
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
	'show.hint': 'Modifie ces réglages sur le dashboard : {url}',

	'rule.inactive': "Ce compte 42 n'est pas actif (alumni ou compte fermé).",
	'rule.wrongCampus': 'Ce serveur est réservé au campus {campus}, le tien est {userCampus}.',
	'rule.alreadyLinked': 'Ce compte 42 est déjà lié à un autre membre de ce serveur.',

	'page.cancelled.title': 'Authentification annulée',
	'page.cancelled.body': "Tu as refusé l'accès à ton compte 42.",
	'page.invalid.title': 'Lien invalide',
	'page.invalid.body': 'Ce lien a expiré ou est malformé. Reclique sur le bouton de vérification.',
	'page.refused.title': 'Accès refusé',
	'page.notConfigured.title': 'Serveur non configuré',
	'page.notConfigured.body': 'Aucun rôle n\'est configuré. Demande à un admin d\'en choisir un sur le dashboard.',
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
