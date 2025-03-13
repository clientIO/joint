/* eslint-disable react-perf/jsx-no-new-object-as-prop */

import type { Meta, StoryObj } from '@storybook/react/*';
import { Paper } from './paper';
import {
  SimpleGraphDecorator,
  type SimpleElement,
} from '../../../.storybook/decorators/with-simple-data';
import { HTMLNode } from '../html-node/html-node';
import { action } from '@storybook/addon-actions';
import { dia, linkTools } from '@joint/core';
import { jsx } from 'src/utils/joint-jsx/jsx-to-markup';

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
  return <rect width={width} height={height} fill="cyan" />;
}

function RenderHtmlElement({ width, height }: SimpleElement) {
  return (
    <HTMLNode
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
    renderElement: RenderHtmlElement as never,
  },
};

export const WithEvent: Story = {
  args: {
    renderElement: RenderHtmlElement as never,
    onLinkMouseenter: action('onLinkMouseenter'),
    onCellMouseenter: action('onCellMouseenter'),
    onBlankContextmenu: action('onBlankContextmenu'),
    onBlankMouseenter: action('onBlankMouseenter'),
    onBlankMouseleave: action('onBlankMouseleave'),
    onCellMouseleave: action('onCellMouseleave'),
    onBlankMouseout: action('onBlankMouseout'),
    onBlankMouseover: action('onBlankMouseover'),
    onBlankMousewheel: action('onBlankMousewheel'),
    onBlankPointerClick: action('onBlankPointerClick'),
    onBlankPointerdblClick: action('onBlankPointerdblClick'),
    onBlankPointerdown: action('onBlankPointerdown'),
    onBlankPointermove: action('onBlankPointermove'),
    onBlankPointerup: action('onBlankPointerup'),
    onCellContextmenu: action('onCellContextmenu'),
    onCellHighlight: action('onCellHighlight'),
    onCellHighlightInvalid: action('onCellHighlightInvalid'),
    onCustom: action('onCustom'),
  },
};

const infoButton = new linkTools.Button({
  markup: jsx(
    <>
      <circle joint-selector="button" r={7} fill="#001DFF" cursor="pointer" />
      <path
        joint-selector="icon"
        d="M -2 4 2 4 M 0 3 0 0 M -2 -1 1 -1 M -1 -4 1 -4"
        fill="none"
        stroke="#FFFFFF"
        stroke-width={2}
        pointer-events="none"
      />
    </>
  ),
  distance: 60,
  offset: 0,
});

const toolsView = new dia.ToolsView({
  tools: [infoButton],
});

export const WithLinkTools: Story = {
  args: {
    renderElement: RenderHtmlElement as never,
    onLinkMouseenter: (linkView) => {
      linkView.addTools(toolsView);
    },
    onLinkMouseleave: (linkView) => {
      linkView.removeTools();
    },
  },
};
