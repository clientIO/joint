import { test, expect } from 'vitest';
import { waitFor } from '@testing-library/vue';
import { mount } from '@vue/test-utils';
import App from '../App.vue';

test('renders JointJS paper', async () => {
  const wrapper = mount(App);
  await waitFor(() => {
    expect(wrapper.find('.joint-paper').exists()).toBe(true);
    expect(wrapper.find('.joint-element').exists()).toBe(true);
  });
});
