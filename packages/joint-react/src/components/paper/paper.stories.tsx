/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react-perf/jsx-no-new-array-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */

import type { Meta, StoryObj } from '@storybook/react';
import {
  SimpleGraphDecorator,
  type SimpleElement,
} from '../../../.storybook/decorators/with-simple-data';
import { action } from '@storybook/addon-actions';
import { dia, linkTools } from '@joint/core';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import { MeasuredNode } from '../measured-node/measured-node';
import { getAPILink } from '../../stories/utils/get-api-documentation-link';
import { makeRootDocumentation } from '../../stories/utils/make-story';
import { jsx } from '../../utils/joint-jsx/jsx-to-markup';
import { useCellActions } from '../../hooks/use-cell-actions';
import { Paper } from './paper';
import type { RenderElement } from './paper.types';
import { GraphProvider } from '../graph/graph-provider';

export type Story = StoryObj<typeof Paper>;

const API_URL = getAPILink('Paper', 'variables');
const meta: Meta<typeof Paper> = {
  title: 'Components/Paper',
  component: Paper,
  decorators: [SimpleGraphDecorator],
  parameters: makeRootDocumentation({
    description: `
Paper renders nodes and links using the JointJS Paper under the hood. Compose it inside a GraphProvider. Define node UI via the renderElement prop, and use useHTMLOverlay or <foreignObject> for HTML content.
    `,
    apiURL: API_URL,
    code: `import { GraphProvider } from '@joint/react'
<GraphProvider>
  <Paper renderElement={({ width, height }) => (
    <rect rx={10} ry={10} width={width} height={height} fill={"blue"} />
  )} />
</GraphProvider>
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

export const WithAutomaticLayoutSize: Story = {
  args: {
    renderElement: RenderHTMLElement as never,
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
    width: '100%',
    className: PAPER_CLASSNAME,
  },
};

export const WithDrawGrid: Story = {
  args: {
    renderElement: RenderHTMLElement as never,
    onElementPointerClick: ({ paper }) => {
      paper.trigger('MyCustomEventOnClick', { message: 'Hello from custom event!' });
    },
    className: PAPER_CLASSNAME,
    drawGrid: { name: 'dot', thickness: 2, color: 'white' },
    drawGridSize: 10,
  },
};

export const WithOnClickColorChange: Story = {
  args: {},
  render: () => {
    const renderElement: RenderElement = ({ width, height, hoverColor, id }) => {
      const { set } = useCellActions();
      return (
        <div
          className="node"
          onClick={() => {
            set(id, (previous) => ({ ...previous, hoverColor: 'blue' }));
          }}
          style={{ width, height, backgroundColor: hoverColor }}
        ></div>
      );
    };
    return (
      <GraphProvider
        elements={[
          { width: 100, height: 40, id: '1', label: 'Element 1', x: 50, y: 50, hoverColor: 'red' },
          {
            width: 100,
            height: 40,
            id: '2',
            label: 'Element 1',
            x: 100,
            y: 250,
            hoverColor: 'red',
          },
        ]}
        links={[
          {
            id: 'l1',
            source: '1',
            target: '2',
            attrs: {
              line: {
                stroke: PRIMARY,
              },
            },
          },
        ]}
      >
        <Paper
          id="main"
          useHTMLOverlay
          className={PAPER_CLASSNAME}
          width="100%"
          height={400}
          renderElement={renderElement}
        />
      </GraphProvider>
    );
  },
};
