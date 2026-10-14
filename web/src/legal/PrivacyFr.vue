<script setup lang="ts">
import { computed } from 'vue';
import { useMetaStore } from '@/stores/meta';

const meta = useMetaStore();
const operator = computed(() => meta.meta?.operator.name ?? 'l’opérateur de cette instance');
const contact = computed(() => meta.meta?.operator.contact ?? null);
const hosting = computed(() => meta.meta?.hosting ?? null);
</script>

<template>
	<p>
		Ce bot réserve l’accès d’un serveur Discord aux personnes qui possèdent un compte valide sur
		l’intranet de 42. Cette page explique quelles données il traite, pourquoi, combien de temps,
		et comment exercer vos droits.
	</p>

	<h2>Qui est responsable</h2>
	<p>
		Les <strong>administrateurs de chaque serveur Discord</strong> qui ajoutent et configurent
		le bot sont responsables du traitement pour leur serveur : ce sont eux qui décident de
		filtrer l’accès et choisissent les règles appliquées.
	</p>
	<p>
		<strong>{{ operator }}</strong> exploite cette instance et agit comme
		<strong>sous-traitant</strong> (article 28 du RGPD) pour le compte de ces administrateurs.
		<template v-if="hosting"> Hébergement : {{ hosting }}.</template>
		<template v-if="contact">
			Contact :
			<a :href="contact.includes('@') ? `mailto:${contact}` : contact">{{ contact }}</a
			>.
		</template>
	</p>

	<h2>Données des membres conservées</h2>
	<p>Lorsqu’un membre se vérifie avec succès, le bot enregistre :</p>
	<ul>
		<li>son identifiant Discord ;</li>
		<li>l’identifiant numérique et le login de son compte 42 ;</li>
		<li>l’identifiant du serveur Discord concerné ;</li>
		<li>
			la date de la vérification, celle du dernier contrôle de présence sur le serveur et
			celle du dernier contrôle du compte 42.
		</li>
	</ul>

	<h2>Données lues sans être conservées</h2>
	<p>
		Pendant la vérification, le bot lit le profil 42 public (nom, campus, cursus en cours,
		statut actif, alumni ou staff) pour appliquer les règles du serveur, et la liste des
		coalitions si le serveur attribue des rôles par coalition. Seul le scope
		<code>public</code> est demandé à 42. Le jeton d’accès 42 n’est jamais stocké : il est
		utilisé puis oublié dans la même requête.
	</p>
	<p>
		Ensuite, <strong>une fois par semaine</strong>, le bot relit ce même profil public avec le
		jeton de son application 42, pour vérifier que le compte remplit toujours les règles du
		serveur et mettre à jour les rôles supplémentaires. Rien de plus n’est conservé : seul le
		login est mis à jour s’il a changé.
	</p>
	<p>
		Votre adresse IP sert, en mémoire et pendant une minute, à limiter le nombre de requêtes.
		Elle n’est jamais enregistrée.
	</p>

	<h2>Selon la configuration du serveur</h2>
	<ul>
		<li>
			le pseudo Discord du membre peut être remplacé par son login 42, ou par « Prénom Nom
			(login) » ;
		</li>
		<li>
			des rôles supplémentaires peuvent être donnés selon le campus, le cursus en cours ou la
			coalition : ils rendent cette information visible des autres membres du serveur ;
		</li>
		<li>
			un message de journal (identifiant Discord, login 42, campus, motif d’un éventuel refus)
			peut être publié dans un salon du serveur. Ces messages sont stockés par Discord, sous
			la responsabilité des administrateurs du serveur, qui en fixent la durée de
			conservation.
		</li>
	</ul>

	<h2>Administrateurs utilisant ce tableau de bord</h2>
	<p>
		À la connexion, le tableau de bord reçoit de Discord votre identifiant, votre nom
		d’utilisateur, votre avatar et la liste des serveurs que vous gérez. Ils sont gardés dans
		une session de
		<strong>24 heures maximum</strong>. Un seul cookie est utilisé, strictement nécessaire au
		fonctionnement de la session. Aucun cookie de mesure d’audience, aucune publicité, aucune
		revente de données. La langue et le thème choisis sont gardés dans votre navigateur
		seulement.
	</p>
	<p>
		Les administrateurs voient dans le tableau de bord la liste des membres vérifiés de leur
		serveur : identifiant Discord, login 42 et date de vérification.
	</p>

	<h2>Finalités et base légale</h2>
	<ul>
		<li>réserver l’accès d’un serveur aux comptes 42 valides ;</li>
		<li>
			empêcher qu’un même compte 42 serve à plusieurs comptes Discord sur un même serveur ;
		</li>
		<li>
			attribuer, si le serveur le demande, des rôles selon le campus, le cursus ou la
			coalition ;
		</li>
		<li>retirer l’accès à un compte qui ne remplit plus les règles du serveur.</li>
	</ul>
	<p>
		Base légale : l’<strong>intérêt légitime</strong> de la communauté du serveur (article 6-1-f
		du RGPD). C’est le membre qui déclenche lui-même la vérification.
	</p>

	<h2>Durées de conservation</h2>
	<ul>
		<li>
			le lien Discord ↔ 42 est conservé tant que le membre est sur le serveur et que le bot y
			est présent ;
		</li>
		<li>
			la présence des membres est contrôlée en continu : le lien est supprimé dans les
			<strong>7 jours</strong> suivant le départ du membre ;
		</li>
		<li>
			immédiatement si le membre utilise la commande <code>/forget</code> sur le serveur, ou
			si un administrateur le délie depuis le tableau de bord ;
		</li>
		<li>
			lors du contrôle hebdomadaire, si le compte 42 a été fermé ou ne remplit plus les règles
			du serveur (alumni, autre campus) ;
		</li>
		<li>
			dans les <strong>24 heures</strong> suivant le retrait du bot d’un serveur, ou
			immédiatement si un administrateur supprime les données depuis le tableau de bord ;
		</li>
		<li>les sauvegardes chiffrées sont conservées <strong>7 jours</strong> au maximum ;</li>
		<li>
			les journaux techniques ne contiennent pas de données personnelles et tournent
			rapidement.
		</li>
	</ul>

	<h2>Destinataires</h2>
	<p>
		Les administrateurs du serveur concerné et l’opérateur de cette instance. Les données sont
		stockées sur un serveur dédié loué à <strong>OVHcloud</strong>, à Roubaix (France), qui agit
		comme sous-traitant et n’y accède pas. Aucune donnée ne quitte l’Union européenne du fait de
		l’opérateur. Discord et 42 sont des responsables de traitement indépendants pour les données
		qu’ils détiennent : voir la
		<a href="https://discord.com/privacy" rel="noopener noreferrer">politique de Discord</a>
		et la
		<a href="https://www.42.fr/" rel="noopener noreferrer">politique de 42 Network</a>.
	</p>

	<h2>Vos droits</h2>
	<p>
		Vous disposez d’un droit d’accès, de rectification, d’effacement, d’opposition, de
		limitation et de portabilité. Pour effacer vos données sur un serveur, utilisez
		<code>/forget</code> sur ce serveur. Pour toute autre demande, adressez-vous aux
		administrateurs du serveur ou à l’opérateur<template v-if="contact">
			(<a :href="contact.includes('@') ? `mailto:${contact}` : contact">{{ contact }}</a
			>)</template
		>. Vous pouvez aussi adresser une réclamation à la
		<a href="https://www.cnil.fr/fr/plaintes" rel="noopener noreferrer">CNIL</a>.
	</p>

	<h2>Sécurité</h2>
	<ul>
		<li>toutes les connexions passent en HTTPS ;</li>
		<li>la base de données n’est pas exposée sur le réseau ;</li>
		<li>les secrets sont gardés hors du code source ;</li>
		<li>les liens de vérification sont signés et ne sont valables que 5 minutes ;</li>
		<li>le nombre de requêtes par adresse est limité.</li>
	</ul>
</template>
