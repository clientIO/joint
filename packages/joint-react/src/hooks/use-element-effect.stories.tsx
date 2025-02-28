/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import type { Meta, StoryObj } from '@storybook/react';
import type { SimpleElement } from '../../.storybook/decorators/with-simple-data';
import { RenderItemDecorator } from '../../.storybook/decorators/with-simple-data';
import { HtmlElement } from '../components/html-element';
import { useSetElement } from './use-set-element';
import { useState } from 'react';
import { useElementEffect } from './use-element-effect';

function Hook({ data: { label }, id, width, height }: SimpleElement) {
  const set = useSetElement(id, 'data');
  const [isPressed, setIsPressed] = useState(false);
  //   useElementEffect(
  //     nonReactElementsIds,
  //     (element) => {
  //       const isSelected = element.id === selectedNodeId;
  //       const dynamicColor = isSelected ? PRIMARY_COLOR : "white";
  //       element.attr({
  //         body: {
  //           fill: SECONDARY_COLOR,
  //           stroke: dynamicColor,
  //           strokeWidth: 2,
  //         },
  //         label: {
  //           text: "Native element",
  //           stroke: dynamicColor,
  //           fill: dynamicColor,
  //           fontSize: 18,
  //           fontWeight: "bold",
  //         },
  //       });
  //     },
  //     [selectedNodeId]
  //   );
  useElementEffect(
    id,
    (element) => {
      element.attr({
        body: {
          fill: 'blue',
          stroke: isPressed ? 'red' : 'black',
          strokeWidth: 2,
        },
      });
    },
    [isPressed]
  );
  return (
    <HtmlElement
      // eslint-disable-next-line react-perf/jsx-no-new-object-as-prop
      style={{ width, height }}
      element="button"
      onClick={() => setIsPressed(!isPressed)}
    >
      Border is {isPressed ? 'on' : 'off'}
    </HtmlElement>
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
