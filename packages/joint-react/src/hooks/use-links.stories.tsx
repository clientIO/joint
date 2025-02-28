import type { Meta, StoryObj } from '@storybook/react';
import { SimpleGraphDecorator } from '../../.storybook/decorators/with-simple-data';
import { useLinks } from './use-links';

function Hook() {
  const links = useLinks(); // Using the hook inside a component
  return <span>All elements are: {JSON.stringify(links, null, 2)}</span>;
}
export type Story = StoryObj<typeof Hook>;

const meta: Meta<typeof Hook> = {
  title: 'Hooks/useLinks',
  component: Hook,
  decorators: [SimpleGraphDecorator],
};

export default meta;

export const Default: Story = {};
