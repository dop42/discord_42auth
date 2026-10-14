<script setup lang="ts">
import { computed } from 'vue';
import { useMetaStore } from '@/stores/meta';

const meta = useMetaStore();
const operator = computed(() => meta.meta?.operator.name ?? 'the operator of this instance');
const contact = computed(() => meta.meta?.operator.contact ?? null);
</script>

<template>
	<p>
		These terms apply to every admin who adds the bot to a Discord server or uses this
		dashboard. Adding the bot means accepting these terms.
	</p>

	<h2>The service</h2>
	<p>
		The service is <strong>free</strong> and provided <strong>as is</strong>, with no guarantee
		of availability, continuity or fitness for a particular purpose. {{ operator }} may change
		or stop it at any time.
	</p>

	<h2>Your commitments as an admin</h2>
	<p>
		For your server, you are the <strong>controller</strong> within the meaning of the GDPR. As
		such, you commit to:
	</p>
	<ul>
		<li>
			inform your server's members of the processing — the verification panel links to the
			<RouterLink to="/privacy">privacy policy</RouterLink>;
		</li>
		<li>manage the retention of your log channel's messages, if you configure one;</li>
		<li>
			answer your members' requests about their data, for instance by unlinking them from the
			Members tab;
		</li>
		<li>
			not abuse the bot: work around its limits, use it to collect data for anything other
			than access control, or disrupt the service.
		</li>
	</ul>

	<h2>The operator's commitments (article 28 of the GDPR)</h2>
	<p>As a processor, {{ operator }} commits to:</p>
	<ul>
		<li>process the data only according to the configuration you choose;</li>
		<li>keep it confidential;</li>
		<li>
			apply the security measures described in the
			<RouterLink to="/privacy">privacy policy</RouterLink>;
		</li>
		<li>
			use a single sub-processor, the host <strong>OVHcloud</strong>, which provides the
			dedicated server in Roubaix (France) and is bound by a data processing agreement under
			article 28; tell you before any change;
		</li>
		<li>help you answer your members' requests to exercise their rights;</li>
		<li>notify you of any data breach without undue delay;</li>
		<li>
			delete your server's data at the end of the service, that is when the bot is removed.
		</li>
	</ul>

	<h2>Host</h2>
	<p>OVH SAS, 2 rue Kellermann, 59100 Roubaix, France — +33 9 72 10 10 07.</p>

	<h2>Suspension</h2>
	<p>In case of abuse, the operator may remove the bot from a server without notice.</p>

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
