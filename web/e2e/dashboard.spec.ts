import { expect, test } from '@playwright/test';
import { mockApi } from './mocks';

test('logged out: landing with login and invite links', async ({ page }) => {
	await mockApi(page, { loggedIn: false });
	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1 })).toContainText('42');
	await expect(page.getByRole('link', { name: 'Se connecter avec Discord' })).toHaveAttribute(
		'href',
		'/auth/login',
	);
	await expect(
		page.getByRole('main').getByRole('link', { name: 'Ajouter le bot' }),
	).toHaveAttribute('href', /discord\.com\/oauth2/);
});

test('logged in: lists manageable servers', async ({ page }) => {
	await mockApi(page, { loggedIn: true });
	await page.goto('/');
	const list = page.getByRole('list', { name: 'Serveurs' });
	await expect(list.getByRole('listitem')).toHaveCount(2);
	await expect(list.getByRole('link', { name: 'Configurer 42 Test' })).toBeVisible();
	await expect(list.getByRole('link', { name: /Ajouter le bot — Sans bot/ })).toHaveAttribute(
		'href',
		/guild_id=100000000000000002/,
	);
});

test('edit and save settings', async ({ page }) => {
	const recorded = await mockApi(page, { loggedIn: true });
	await page.goto('/');
	await page.getByRole('link', { name: 'Configurer 42 Test' }).click();
	await expect(page.getByRole('heading', { name: '42 Test' })).toBeVisible();
	await expect(page.getByRole('main').getByText('12', { exact: true })).toBeVisible();
	await expect(page.getByText('membres vérifiés', { exact: true })).toBeVisible();

	const save = page.getByRole('button', { name: 'Enregistrer' });
	await expect(save).toBeDisabled();

	await page.getByLabel('Campus', { exact: true }).fill('Paris');
	await page.getByRole('switch', { name: 'Étudiants actifs uniquement' }).click();
	await page.getByRole('switch', { name: 'Entraide au campus' }).click();
	await page.getByLabel('Nom complet et login').check();
	await page.getByLabel('Salon de journal').selectOption({ label: '#logs' });
	await save.click();

	await expect(page.getByText('Réglages enregistrés.')).toBeVisible();
	await expect(save).toBeDisabled();
	expect(recorded.saved).toEqual([
		{
			roleId: '200000000000000001',
			campus: 'Paris',
			studentsOnly: false,
			nickname: 'full',
			logChannelId: '300000000000000001',
			roleRules: [],
			helpers: true,
			fameChannelId: null,
			syncEvents: false,
			syncExams: false,
			counterChannelId: null,
			automodSpam: false,
			automodMentions: null,
			automodLanguage: false,
			automodKeywords: [],
			automodAlertChannelId: null,
		},
	]);
});

test('delete all data of a server', async ({ page }) => {
	const recorded = await mockApi(page, { loggedIn: true });
	await page.goto('/guilds/100000000000000001');
	await page.getByRole('button', { name: 'Supprimer toutes les données de ce serveur' }).click();

	const dialog = page.getByRole('dialog');
	const submit = dialog.getByRole('button', { name: 'Supprimer définitivement' });
	await expect(submit).toBeDisabled();
	await dialog.getByLabel(/Tapez/).fill('42 Test');
	await submit.click();

	await expect(page).toHaveURL(/\/$/);
	expect(recorded.deleted).toHaveLength(1);
	expect(recorded.deleted[0]).toContain('/api/guilds/100000000000000001');
});

test('legal pages show the operator', async ({ page }) => {
	await mockApi(page, { loggedIn: false });
	await page.goto('/');
	await page.getByRole('link', { name: 'Confidentialité' }).click();
	await expect(page.getByRole('heading', { name: 'Politique de confidentialité' })).toBeVisible();
	await expect(page.getByRole('main').getByText('France (auto-hébergé)')).toBeVisible();
	await page.getByRole('link', { name: 'Conditions d’utilisation' }).click();
	await expect(page.getByRole('heading', { name: 'Conditions d’utilisation' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'rgpd@example.org' })).toBeVisible();
});

test('posts the verification panel in a chosen channel', async ({ page }) => {
	const recorded = await mockApi(page, { loggedIn: true });
	await page.goto('/guilds/100000000000000001');
	const post = page.getByRole('button', { name: 'Publier le panneau' });
	await expect(post).toBeDisabled();
	await page.getByLabel('Salon', { exact: true }).selectOption({ label: '#logs' });
	await post.click();
	await expect(page.getByText('Panneau publié dans #logs.')).toBeVisible();
	expect(recorded.panels).toEqual([{ channelId: '300000000000000001' }]);
});

test('adds a role rule and saves it', async ({ page }) => {
	const recorded = await mockApi(page, { loggedIn: true });
	await page.goto('/guilds/100000000000000001');
	await page.getByRole('button', { name: 'Ajouter une règle' }).click();
	const rule = page.getByRole('group', { name: 'Règle 1' });
	await rule.getByLabel('Condition').selectOption({ label: 'Cursus en cours' });
	await rule.getByLabel('Valeur').fill('c-piscine');
	await rule.getByLabel('Rôle donné').selectOption({ label: 'Verified' });
	await page.getByRole('button', { name: 'Enregistrer' }).click();
	await expect(page.getByText('Réglages enregistrés.')).toBeVisible();
	expect(recorded.saved[0]?.roleRules).toEqual([
		{ kind: 'cursus', value: 'c-piscine', roleId: '200000000000000001' },
	]);
});

test('members tab: search, then unlink with a confirmation', async ({ page }) => {
	const recorded = await mockApi(page, { loggedIn: true });
	await page.goto('/guilds/100000000000000001');
	await page.getByRole('link', { name: 'Membres', exact: true }).click();
	await expect(page).toHaveURL(/\/guilds\/100000000000000001\/members$/);

	const table = page.getByRole('table', { name: 'Membres vérifiés' });
	await expect(table.getByRole('row')).toHaveCount(3);
	await page.getByLabel('Rechercher').fill('jd');
	await expect(table.getByRole('row')).toHaveCount(2);

	await page.getByRole('button', { name: 'Délier jdoe' }).click();
	await page.getByRole('button', { name: 'Confirmer : délier jdoe' }).click();
	await expect(page.getByText('jdoe a été délié.')).toBeVisible();
	await expect(page.getByText('Aucun membre ne correspond à cette recherche.')).toBeVisible();
	expect(recorded.unlinked).toEqual(['500000000000000001']);
});

test('switches to English and to the dark theme, and remembers both', async ({ page }) => {
	await mockApi(page, { loggedIn: false });
	await page.goto('/');
	await page.getByRole('button', { name: 'EN' }).click();
	await expect(page.getByRole('link', { name: 'Log in with Discord' })).toBeVisible();
	await expect(page.locator('html')).toHaveAttribute('lang', 'en');

	await page.getByRole('button', { name: 'Switch to dark theme' }).click();
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

	await page.reload();
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
	await expect(page.getByRole('link', { name: 'Log in with Discord' })).toBeVisible();
	await page.getByRole('link', { name: 'Privacy' }).click();
	await expect(page.getByRole('heading', { name: 'Privacy policy' })).toBeVisible();
});

test('the categories navigation jumps to a category and marks unsaved edits', async ({ page }) => {
	await mockApi(page, { loggedIn: true });
	await page.goto('/guilds/100000000000000001');
	const nav = page.getByRole('navigation', { name: 'Catégories des réglages' });
	await expect(nav.getByRole('link', { name: 'Accès' })).toHaveAttribute(
		'aria-current',
		'location',
	);

	await page.getByRole('switch', { name: 'Entraide au campus' }).click();
	await expect(page.getByRole('switch', { name: 'Entraide au campus' })).toHaveAttribute(
		'aria-checked',
		'true',
	);
	const features = nav.getByRole('link', { name: /Fonctionnalités/ });
	await expect(features).toContainText('modifications non enregistrées');

	await features.click();
	await expect(page.getByRole('heading', { level: 2, name: 'Fonctionnalités' })).toBeFocused();
	await expect(features).toHaveAttribute('aria-current', 'location');
});

test('a refused save takes the focus to the field to fix', async ({ page }) => {
	await mockApi(page, { loggedIn: true });
	await page.route('**/api/guilds/*', (route) =>
		route.request().method() === 'PUT'
			? route.fulfill({
					status: 400,
					contentType: 'application/json',
					body: JSON.stringify({ error: 'invalid', field: 'logChannelId' }),
				})
			: route.fallback(),
	);
	await page.goto('/guilds/100000000000000001');
	await page.getByLabel('Campus', { exact: true }).fill('Paris');
	await page.getByRole('button', { name: 'Enregistrer' }).click();

	const logs = page.getByLabel('Salon de journal');
	await expect(logs).toBeFocused();
	await expect(logs).toHaveAttribute('aria-invalid', 'true');
	await expect(logs).toHaveAccessibleDescription(/refusé par le serveur/);
	await expect(page.getByText('Un réglage a été refusé')).toBeVisible();
});
