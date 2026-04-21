/* eslint-disable react-perf/jsx-no-new-object-as-prop */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { testElements, testLinks } from '../../../.storybook/decorators/with-simple-data';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import { useEffect, useRef, useState } from 'react';
import { useMeasureNode } from '../../hooks/use-measure-node';
import { useElementSize } from '../../hooks/use-element-size';
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
The **GraphProvider** component provides a shared Graph context for all its descendants.

**Modes (per stream — elements and links are independent):**
- **Uncontrolled:** Pass \`initialElements\` / \`initialLinks\`. JointJS owns the data after mount.
- **Controlled:** Pass \`elements\` + \`onElementsChange\` (and/or \`links\` + \`onLinksChange\`). React owns the data; the graph stays in sync.
- **Mixed:** Any combination — e.g. controlled elements + uncontrolled links — is supported.

**Notifications:**
- \`onElementsChange\` / \`onLinksChange\` fire in both modes. In uncontrolled mode they are notification-only.
- \`onIncrementalChange\` is orthogonal; fires in any mode with granular added/changed/removed sets.

**Key Features:**
- Manages graph state for elements and links.
- Provides context for hooks like \`useElement\`, \`useLinks\`, \`useElements\`.
- Supports multiple Paper instances within the same provider.
- Handles graph updates and subscriptions efficiently.
    `,
    usage: `
\`\`\`tsx
import { GraphProvider, Paper } from '@joint/react';

const initialElements = {
  '1': { x: 100, y: 100, width: 100, height: 50 },
  '2': { x: 250, y: 200, width: 100, height: 50 },
};

const initialLinks = {
  'l1': { source: '1', target: '2' },
};

function RenderElement() {
  return <rect width={100} height={50} fill="blue" />;
}

function MyDiagram() {
  return (
    <GraphProvider initialElements={initialElements} initialLinks={initialLinks}>
      <Paper renderElement={RenderElement} />
    </GraphProvider>
  );
}
\`\`\`
    `,
    props: `
- **initialElements** / **initialLinks**: uncontrolled record of cells (used on mount; JointJS owns the data after).
- **elements** / **links**: controlled record of cells (each pairs with its onChange callback).
- **onElementsChange** / **onLinksChange**: notification in uncontrolled mode; required write-back in controlled mode.
- **onIncrementalChange**: granular add/change/remove sets — works in any mode.
- **graph**: optional pre-built JointJS \`dia.Graph\` instance.
- **store**: optional pre-built \`GraphStore\` instance.
- **children**: React nodes (typically Paper components).
    `,
    apiURL: API_URL,
    code: `import { GraphProvider, Paper } from '@joint/react'

<GraphProvider initialElements={initialElements} initialLinks={initialLinks}>
  <Paper renderElement={RenderElement} />
</GraphProvider>
    `,
  }),
};

export default meta;

function RenderHTMLElement() {
  const elementRef = useRef<HTMLDivElement>(null);
  const size = useElementSize();
  useMeasureNode(elementRef);
  return (
    <foreignObject joint-selector="placeholder" width={size?.width} height={size?.height}>
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

export const Default: Story = {
  args: {
    initialElements: testElements,
    initialLinks: testLinks,
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
    initialElements: testElements,
    initialLinks: testLinks,
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
