/* eslint-disable react-perf/jsx-no-new-function-as-prop */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */

import React, { useId, useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  SimpleGraphDecorator,
  type SimpleElement,
} from '../../../.storybook/decorators/with-simple-data';
import { action } from 'storybook/actions';
import { dia, linkTools } from '@joint/core';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import { useNodeSize } from '../../hooks/use-node-size';
import { getAPILink } from '../../stories/utils/get-api-documentation-link';
import { makeRootDocumentation } from '../../stories/utils/make-story';
import { jsx } from '../../utils/joint-jsx/jsx-to-markup';
import { useCellActions } from '../../hooks/use-cell-actions';
import { useCellId } from '../../hooks/use-cell-id';
import { usePaperEvents } from '../../hooks/use-paper-events';
import { Paper } from './paper';
import type { RenderElement } from './paper.types';
import type { FlatElementData } from '../../types/element-types';
import { GraphProvider } from '../graph/graph-provider';

export type Story = StoryObj<typeof Paper>;

interface StoryElementData extends FlatElementData {
  readonly label: string;
  readonly hoverColor: string;
}

const API_URL = getAPILink('Paper', 'variables');
const meta: Meta<typeof Paper> = {
  title: 'Components/Paper',
  component: Paper,
  decorators: [SimpleGraphDecorator],
  tags: ['component'],
  parameters: makeRootDocumentation({
    description: `
The **Paper** component is the core rendering component that displays nodes and links on the canvas. It wraps the JointJS Paper and provides a React-friendly interface for rendering interactive diagrams.

**Key Features:**
- Renders SVG elements and HTML content via \`renderElement\`
- Supports all JointJS Paper events (click, hover, drag, etc.)
- Handles zoom, pan, and transform operations
- Integrates with GraphProvider for state management
- Supports custom link tools and interactions
    `,
    usage: `
\`\`\`tsx
import { GraphProvider, Paper } from '@joint/react';

function MyDiagram() {
  return (
    <GraphProvider elements={elements} links={links}>
      <Paper 
        renderElement={({ width, height }) => (
          <rect 
            rx={10} 
            ry={10} 
            width={width} 
            height={height} 
            fill="blue" 
          />
        )}
        
        height={600}
      />
    </GraphProvider>
  );
}
\`\`\`
    `,
    props: `
- **renderElement**: Function that receives element props and returns SVG/HTML content
- **width/height**: Paper dimensions (supports numbers or CSS strings)
- **scale**: Zoom level (default: 1)
- **className**: CSS class for styling
- **drawGrid**: Grid configuration for visual guides
- **Events**: Subscribe with \`usePaperEvents\` using raw JointJS names (e.g. \`cell:pointerclick\`, \`link:mouseenter\`)
    `,
    apiURL: API_URL,
    code: `import { GraphProvider, Paper } from '@joint/react'

<GraphProvider elements={elements} links={links}>
  <Paper 
    renderElement={({ width, height }) => (
      <rect rx={10} ry={10} width={width} height={height} fill="blue" />
    )}
    
    height={600}
  />
</GraphProvider>
    `,
  }),
};

export default meta;

function RenderRectElement({ width, height }: Readonly<SimpleElement>) {
  return <rect rx={10} ry={10} width={width} height={height} fill={PRIMARY} />;
}

function RenderHTMLElement({ width, height }: Readonly<SimpleElement>) {
  const elementRef = React.useRef<HTMLDivElement>(null);
  useNodeSize(elementRef);
  return (
    <foreignObject width={width} height={height}>
      <div
        ref={elementRef}
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
    </foreignObject>
  );
}

export const WithRectElement: Story = {
  args: {
    renderElement: RenderRectElement as never,
    width: '100%',
    className: PAPER_CLASSNAME,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Renders a simple SVG rectangle element. This is the most basic usage of the Paper component with SVG content.',
      },
    },
  },
};

export const WithHTMLElement: Story = {
  args: {
    renderElement: RenderHTMLElement as never,
    width: '100%',
    className: PAPER_CLASSNAME,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Renders HTML content using `<foreignObject>`. Use `MeasuredNode` to automatically calculate and update element sizes based on HTML content dimensions.',
      },
    },
  },
};

export const WithScaleDown: Story = {
  args: {
    scale: 0.7,
    renderElement: RenderHTMLElement as never,
    width: '100%',
    className: PAPER_CLASSNAME,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates zoom/scale functionality. The `scale` prop controls the zoom level of the paper (0.7 = 70% zoom).',
      },
    },
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
    onElementsMeasured: action('onElementsMeasured'),
    width: '100%',
    className: PAPER_CLASSNAME,
  },
  render: (args) => {
    const paperId = useId();
    usePaperEvents(paperId, {
      'link:mouseenter': action('link:mouseenter'),
      'cell:mouseenter': action('cell:mouseenter'),
      'blank:contextmenu': action('blank:contextmenu'),
      'blank:pointermove': action('blank:pointermove'),
      'blank:pointerup': action('blank:pointerup'),
      'blank:pointerdown': action('blank:pointerdown'),
      'blank:pointerclick': action('blank:pointerclick'),
      'blank:pointerdblclick': action('blank:pointerdblclick'),
      'cell:contextmenu': action('cell:contextmenu'),
      'cell:pointerclick': action('cell:pointerclick'),
      'cell:pointerdblclick': action('cell:pointerdblclick'),
      'cell:pointerdown': action('cell:pointerdown'),
      'cell:pointermove': action('cell:pointermove'),
      'cell:pointerup': action('cell:pointerup'),
      'element:contextmenu': action('element:contextmenu'),
      'element:mouseenter': action('element:mouseenter'),
      'element:mouseleave': action('element:mouseleave'),
      'element:pointerclick': action('element:pointerclick'),
      'element:pointerdblclick': action('element:pointerdblclick'),
      'element:pointerdown': action('element:pointerdown'),
      'element:pointermove': action('element:pointermove'),
      'element:pointerup': action('element:pointerup'),
      'link:contextmenu': action('link:contextmenu'),
      'link:mouseleave': action('link:mouseleave'),
      'link:pointerclick': action('link:pointerclick'),
      'link:pointerdblclick': action('link:pointerdblclick'),
      'link:pointerdown': action('link:pointerdown'),
      'link:pointermove': action('link:pointermove'),
      'link:pointerup': action('link:pointerup'),
      'link:snap:connect': action('link:snap:connect'),
      'link:snap:disconnect': action('link:snap:disconnect'),
      'paper:pan': action('paper:pan'),
      'paper:mouseenter': action('paper:mouseenter'),
      'paper:mouseleave': action('paper:mouseleave'),
      'paper:pinch': action('paper:pinch'),
      'render:done': action('render:done'),
      resize: action('resize'),
      scale: action('scale'),
      transform: action('transform'),
      translate: action('translate'),
    });
    return <Paper {...args} id={paperId} />;
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
    width: '100%',
    className: PAPER_CLASSNAME,
  },
  render: (args) => {
    const paperId = useId();
    usePaperEvents(paperId, {
      'link:mouseenter': (linkView) => {
        linkView.addTools(toolsView);
      },
      'link:mouseleave': (linkView) => {
        linkView.removeTools();
      },
    });
    return <Paper {...args} id={paperId} />;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shows how to add interactive tools to links. Hover over a link to see the custom button tool appear. Tools are added/removed dynamically using event handlers.',
      },
    },
  },
};

export const WithCustomEvent: Story = {
  args: {
    renderElement: RenderRectElement as never,
    width: '100%',
    className: PAPER_CLASSNAME,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Click a node to trigger `cell:pointerclick`, then emit `paper:test:custom` and inspect it in the Actions panel.',
      },
    },
  },
  render: (args) => {
    const paperId = useId();
    const onCellPointerClick = action('cell:pointerclick');
    const onCustomEvent = action('paper:test:custom');

    usePaperEvents(
      paperId,
      {
        'cell:pointerclick': (cellView, event, x, y) => {
          onCellPointerClick(cellView, event, x, y);
          cellView.paper?.trigger('paper:test:custom', { target: 'cell', x, y });
        },
        'paper:test:custom': onCustomEvent,
      }
    );
    return <Paper {...args} id={paperId} />;
  },
};

export const WithDrawGrid: Story = {
  args: {
    renderElement: RenderHTMLElement as never,
    className: PAPER_CLASSNAME,
    drawGrid: { name: 'dot', thickness: 2, color: 'white' },
    drawGridSize: 10,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Displays a visual grid overlay on the paper. Useful for alignment and design purposes. The grid can be customized with different patterns (dot, mesh, etc.) and colors.',
      },
    },
  },
};

export const WithOnClickColorChange: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates interactive element updates using `useCellActions`. Click on an element to change its color. This shows how to update element properties in response to user interactions.',
      },
    },
  },
  render: () => {
    const renderElement: RenderElement<SimpleElement> = ({ width, height, hoverColor }) => {
      const id = useCellId();
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
        elements={{
          '1': {
            width: 100,
            height: 40,
            label: 'Element 1',
            x: 50,
            y: 50,
            hoverColor: 'red',
          } satisfies StoryElementData,
          '2': {
            width: 100,
            height: 40,
            label: 'Element 1',
            x: 100,
            y: 250,
            hoverColor: 'red',
          } satisfies StoryElementData,
        }}
        links={{
          l1: {
            source: '1',
            target: '2',
            attrs: {
              line: {
                stroke: PRIMARY,
              },
            },
          },
        }}
      >
        <Paper
          id="main"
          useHTMLOverlay
          className={PAPER_CLASSNAME}
          height={400}
          renderElement={renderElement}
        />
      </GraphProvider>
    );
  },
};

export const WithDataWithoutWidthAndHeightAndXAndY: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates interactive element updates using `useCellActions`. Click on an element to change its color. This shows how to update element properties in response to user interactions.',
      },
    },
  },
  render: () => {
    const renderElement: RenderElement<SimpleElement> = ({ hoverColor }) => {
      const ref = useRef<SVGRectElement>(null);
      useNodeSize(ref, {
        transform: ({ x, y, width, height, id }) => {
          if (id === '1') {
            return {
              width,
              height,
              x: x + 200,
              y: y + 200,
            };
          }
          return {
            width,
            height,
            x,
            y,
          };
        },
      });
      return (
        <>
          <div></div>
          <rect ref={ref} width={150} height={30} fill={hoverColor} rx={10} ry={10} />;
        </>
      );
    };
    return (
      <GraphProvider
        elements={{
          '1': {
            label: 'Element 1',
            hoverColor: 'red',
            somethingMine: true,
          } satisfies StoryElementData,
          '2': { label: 'Element 1', hoverColor: 'red' } satisfies StoryElementData,
        }}
        links={{
          l1: {
            source: '1',
            target: '2',
            attrs: {
              line: {
                stroke: PRIMARY,
              },
            },
          },
        }}
      >
        <Paper id="main" className={PAPER_CLASSNAME} height={400} renderElement={renderElement} />
      </GraphProvider>
    );
  },
};
