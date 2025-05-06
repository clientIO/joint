/* eslint-disable react-perf/jsx-no-new-object-as-prop */

import type { Meta, StoryObj } from '@storybook/react/*';
import { Paper } from './paper';
import {
  SimpleGraphDecorator,
  type SimpleElement,
} from '../../../.storybook/decorators/with-simple-data';
import { action } from '@storybook/addon-actions';
import { dia, linkTools } from '@joint/core';
import { jsx } from '@joint/react/src/utils/joint-jsx/jsx-to-markup';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import { makeRootDocs } from '@joint/react/src/stories/utils/make-story';
import { getAPILink } from '@joint/react/src/stories/utils/get-api-documentation-link';
import { MeasuredNode } from '../measured-node/measured-node';

export type Story = StoryObj<typeof Paper>;

const API_URL = getAPILink('Paper', 'variables');
const meta: Meta<typeof Paper> = {
  title: 'Components/Paper',
  component: Paper,
  decorators: [SimpleGraphDecorator],
  parameters: makeRootDocs({
    description: `
Paper is a component that renders graph elements. It is used to display and interact with graph elements.
    `,
    apiURL: API_URL,
    code: `import { Paper } from '@joint/react'
<Paper renderElement={() => <rect rx={10} ry={10} width={100} height={50} fill={"blue"} />} />
    `,
  }),
};

export default meta;

function RenderRectElement({ width, height }: SimpleElement) {
  return <rect rx={10} ry={10} width={width} height={height} fill={PRIMARY} />;
}

function RenderHtmlElement({ width, height }: SimpleElement) {
  return (
    <foreignObject width={width} height={height}>
      <MeasuredNode>
        <div
          style={{
            width,
            height,
            boxShadow: '0 0 10px rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: PRIMARY,
            borderRadius: 10,
          }}
        >
          Hello
        </div>
      </MeasuredNode>
    </foreignObject>
  );
}

export const WithRectElement: Story = {
  args: {
    renderElement: RenderRectElement as never,
    width: '100%',
    className: PAPER_CLASSNAME,
  },
};

export const WithHtmlElement: Story = {
  args: {
    noDataPlaceholder: 'No data',
    renderElement: RenderHtmlElement as never,
    width: '100%',
    className: PAPER_CLASSNAME,
  },
};

export const WithGrid: Story = {
  args: {
    drawGrid: true,
    grid: { color: 'red', size: 10 },
    gridSize: 10,
    renderElement: RenderHtmlElement as never,
    width: '100%',
    className: PAPER_CLASSNAME,
  },
};

export const WithScaleDown: Story = {
  args: {
    scale: 0.7,
    renderElement: RenderHtmlElement as never,
    width: '100%',
    className: PAPER_CLASSNAME,
  },
};

export const WithAutoFitContent: Story = {
  args: {
    renderElement: RenderHtmlElement as never,
    width: '100%',
    className: PAPER_CLASSNAME,
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
    onCustomEvent: action('onCustomEvent'),
    onBlankContextMenu: action('onBlankContextMenu'),
    onCellContextMenu: action('onCellContextMenu'),
    onBlankMouseEnter: action('onBlankMouseEnter'),
    onElementPointerClick: action('onElementPointerClick'),

    width: '100%',
    className: PAPER_CLASSNAME,
  },
};

const infoButton = new linkTools.Button({
  markup: jsx(
    <>
      <circle r={7} fill="#001DFF" cursor="pointer" />
      <path
        d="M -2 4 2 4 M 0 3 0 0 M -2 -1 1 -1 M -1 -4 1 -4"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={2}
        pointerEvents="none"
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
    onLinkMouseEnter: ({ linkView }) => {
      linkView.addTools(toolsView);
    },
    onLinkMouseLeave: ({ linkView }) => {
      linkView.removeTools();
    },
    width: '100%',
    className: PAPER_CLASSNAME,
  },
};

export const WithCustomEvent: Story = {
  args: {
    renderElement: RenderHtmlElement as never,
    onElementPointerClick: ({ paper }) => {
      paper.trigger('MyCustomEventOnClick', { message: 'Hello from custom event!' });
    },
    onCustomEvent: ({ args, eventName }) => {
      action('onCustomEvent')(
        `Custom event triggered: ${eventName} with args: ${JSON.stringify(args)}`
      );
    },
    width: '100%',
    className: PAPER_CLASSNAME,
  },
};
