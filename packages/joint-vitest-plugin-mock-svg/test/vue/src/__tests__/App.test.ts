import { test, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import App from '../App.vue';

test('renders JointJS paper', () => {
  const wrapper = mount(App);
  expect(wrapper.find('.joint-paper').exists()).toBe(true);
  expect(wrapper.find('.joint-element').exists()).toBe(true);
});
