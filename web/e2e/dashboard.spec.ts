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

	await page.getByLabel('Campus').fill('Paris');
	await page.getByRole('switch', { name: 'Étudiants actifs uniquement' }).click();
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
