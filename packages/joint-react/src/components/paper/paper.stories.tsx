/* eslint-disable react-perf/jsx-no-new-object-as-prop */

import type { Meta, StoryObj } from '@storybook/react/*';
import { Paper } from './paper';
import {
  SimpleGraphDecorator,
  type SimpleElement,
} from '../../../.storybook/decorators/with-simple-data';
import { HTMLNode } from '../html-node/html-node';

export type Story = StoryObj<typeof Paper>;
const meta: Meta<typeof Paper> = {
  title: 'Components/Paper',
  component: Paper,
  decorators: [SimpleGraphDecorator],
  parameters: {
    controls: { hideNoControlsWarning: true },
  },
};

export default meta;

function RenderRectElement({ width, height }: SimpleElement) {
  return <rect width={width} height={height} fill="blue" />;
}

function RenderHtmlElement({ width, height }: SimpleElement) {
  return (
    <HTMLNode
      element="div"
      style={{
        width,
        height,
        boxShadow: '0 0 10px rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 10,
      }}
    >
      Hello
    </HTMLNode>
  );
}

export const WithRectElement: Story = {
  args: {
    renderElement: RenderRectElement as never,
  },
};

export const WithHtmlElement: Story = {
  args: {
    noDataPlaceholder: 'No data',
    renderElement: RenderHtmlElement as never,
  },
};

export const WithGrid: Story = {
  args: {
    drawGrid: true,
    grid: { color: 'red', size: 10 },
    gridSize: 10,
    renderElement: RenderHtmlElement as never,
  },
};

export const WithScaleDown: Story = {
  args: {
    scale: 0.2,
    renderElement: RenderHtmlElement as never,
  },
};

export const WithAutoFitContent: Story = {
  args: {
    isFitContentOnLoadEnabled: true,
    renderElement: RenderHtmlElement as never,
  },
};
