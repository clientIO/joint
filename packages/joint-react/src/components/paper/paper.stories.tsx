/* eslint-disable no-shadow */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */

import React, { useId } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SimpleGraphDecorator } from '../../../.storybook/decorators/with-simple-data';
import { action } from 'storybook/actions';
import { dia, linkTools } from '@joint/core';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import { useMeasureNode } from '../../hooks/use-measure-node';
import { getAPILink } from '../../stories/utils/get-api-documentation-link';
import { makeRootDocumentation } from '../../stories/utils/make-story';
import { jsx } from '../../utils/joint-jsx/jsx-to-markup';
import { useNodesMeasuredEffect } from '../../hooks/use-node-measured-effect';
import { usePaperEvents } from '../../hooks/use-paper-events';
import { Paper } from './paper';
import { useElementSize } from '../../hooks/use-element-size';

export type Story = StoryObj<typeof Paper>;

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
import { GraphProvider, Paper, useElementSize } from '@joint/react';

function RenderElement() {
  const size = useElementSize();
  return (
    <rect
      rx={10}
      ry={10}
      width={size?.width}
      height={size?.height}
      fill="blue"
    />
  );
}

function MyDiagram() {
  return (
    <GraphProvider elements={elements} links={links}>
      <Paper
        renderElement={RenderElement}
        height={600}
      />
    </GraphProvider>
  );
}
\`\`\`
    `,
    props: `
- **renderElement**: Function that receives user data and returns SVG/HTML content
- **width/height**: Paper dimensions (supports numbers or CSS strings)
- **scale**: Zoom level (default: 1)
- **className**: CSS class for styling
- **drawGrid**: Grid configuration for visual guides
- **Events**: Subscribe with \`usePaperEvents\` using raw JointJS names (e.g. \`cell:pointerclick\`, \`link:mouseenter\`)
    `,
    apiURL: API_URL,
    code: `import { GraphProvider, Paper, useElementSize } from '@joint/react'

function RenderElement() {
  const size = useElementSize();
  return <rect rx={10} ry={10} width={size?.width} height={size?.height} fill="blue" />;
}

<GraphProvider elements={elements} links={links}>
  <Paper renderElement={RenderElement} height={600} />
</GraphProvider>
    `,
  }),
};

export default meta;

function RenderRectElement() {
  const size = useElementSize();
  return <rect rx={10} ry={10} {...size} fill={PRIMARY} />;
}

function RenderHTMLElement() {
  const size = useElementSize();
  const elementRef = React.useRef<HTMLDivElement>(null);
  useMeasureNode(elementRef);
  return (
    <foreignObject width={size?.width} height={size?.height}>
      <div
        ref={elementRef}
        style={{
          width: size?.width,
          height: size?.height,
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
    renderElement: RenderRectElement,
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
    width: '100%',
    className: PAPER_CLASSNAME,
  },
  render: (args) => {
    const paperId = useId();
    useNodesMeasuredEffect(paperId, action('onElementsMeasured'));
    usePaperEvents(paperId, {
      'link:mouseenter': (...args) => action('link:mouseenter')(...args),
      'cell:mouseenter': (...args) => action('cell:mouseenter')(...args),
      'blank:contextmenu': (...args) => action('blank:contextmenu')(...args),
      'blank:pointermove': (...args) => action('blank:pointermove')(...args),
      'blank:pointerup': (...args) => action('blank:pointerup')(...args),
      'blank:pointerdown': (...args) => action('blank:pointerdown')(...args),
      'blank:pointerclick': (...args) => action('blank:pointerclick')(...args),
      'blank:pointerdblclick': (...args) => action('blank:pointerdblclick')(...args),
      'cell:contextmenu': (...args) => action('cell:contextmenu')(...args),
      'cell:pointerclick': (...args) => action('cell:pointerclick')(...args),
      'cell:pointerdblclick': (...args) => action('cell:pointerdblclick')(...args),
      'cell:pointerdown': (...args) => action('cell:pointerdown')(...args),
      'cell:pointermove': (...args) => action('cell:pointermove')(...args),
      'cell:pointerup': (...args) => action('cell:pointerup')(...args),
      'element:contextmenu': (...args) => action('element:contextmenu')(...args),
      'element:mouseenter': (...args) => action('element:mouseenter')(...args),
      'element:mouseleave': (...args) => action('element:mouseleave')(...args),
      'element:pointerclick': (...args) => action('element:pointerclick')(...args),
      'element:pointerdblclick': (...args) => action('element:pointerdblclick')(...args),
      'element:pointerdown': (...args) => action('element:pointerdown')(...args),
      'element:pointermove': (...args) => action('element:pointermove')(...args),
      'element:pointerup': (...args) => action('element:pointerup')(...args),
      'link:contextmenu': (...args) => action('link:contextmenu')(...args),
      'link:mouseleave': (...args) => action('link:mouseleave')(...args),
      'link:pointerclick': (...args) => action('link:pointerclick')(...args),
      'link:pointerdblclick': (...args) => action('link:pointerdblclick')(...args),
      'link:pointerdown': (...args) => action('link:pointerdown')(...args),
      'link:pointermove': (...args) => action('link:pointermove')(...args),
      'link:pointerup': (...args) => action('link:pointerup')(...args),
      'link:snap:connect': (...args) => action('link:snap:connect')(...args),
      'link:snap:disconnect': (...args) => action('link:snap:disconnect')(...args),
      'paper:pan': (...args) => action('paper:pan')(...args),
      'paper:mouseenter': (...args) => action('paper:mouseenter')(...args),
      'paper:mouseleave': (...args) => action('paper:mouseleave')(...args),
      'paper:pinch': (...args) => action('paper:pinch')(...args),
      'render:done': (...args) => action('render:done')(...args),
      resize: (...args) => action('resize')(...args),
      scale: (...args) => action('scale')(...args),
      transform: (...args) => action('transform')(...args),
      translate: (...args) => action('translate')(...args),
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
      'link:mouseenter': (linkView: dia.LinkView) => {
        linkView.addTools(toolsView);
      },
      'link:mouseleave': (linkView: dia.LinkView) => {
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
    renderElement: RenderRectElement,
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

    usePaperEvents(paperId, {
      'cell:pointerclick': (cellView: dia.CellView, event: dia.Event, x: number, y: number) => {
        onCellPointerClick(cellView, event, x, y);
        cellView.paper?.trigger('paper:test:custom', { target: 'cell', x, y });
      },
      'paper:test:custom': (...args: unknown[]) => onCustomEvent(...args),
    });
    return <Paper {...args} id={paperId} />;
  },
};
