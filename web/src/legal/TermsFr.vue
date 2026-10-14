<script setup lang="ts">
import { computed } from 'vue';
import { useMetaStore } from '@/stores/meta';

const meta = useMetaStore();
const operator = computed(() => meta.meta?.operator.name ?? 'l’opérateur de cette instance');
const contact = computed(() => meta.meta?.operator.contact ?? null);
</script>

<template>
	<p>
		Ces conditions s’appliquent à tout administrateur qui ajoute le bot à un serveur Discord ou
		utilise ce tableau de bord. Ajouter le bot vaut acceptation de ces conditions.
	</p>

	<h2>Le service</h2>
	<p>
		Le service est <strong>gratuit</strong> et fourni <strong>en l’état</strong>, sans garantie
		de disponibilité, de continuité ni d’adéquation à un besoin particulier. {{ operator }} peut
		le modifier ou l’interrompre à tout moment.
	</p>

	<h2>Vos engagements d’administrateur</h2>
	<p>
		Pour votre serveur, vous êtes <strong>responsable du traitement</strong> au sens du RGPD. À
		ce titre, vous vous engagez à :
	</p>
	<ul>
		<li>
			informer les membres de votre serveur du traitement — le panneau de vérification renvoie
			vers la
			<RouterLink to="/privacy">politique de confidentialité</RouterLink> ;
		</li>
		<li>
			gérer la conservation des messages de votre salon de journal, si vous en configurez un ;
		</li>
		<li>
			répondre aux demandes de vos membres concernant leurs données, par exemple en les
			déliant depuis l’onglet Membres ;
		</li>
		<li>
			ne pas utiliser le bot de manière abusive : contourner ses limites, l’utiliser pour
			collecter des données à d’autres fins que le contrôle d’accès, ou perturber le service.
		</li>
	</ul>

	<h2>Engagements de l’opérateur (article 28 du RGPD)</h2>
	<p>En tant que sous-traitant, {{ operator }} s’engage à :</p>
	<ul>
		<li>traiter les données uniquement selon la configuration que vous choisissez ;</li>
		<li>en garantir la confidentialité ;</li>
		<li>
			appliquer les mesures de sécurité décrites dans la
			<RouterLink to="/privacy">politique de confidentialité</RouterLink> ;
		</li>
		<li>
			ne recourir qu’à un seul sous-traitant ultérieur, l’hébergeur
			<strong>OVHcloud</strong>, qui fournit le serveur dédié à Roubaix (France) et est lié
			par un accord de traitement conforme à l’article 28 ; vous prévenir avant tout
			changement ;
		</li>
		<li>vous aider à répondre aux demandes d’exercice des droits de vos membres ;</li>
		<li>vous notifier toute violation de données sans délai injustifié ;</li>
		<li>
			supprimer les données de votre serveur à la fin du service, c’est-à-dire lorsque le bot
			en est retiré.
		</li>
	</ul>

	<h2>Hébergeur</h2>
	<p>OVH SAS, 2 rue Kellermann, 59100 Roubaix, France — +33 9 72 10 10 07.</p>

	<h2>Suspension</h2>
	<p>En cas d’abus, l’opérateur peut retirer le bot d’un serveur sans préavis.</p>

	<h2>Contact</h2>
	<p>
		{{ operator
		}}<template v-if="contact">
			—
			<a :href="contact.includes('@') ? `mailto:${contact}` : contact">{{
				contact
			}}</a></template
		>.
	</p>
</template>
