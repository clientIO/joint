/* eslint-disable react-perf/jsx-no-new-object-as-prop */

import type { Meta, StoryObj } from '@storybook/react';
import {
  testElements,
  testLinks,
  type SimpleElement,
} from '../../../.storybook/decorators/with-simple-data';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import { useEffect, useRef, useState } from 'react';
import { useNodeSize } from '../../hooks/use-node-size';
import { getAPILink } from '../../stories/utils/get-api-documentation-link';
import { makeRootDocumentation } from '../../stories/utils/make-story';
import { GraphProvider } from './graph-provider';
import { Paper } from '../paper/paper';

export type Story = StoryObj<typeof GraphProvider>;

const API_URL = getAPILink('GraphProvider', 'variables');
const meta: Meta<typeof GraphProvider> = {
  title: 'Components/GraphProvider',
  component: GraphProvider,
  tags: ['component'],
  parameters: makeRootDocumentation({
    description: `
The **GraphProvider** component provides a shared Graph context for all its descendants. It manages the graph state (elements and links) and makes it available to child components through React context.

**Key Features:**
- Manages graph state (elements and links)
- Provides context for hooks like \`useElement\`, \`useLinks\`, \`useElements\`
- Supports multiple Paper instances within the same provider
- Handles graph updates and subscriptions efficiently
    `,
    usage: `
\`\`\`tsx
import { GraphProvider, Paper } from '@joint/react';

const elements = [
  { id: '1', x: 100, y: 100, width: 100, height: 50 },
  { id: '2', x: 250, y: 200, width: 100, height: 50 },
];

const links = [
  { id: 'l1', source: '1', target: '2' },
];

function MyDiagram() {
  return (
    <GraphProvider elements={elements} links={links}>
      <Paper 
        renderElement={({ width, height }) => (
          <rect width={width} height={height} fill="blue" />
        )}
      />
    </GraphProvider>
  );
}
\`\`\`
    `,
    props: `
- **elements**: Array of element objects (required)
- **links**: Array of link objects (required)
- **children**: React nodes (typically Paper components)
- **onChange**: Callback fired when graph state changes
    `,
    apiURL: API_URL,
    code: `import { GraphProvider, Paper } from '@joint/react'

<GraphProvider elements={elements} links={links}>
  <Paper renderElement={RenderElement} />
</GraphProvider>
    `,
  }),
};

export default meta;

function RenderHTMLElement({ width, height }: SimpleElement) {
  const elementRef = useRef<HTMLDivElement>(null);
  useNodeSize(elementRef);
  return (
    <foreignObject joint-selector="placeholder" width={width} height={height}>
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

export const Default: Story = {
  args: {
    elements: testElements,
    links: testLinks,
    children: <Paper className={PAPER_CLASSNAME} renderElement={RenderHTMLElement} />,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Basic usage of GraphProvider wrapping a Paper component. The provider manages the graph state and makes it available to all child components.',
      },
    },
  },
};
function Component() {
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line @eslint-react/web-api/no-leaked-timeout
    setTimeout(() => {
      setIsReady(true);
    }, 1000);
  }, []);
  return isReady && <Paper className={PAPER_CLASSNAME} renderElement={RenderHTMLElement} />;
}

export const ConditionalRender: Story = {
  args: {
    elements: testElements,
    links: testLinks,
    children: <Component />,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates that GraphProvider works with conditionally rendered children. The graph state is maintained even when child components mount/unmount.',
      },
    },
  },
};
