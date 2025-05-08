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
import { makeRootDocumentation } from '@joint/react/src/stories/utils/make-story';
import { getAPILink } from '@joint/react/src/stories/utils/get-api-documentation-link';
import { MeasuredNode } from '../measured-node/measured-node';

export type Story = StoryObj<typeof Paper>;

const API_URL = getAPILink('Paper', 'variables');
const meta: Meta<typeof Paper> = {
  title: 'Components/Paper',
  component: Paper,
  decorators: [SimpleGraphDecorator],
  parameters: makeRootDocumentation({
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

function RenderHTMLElement({ width, height }: SimpleElement) {
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

export const WithHTMLElement: Story = {
  args: {
    noDataPlaceholder: 'No data',
    renderElement: RenderHTMLElement as never,
    width: '100%',
    className: PAPER_CLASSNAME,
  },
};

export const WithGrid: Story = {
  args: {
    drawGrid: true,
    gridSize: 10,
    renderElement: RenderHTMLElement as never,
    width: '100%',
    className: PAPER_CLASSNAME,
  },
};

export const WithScaleDown: Story = {
  args: {
    scale: 0.7,
    renderElement: RenderHTMLElement as never,
    width: '100%',
    className: PAPER_CLASSNAME,
  },
};

export const WithAutoFitContent: Story = {
  args: {
    renderElement: RenderHTMLElement as never,
    width: '100%',
    className: PAPER_CLASSNAME,
  },
};

export const WithEvent: Story = {
  args: {
    renderElement: RenderHTMLElement as never,
    onLinkMouseEnter: action('onLinkMouseenter'),
    onCellMouseEnter: action('onCellMouseEnter'),
    onBlankContextMenu: action('onBlankContextmenu'),
    onBlankMouseEnter: action('onBlankMouseEnter'),
    onBlankMouseLeave: action('onBlankMouseLeave'),
    onBlankPointerMove: action('onBlankPointerMove'),
    onBlankPointerUp: action('onBlankPointerUp'),
    onBlankPointerDown: action('onBlankPointerDown'),
    onBlankPointerClick: action('onBlankPointerClick'),
    onBlankMouseOut: action('onBlankMouseOut'),
    onBlankMouseOver: action('onBlankMouseOver'),
    onBlankMouseWheel: action('onBlankMouseWheel'),
    onBlankPointerDblClick: action('onBlankPointerDblClick'),
    onCellContextMenu: action('onCellContextMenu'),
    onCellHighlight: action('onCellHighlight'),
    onCellHighlightInvalid: action('onCellHighlightInvalid'),
    onCellUnhighlight: action('onCellUnhighlight'),
    onCellMouseLeave: action('onCellMouseLeave'),
    onCellMouseOut: action('onCellMouseOut'),
    onCellMouseOver: action('onCellMouseOver'),
    onCellMouseWheel: action('onCellMouseWheel'),
    onCellPointerClick: action('onCellPointerClick'),
    onCellPointerDblClick: action('onCellPointerDblClick'),
    onCellPointerDown: action('onCellPointerDown'),
    onCellPointerMove: action('onCellPointerMove'),
    onCellPointerUp: action('onCellPointerUp'),
    onCustomEvent: action('onCustomEvent'),
    onElementContextMenu: action('onElementContextMenu'),
    onElementMagnetContextMenu: action('onElementMagnetContextMenu'),
    onElementMagnetPointerClick: action('onElementMagnetPointerClick'),
    onElementMagnetPointerDblClick: action('onElementMagnetPointerDblClick'),
    onElementMouseEnter: action('onElementMouseEnter'),
    onElementMouseLeave: action('onElementMouseLeave'),
    onElementMouseOut: action('onElementMouseOut'),
    onElementMouseOver: action('onElementMouseOver'),
    onElementMouseWheel: action('onElementMouseWheel'),
    onElementPointerClick: action('onElementPointerClick'),
    onElementPointerDblClick: action('onElementPointerDblClick'),
    onElementPointerDown: action('onElementPointerDown'),
    onElementPointerMove: action('onElementPointerMove'),
    onElementPointerUp: action('onElementPointerUp'),
    onElementsSizeChange: action('onElementsSizeChange'),
    onLinkContextMenu: action('onLinkContextMenu'),
    onElementsSizeReady: action('onElementsSizeReady'),
    onLinkConnect: action('onLinkConnect'),
    onLinkDisconnect: action('onLinkDisconnect'),
    onLinkMouseLeave: action('onLinkMouseLeave'),
    onLinkMouseOut: action('onLinkMouseOut'),
    onLinkMouseOver: action('onLinkMouseOver'),
    onLinkMouseWheel: action('onLinkMouseWheel'),
    onLinkPointerClick: action('onLinkPointerClick'),
    onLinkPointerDblClick: action('onLinkPointerDblClick'),
    onLinkPointerDown: action('onLinkPointerDown'),
    onLinkPointerMove: action('onLinkPointerMove'),
    onLinkPointerUp: action('onLinkPointerUp'),
    onLinkSnapConnect: action('onLinkSnapConnect'),
    onLinkSnapDisconnect: action('onLinkSnapDisconnect'),
    onPan: action('onPan'),
    onPaperMouseEnter: action('onPaperMouseEnter'),
    onPaperMouseLeave: action('onPaperMouseLeave'),
    onPinch: action('onPinch'),
    onRenderDone: action('onRenderDone'),
    onResize: action('onResize'),
    onScale: action('onScale'),
    onTransform: action('onTransform'),
    onTranslate: action('onTranslate'),

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
    renderElement: RenderHTMLElement as never,
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
    renderElement: RenderHTMLElement as never,
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
