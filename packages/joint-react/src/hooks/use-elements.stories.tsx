import type { Meta, StoryObj } from '@storybook/react';
import { SimpleGraphDecorator } from '../../.storybook/decorators/with-simple-data';
import { useElements } from './use-elements';

function Hook() {
  const elements = useElements(); // Using the hook inside a component
  return <span>All elements are: {JSON.stringify(elements, null, 2)}</span>;
}
export type Story = StoryObj<typeof Hook>;

const meta: Meta<typeof Hook> = {
  title: 'Hooks/useElements',
  component: Hook,
  decorators: [SimpleGraphDecorator],
};

export default meta;

export const Default: Story = {};
