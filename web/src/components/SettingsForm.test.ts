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
});
