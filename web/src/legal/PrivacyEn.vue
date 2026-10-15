<script setup lang="ts">
import { computed } from 'vue';
import { useMetaStore } from '@/stores/meta';

const meta = useMetaStore();
const operator = computed(() => meta.meta?.operator.name ?? 'the operator of this instance');
const contact = computed(() => meta.meta?.operator.contact ?? null);
const hosting = computed(() => meta.meta?.hosting ?? null);
</script>

<template>
	<p>
		This bot keeps a Discord server for people who hold a valid account on the 42 intranet. This
		page explains which data it processes, why, for how long, and how to exercise your rights.
	</p>

	<h2>Who is responsible</h2>
	<p>
		The <strong>admins of each Discord server</strong> who add and configure the bot are the
		controllers for their server: they decide to restrict access and choose the rules applied.
	</p>
	<p>
		<strong>{{ operator }}</strong> runs this instance and acts as a
		<strong>processor</strong> (article 28 of the GDPR) on behalf of those admins.
		<template v-if="hosting"> Hosting: {{ hosting }}.</template>
		<template v-if="contact">
			Contact:
			<a :href="contact.includes('@') ? `mailto:${contact}` : contact">{{ contact }}</a
			>.
		</template>
	</p>

	<h2>Member data kept</h2>
	<p>When a member verifies successfully, the bot records:</p>
	<ul>
		<li>their Discord ID;</li>
		<li>the numeric ID and the login of their 42 account;</li>
		<li>the ID of the Discord server concerned;</li>
		<li>
			the date of the verification, of the last check that they are still in the server, and
			of the last check of the 42 account;
		</li>
		<li>
			whether they chose, with <code>/visibility</code>, not to appear in
			<code>/helpers</code>.
		</li>
	</ul>

	<h2>Data read without being kept</h2>
	<p>
		During verification, the bot reads the public 42 profile (name, campus, cursus and level,
		validated projects, piscine, active, alumni or staff status) to apply the server's rules,
		and the list of coalitions if the server grants roles by coalition. Only the
		<code>public</code> scope is requested from 42. The 42 access token is never stored: it is
		used and forgotten within the same request.
	</p>
	<p>
		Then, <strong>once a week</strong>, the bot reads that same public profile again with its 42
		application's token, to check the account still meets the server's rules and to update the
		extra roles. Nothing more is kept: only the login is updated if it changed.
	</p>
	<p>
		The <code>/profile</code> command reads that public profile again when it is used, to show a
		card (picture, campus, level, projects, seat taken on campus, piscine) to whoever asked, and
		to them alone. Only verified members of the server, admins included, can see another
		member's card; the cursus deadline, the evaluation points and the wallet are shown to the
		member themselves only. Nothing from that read is kept.
	</p>
	<p>
		If the server's admins turn it on, the <code>/helpers</code> command shows a verified member
		who asked, and them alone, the server's members logged in on their campus right now who
		validated a given project, with their seat and mark. The campus seats are kept
		<strong>two minutes in memory</strong> to limit calls to 42, then forgotten; nothing of them
		is written to the database. Any member can stop appearing with <code>/visibility</code>.
	</p>
	<p>
		Your IP address is used, in memory and for one minute, to limit the number of requests. It
		is never recorded.
	</p>

	<h2>Depending on the server's configuration</h2>
	<ul>
		<li>
			the member's Discord nickname can be replaced with their 42 login, or with “First Last
			(login)”;
		</li>
		<li>
			extra roles can be granted by campus, current cursus, coalition, level, validated
			project or piscine: they make that information visible to the server's other members;
		</li>
		<li>
			a log message (Discord ID, 42 login, campus, reason of a refusal) can be posted in a
			channel of the server. Those messages are stored by Discord, under the responsibility of
			the server's admins, who set how long they are kept.
		</li>
	</ul>

	<h2>Admins using this dashboard</h2>
	<p>
		On login, the dashboard receives from Discord your ID, your username, your avatar and the
		list of servers you manage. They are kept in a session of
		<strong>24 hours at most</strong>. A single cookie is used, strictly necessary for the
		session. No analytics cookie, no advertising, no sale of data. The language and theme you
		pick are kept in your browser only.
	</p>
	<p>
		Admins see in the dashboard the list of their server's verified members: Discord ID, 42
		login and verification date.
	</p>

	<h2>Purposes and legal basis</h2>
	<ul>
		<li>keeping a server's access for valid 42 accounts;</li>
		<li>preventing one 42 account from serving several Discord accounts in one server;</li>
		<li>
			granting, if the server asks for it, roles by campus, cursus, coalition, level,
			validated project or piscine;
		</li>
		<li>removing access from an account that no longer meets the server's rules.</li>
	</ul>
	<p>
		Legal basis: the <strong>legitimate interest</strong> of the server's community (article
		6(1)(f) of the GDPR). The member starts the verification themselves.
	</p>

	<h2>Retention</h2>
	<ul>
		<li>
			the Discord ↔ 42 link is kept as long as the member is in the server and the bot is in
			it;
		</li>
		<li>
			members' presence is checked continuously: the link is deleted within
			<strong>7 days</strong> of the member leaving;
		</li>
		<li>
			immediately if the member runs the <code>/forget</code> command in the server, or if an
			admin unlinks them from the dashboard;
		</li>
		<li>
			at the weekly check, if the 42 account was closed or no longer meets the server's rules
			(alumni, other campus);
		</li>
		<li>
			within <strong>24 hours</strong> of the bot being removed from a server, or immediately
			if an admin deletes the data from the dashboard;
		</li>
		<li>encrypted backups are kept for <strong>7 days</strong> at most;</li>
		<li>technical logs hold no personal data and rotate quickly.</li>
	</ul>

	<h2>Recipients</h2>
	<p>
		The admins of the server concerned and the operator of this instance. The data is stored on
		a dedicated server rented from <strong>OVHcloud</strong> in Roubaix (France), which acts as
		a processor and does not access it. No data leaves the European Union because of the
		operator. Discord and 42 are independent controllers for the data they hold: see
		<a href="https://discord.com/privacy" rel="noopener noreferrer">Discord's policy</a>
		and
		<a href="https://www.42.fr/" rel="noopener noreferrer">42 Network's policy</a>.
	</p>

	<h2>Your rights</h2>
	<p>
		You have the right of access, rectification, erasure, objection, restriction and
		portability. To erase your data in a server, run <code>/forget</code> in that server. For
		any other request, contact the server's admins or the operator<template v-if="contact">
			(<a :href="contact.includes('@') ? `mailto:${contact}` : contact">{{ contact }}</a
			>)</template
		>. You can also lodge a complaint with the
		<a href="https://www.cnil.fr/en/" rel="noopener noreferrer">CNIL</a> or your own data
		protection authority.
	</p>

	<h2>Security</h2>
	<ul>
		<li>every connection goes over HTTPS;</li>
		<li>the database is not exposed on the network;</li>
		<li>secrets are kept out of the source code;</li>
		<li>verification links are signed and valid for 5 minutes only;</li>
		<li>the number of requests per address is limited.</li>
	</ul>
</template>
