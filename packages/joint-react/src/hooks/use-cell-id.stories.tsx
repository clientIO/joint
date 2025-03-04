import type { Meta, StoryObj } from '@storybook/react';
import { useCellId } from './use-cell-id'; // Adjust path accordingly
import type { SimpleElement } from '../../.storybook/decorators/with-simple-data';
import { SimpleRenderItemDecorator } from '../../.storybook/decorators/with-simple-data';
import { HTMLNode } from '../components/html-node/html-node';

function Hook(_: SimpleElement) {
  const cellId = useCellId(); // Using the hook inside a component
  return <HTMLNode>cellId is: {cellId}</HTMLNode>;
}
export type Story = StoryObj<typeof Hook>;

const meta: Meta<typeof Hook> = {
  title: 'Hooks/useCellId',
  component: Hook,
  decorators: [SimpleRenderItemDecorator],
};

export default meta;

export const Default: Story = {};
