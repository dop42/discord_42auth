import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { useGuildStore } from '@/stores/guild';
import { sampleDetail } from '@/test/fixtures';
import SettingsForm from './SettingsForm.vue';

beforeEach(() => {
	setActivePinia(createPinia());
});

describe('SettingsForm', () => {
	it('highlights only the field the server refused', async () => {
		const store = useGuildStore();
		store.hydrate(sampleDetail());
		const wrapper = mount(SettingsForm);

		expect(wrapper.find('#campus').attributes('aria-invalid')).toBe('false');
		store.invalidField = 'campus';
		await nextTick();

		const campus = wrapper.find('#campus');
		expect(campus.attributes('aria-invalid')).toBe('true');
		expect(campus.classes()).toContain('field--invalid');
		expect(wrapper.find('#role').classes()).not.toContain('field--invalid');
	});

	it('disables roles above the bot and warns about them', () => {
		const store = useGuildStore();
		store.hydrate(sampleDetail());
		const wrapper = mount(SettingsForm);
		const staff = wrapper.find('option[value="200000000000000002"]');
		expect(staff.attributes('disabled')).toBeDefined();
		expect(wrapper.text()).toContain('glissez le rôle du bot');
	});

	it('keeps save disabled until something changes', async () => {
		const store = useGuildStore();
		store.hydrate(sampleDetail());
		const wrapper = mount(SettingsForm);
		const submit = wrapper.find('button[type="submit"]');
		expect(submit.attributes('disabled')).toBeDefined();
		await wrapper.find('#students').trigger('click');
		expect(submit.attributes('disabled')).toBeUndefined();
		expect(wrapper.find('#students').attributes('aria-checked')).toBe('false');
	});

	it('edits role rules and points at the one the server refused', async () => {
		const store = useGuildStore();
		store.hydrate(sampleDetail());
		const wrapper = mount(SettingsForm);
		expect(wrapper.text()).toContain('Aucune règle');

		await wrapper.find('button.btn--ghost').trigger('click');
		expect(store.dirty).toBe(true);
		const items = () => wrapper.findAll('.rule-item');
		const first = () => wrapper.get('.rule-item');
		expect(items()).toHaveLength(1);

		await first().find('input').setValue('Paris');
		await first().get('.rule-item__role').setValue('200000000000000001');
		expect(store.draft?.roleRules).toEqual([
			{ kind: 'campus', value: 'Paris', roleId: '200000000000000001' },
		]);
		// Only assignable roles are offered.
		expect(first().find('option[value="200000000000000002"]').exists()).toBe(false);

		store.invalidField = 'roleRules';
		store.invalidIndex = 0;
		await nextTick();
		expect(first().classes()).toContain('rule-item--invalid');
		expect(wrapper.text()).toContain('La règle 1 a été refusée');

		await wrapper.find('.rule-item__remove').trigger('click');
		expect(store.dirty).toBe(false);
	});
});
