<script setup lang="ts">
import LegalPage from '@/components/LegalPage.vue';
import PrivacyEn from '@/legal/PrivacyEn.vue';
import PrivacyFr from '@/legal/PrivacyFr.vue';
import { usePrefsStore } from '@/stores/prefs';

const prefs = usePrefsStore();
</script>

<template>
	<LegalPage :title="prefs.t['legal.privacy']" updated="2026-10-14">
		<PrivacyFr v-if="prefs.locale === 'fr'" />
		<PrivacyEn v-else />
	</LegalPage>
</template>
