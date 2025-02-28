import type { Meta, StoryObj } from '@storybook/react';
import { useCellId } from './use-cell-id'; // Adjust path accordingly
import type { SimpleElement } from '../../.storybook/decorators/with-simple-data';
import { SimpleRenderItemDecorator } from '../../.storybook/decorators/with-simple-data';
import { HtmlElement } from '../components/html-element';

function Hook(_: SimpleElement) {
  const cellId = useCellId(); // Using the hook inside a component
  return <HtmlElement>cellId is: {cellId}</HtmlElement>;
}
export type Story = StoryObj<typeof Hook>;

const meta: Meta<typeof Hook> = {
  title: 'Hooks/useCellId',
  component: Hook,
  decorators: [SimpleRenderItemDecorator],
};

export default meta;

export const Default: Story = {};
