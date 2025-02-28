/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import type { Meta, StoryObj } from '@storybook/react';
import type { SimpleElement } from '../../.storybook/decorators/with-simple-data';
import { RenderItemDecorator } from '../../.storybook/decorators/with-simple-data';
import { HtmlElement } from '../components/html-element';
import { useSetElement } from './use-set-element';

function Hook({ data: { label }, id }: SimpleElement) {
  const set = useSetElement(id, 'data');

  return (
    <HtmlElement>
      <button onClick={() => set({ label: 'hello' })}>Set new data</button>
      label: {label}
    </HtmlElement>
  );
}
export type Story = StoryObj<typeof Hook>;

const meta: Meta<typeof Hook> = {
  title: 'Hooks/useSetElement',
  component: Hook,
  render: () => <RenderItemDecorator renderElement={Hook} />,
};

export default meta;

export const Default: Story = {};
