import type { Meta, StoryObj } from '@storybook/react/*';
import '../index.css';
import CodeWithCreateLinks from './code-with-create-links';
import CodeWithDiaLinks from './code-with-dia-links';

export type Story = StoryObj<typeof CodeWithCreateLinks>;

export default {
  title: 'Examples/With custom link',
  component: CodeWithCreateLinks,
} satisfies Meta<typeof CodeWithCreateLinks>;

export const Default: Story = {};

export const WithDiaLinks: Story = {
  render: CodeWithDiaLinks,
};
