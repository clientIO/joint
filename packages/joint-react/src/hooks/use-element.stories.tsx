import type { Meta, StoryObj } from '@storybook/react';
import { SimpleRenderItemDecorator } from '../../.storybook/decorators/with-simple-data';
import { HtmlElement } from '../components/html-element';
import { useElement } from './use-element';
import { memo } from 'react';

function HookWithId() {
  const cellId = useElement((element) => element.id);
  return <HtmlElement>cellId is: {cellId}</HtmlElement>;
}
const HookWithIdMemo = memo(HookWithId);

function HookWithJson() {
  const element = useElement((item) => ({
    x: item.x,
    y: item.y,
  }));
  return <HtmlElement>cellId is: {JSON.stringify(element)}</HtmlElement>;
}

const HookWithJsonMemo = memo(HookWithJson);
export type Story = StoryObj<typeof HookWithId>;

const meta: Meta<typeof HookWithId> = {
  title: 'Hooks/useElement',
  component: HookWithId,
  decorators: [SimpleRenderItemDecorator],
};

export default meta;

export const WithId: Story = {
  render: () => <HookWithIdMemo />,
};

export const WithJson: Story = {
  render: () => <HookWithJsonMemo />,
};
