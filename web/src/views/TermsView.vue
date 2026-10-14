<script setup lang="ts">
import LegalPage from '@/components/LegalPage.vue';
import TermsEn from '@/legal/TermsEn.vue';
import TermsFr from '@/legal/TermsFr.vue';
import { usePrefsStore } from '@/stores/prefs';

const prefs = usePrefsStore();
</script>

<template>
	<LegalPage :title="prefs.t['legal.terms']" updated="2026-10-14">
		<TermsFr v-if="prefs.locale === 'fr'" />
		<TermsEn v-else />
	</LegalPage>
</template>
