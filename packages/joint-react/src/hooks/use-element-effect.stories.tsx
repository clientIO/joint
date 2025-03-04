/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import type { Meta, StoryObj } from '@storybook/react';
import type { SimpleElement } from '../../.storybook/decorators/with-simple-data';
import { RenderItemDecorator } from '../../.storybook/decorators/with-simple-data';
import { useState } from 'react';
import { useElementEffect } from './use-element-effect';
import { HTMLNode } from '../components/html-node/html-node';

function Hook({ id, width, height }: SimpleElement) {
  const [isPressed, setIsPressed] = useState(false);

  useElementEffect(
    id,
    (element) => {
      element.attr({
        rect: {
          fill: 'blue',
          stroke: isPressed ? 'red' : 'black',
          strokeWidth: 10,
        },
      });
    },
    [isPressed]
  );
  return (
    <HTMLNode
      // eslint-disable-next-line react-perf/jsx-no-new-object-as-prop
      style={{ width, height }}
      element="button"
      onClick={() => setIsPressed(!isPressed)}
    >
      Border is {isPressed ? 'on' : 'off'}
    </HTMLNode>
  );
}
export type Story = StoryObj<typeof Hook>;

const meta: Meta<typeof Hook> = {
  title: 'Hooks/useElementEffect',
  component: Hook,
  render: () => <RenderItemDecorator renderElement={Hook} />,
};

export default meta;

export const AddBorder: Story = {};
