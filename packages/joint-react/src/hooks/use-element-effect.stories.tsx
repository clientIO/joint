/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import type { Meta, StoryObj } from '@storybook/react';
import type { SimpleElement } from '../../.storybook/decorators/with-simple-data';
import { RenderItemDecorator } from '../../.storybook/decorators/with-simple-data';
import { useState } from 'react';
import { useElementEffect } from './use-element-effect';
import { HTMLNode } from '../components/html-node/html-node';
import { PRIMARY } from '.storybook/theme';
import { makeRootDocs } from 'src/stories/utils/make-story';
import { getAPILink } from 'src/stories/utils/get-api-documentation-link';

function Hook({ id, width, height }: SimpleElement) {
  const [isPressed, setIsPressed] = useState(false);

  useElementEffect(
    id,
    (element) => {
      element.attr({
        rect: {
          fill: PRIMARY,
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

const API_URL = getAPILink('useElementEffect');
const meta: Meta<typeof Hook> = {
  title: 'Hooks/useElementEffect',
  component: Hook,
  render: () => <RenderItemDecorator renderElement={Hook} />,
  parameters: makeRootDocs({
    apiURL: API_URL,
    description: `useElementEffect is a hook that allows you to add modify element based on react state. It is used to add effects to the element. 
    <br/>**This api is experimental and can be changed or removed in the future.**`,
    code: `function Hook({ id, width, height }: SimpleElement) {
  const [isPressed, setIsPressed] = useState(false);

  useElementEffect(
    id,
    (element) => {
      element.attr({
        rect: {
          fill: PRIMARY,
          stroke: isPressed ? 'red' : 'black',
          strokeWidth: 10,
        },
      });
    },
    [isPressed]
  );
  return (
    <HTMLNode
      style={{ width, height }}
      element="button"
      onClick={() => setIsPressed(!isPressed)}
    >
      Border is {isPressed ? 'on' : 'off'}
    </HTMLNode>
  );
}`,
  }),
};

export default meta;

export const AddBorder: Story = {};
