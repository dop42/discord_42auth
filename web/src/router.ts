import { createRouter, createWebHistory } from 'vue-router';

export const router = createRouter({
	history: createWebHistory(),
	routes: [
		{ path: '/', name: 'home', component: () => import('./views/HomeView.vue') },
		{
			path: '/guilds/:id',
			name: 'guild',
			component: () => import('./views/GuildView.vue'),
			props: true,
		},
		{ path: '/privacy', name: 'privacy', component: () => import('./views/PrivacyView.vue') },
		{ path: '/terms', name: 'terms', component: () => import('./views/TermsView.vue') },
		{ path: '/:pathMatch(.*)*', redirect: '/' },
	],
	scrollBehavior: () => ({ top: 0 }),
});
