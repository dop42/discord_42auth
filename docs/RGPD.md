# RGPD

Ce document fait le point sur la conformité du bot au RGPD pour une instance
hébergée par un opérateur au service de plusieurs serveurs Discord. Il tient
lieu de registre des traitements pour l'opérateur. Ce n'est pas un avis
juridique : pour un service qui grossit, une relecture par un juriste reste
conseillée.

---

## Qui est qui

| Rôle | Qui | Pourquoi |
| --- | --- | --- |
| Responsable du traitement | Les admins de chaque serveur Discord | Ils décident de filtrer l'accès à leur serveur et choisissent les règles |
| Sous-traitant (art. 28) | L'opérateur de l'instance (`OPERATOR_NAME`) | Il exécute le traitement selon la configuration choisie par l'admin |
| Responsables indépendants | Discord, 42 | Sources des données, avec leurs propres politiques |

Les clauses de l'article 28 (traiter uniquement sur instruction, confidentialité,
sécurité, pas de sous-traitant ultérieur, assistance pour les droits,
notification des violations, suppression en fin de service) sont reprises dans
`/terms`, que l'admin accepte en ajoutant le bot.

---

## Ce qui a été corrigé

| Point | Avant | Maintenant |
| --- | --- | --- |
| Information des personnes (art. 13) | Aucune | Le panneau et le message de vérification indiquent ce qui est conservé, combien de temps, comment l'effacer, et renvoient vers `/privacy` |
| Politique de confidentialité et CGU | Absentes | `/privacy` et `/terms`, avec l'identité et le contact de l'opérateur |
| Droit à l'effacement (art. 17) | Impossible | `/forget` pour le membre, « Supprimer toutes les données » pour l'admin |
| Limitation de la conservation (art. 5-1-e) | Logs Discord sans limite, rien d'autre | Lien supprimé quand le membre quitte le serveur ou quand le bot est retiré (vérification horaire), sessions de 24 h, sauvegardes de 7 jours |
| Minimisation (art. 5-1-c) | Déjà bonne : scope `public`, aucun jeton stocké | Inchangée. Seuls l'ID Discord, l'ID 42 et le login sont stockés, jamais le nom ni le campus |
| Cloisonnement | Une instance par serveur | Liens rangés par serveur : un lien fait sur un serveur n'est ni visible ni réutilisé sur un autre |
| Logs techniques | Contenaient l'ID Discord (`Could not rename …`) | Plus aucun identifiant de personne. Rotation de 10 Mo × 3 par conteneur. Pas de log d'accès Caddy, donc aucune IP gardée |
| Exactitude (art. 5-1-d) | Vérification faite une fois pour toutes | Profil 42 relu chaque semaine avec le jeton de l'application : un compte fermé, devenu alumni ou parti du campus perd le rôle, et les rôles par campus, cursus ou coalition suivent |
| Sécurité (art. 32) | Vercel | HTTPS + HSTS, limitation du débit par adresse (IP gardée une minute en mémoire, jamais écrite), base sans port publié, cookie de session dont seul le hash est stocké, `HttpOnly` + `Secure` + `SameSite`, contrôle de l'`Origin`, CSP stricte, conteneur en lecture seule sans capacités, sauvegardes chiffrées |
| Cookies (ePrivacy) | — | Un seul cookie de session, strictement nécessaire, réservé aux admins : pas de bandeau requis. Aucun traceur ni ressource tierce, à part le CDN Discord pour les avatars |

---

## Registre des traitements (art. 30-2, sous-traitant)

| Rubrique | Contenu |
| --- | --- |
| Sous-traitant | `OPERATOR_NAME`, `OPERATOR_CONTACT` |
| Responsables | Les admins de chaque serveur Discord ayant ajouté le bot |
| Catégories de traitement | 1. Vérification d'appartenance à 42 et attribution d'un rôle. 2. Connexion des admins au dashboard |
| Personnes concernées | Membres des serveurs qui se vérifient, admins des serveurs |
| Données | 1. ID Discord, ID et login 42, ID du serveur, dates de vérification et des contrôles. Lus sans être gardés : profil 42 public (campus, cursus, statut) et coalitions si le serveur s'en sert. 2. ID Discord, nom d'utilisateur, avatar, liste des serveurs gérés |
| Transferts hors UE | Aucun de la part de l'opérateur (hébergement : `HOSTING_LOCATION`) |
| Durées | 1. Tant que le membre est sur le serveur, que le bot y est et que le compte 42 remplit les règles (7 jours max après un départ, contrôle du compte 42 chaque semaine). 2. 24 h |
| Sécurité | Voir « Sécurité » ci-dessus |

---

## Ce qu'il te reste à faire, hors code

- [ ] **Remplir `OPERATOR_NAME`, `OPERATOR_CONTACT`, `HOSTING_LOCATION`** avec des valeurs réelles. `/privacy` les affiche.
- [ ] **Mentions légales (LCEN, art. 6-III).** Un site édité par un particulier doit nommer son hébergeur. En auto-hébergement, c'est toi : nom, et une adresse de contact.
- [ ] **Chiffrer le disque** de la machine (LUKS), ou au moins le volume Docker de la base.
- [ ] **Durcir la machine** : mises à jour automatiques, SSH par clé uniquement, pare-feu n'ouvrant que 22, 80 et 443.
- [ ] **Copier les sauvegardes hors de la machine**, chiffrées comme elles le sont déjà. La phrase de passe doit être conservée ailleurs.
- [ ] **Procédure en cas de violation** (art. 33) : prévenir les admins des serveurs concernés sans délai. C'est à eux de notifier la CNIL sous 72 h si nécessaire.
- [ ] **Déclarer les URLs** `/privacy` et `/terms` dans le portail développeur Discord.
- [ ] **Conditions de l'API 42** : vérifier que l'usage d'une application tierce sur l'intra est autorisé pour ton campus et que la redirect URI est bien déclarée.

## Ce qui reste à la charge des admins de serveur

- **Le salon de logs.** Les messages restent dans Discord, hors de portée du bot. L'admin doit les supprimer selon sa propre politique ; le dashboard suggère 3 mois au maximum.
- **Le pseudo.** En mode `login` ou `full`, le login 42 du membre devient visible de tout le serveur. C'est un choix de configuration de l'admin, annoncé aux membres sur `/privacy`.
- **Les rôles supplémentaires.** Un rôle par campus, cursus ou coalition rend cette information visible des autres membres. Même logique : choix de l'admin, annoncé sur `/privacy`.
- **L'onglet Membres.** Il montre à tous les admins du serveur l'ID Discord et le login 42 de chaque membre vérifié. Délier un membre depuis cet onglet vaut effacement, comme `/forget`.
