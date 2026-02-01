/* eslint-disable react-perf/jsx-no-new-function-as-prop */

import { useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import { ReactPaper } from './react-paper';
import { GraphProvider } from '../graph/graph-provider';
import { useLinkLayout } from '../../hooks/use-link-layout';
import { useNodeSize } from '../../hooks/use-node-size';
import { getAPILink } from '../../stories/utils/get-api-documentation-link';
import { makeRootDocumentation } from '../../stories/utils/make-story';
import type { GraphElement } from '../../types/element-types';
import type { GraphLink } from '../../types/link-types';

export type Story = StoryObj<typeof ReactPaper>;

const API_URL = getAPILink('ReactPaper', 'variables');

const meta: Meta<typeof ReactPaper> = {
  title: 'Experimental/ReactPaper',
  component: ReactPaper,
  tags: ['component'],
  parameters: makeRootDocumentation({
    description: `
**ReactPaper** is an experimental alternative to the standard Paper component that renders graph elements using React DOM directly instead of JointJS portals.

**Key Differences from Paper:**
- Elements are rendered as native React components
- No portal-based rendering - direct SVG element creation
- Same GraphProvider/state integration
- Uses ControlledPaper internally for JointJS interaction handling

**API:**
- \`renderElement(element)\` receives user data from GraphProvider (same as Paper)
- \`renderLink(link)\` receives user data from GraphProvider (same as Paper)
- Inside \`renderLink\`, use \`useLinkLayout()\` to get computed path data

**Use Cases:**
- When you need full React control over element rendering
- For simpler SVG-only diagrams without complex JointJS features
- Testing and experimental implementations
    `,
    usage: `
\`\`\`tsx
import { GraphProvider, ReactPaper, useLinkLayout } from '@joint/react';

function MyLink() {
  const layout = useLinkLayout();
  if (!layout) return null;
  return <path d={layout.d} stroke="gray" strokeWidth={2} fill="none" />;
}

function MyDiagram() {
  return (
    <GraphProvider elements={elements} links={links}>
      <ReactPaper
        renderElement={({ id, width, height }) => (
          <g>
            <rect width={width} height={height} fill="blue" rx={4} />
            <text x={width/2} y={height/2} textAnchor="middle">{id}</text>
          </g>
        )}
        renderLink={() => <MyLink />}
      />
    </GraphProvider>
  );
}
\`\`\`
    `,
    props: `
- **renderElement**: Function that receives element data and returns SVG content
- **renderLink**: Optional function to render links. Use useLinkLayout() inside for path data.
- **width/height**: Paper dimensions (supports numbers or CSS strings)
- **className**: CSS class for styling
- **gridSize**: Grid size for snapping (default: 1)
- **interactive**: Enable/disable interactions (default: true)
- **children**: Additional React children
    `,
    apiURL: API_URL,
    code: `import { GraphProvider, ReactPaper, useLinkLayout } from '@joint/react'

function MyLink() {
  const layout = useLinkLayout();
  if (!layout) return null;
  return <path d={layout.d} stroke="gray" fill="none" />;
}

<GraphProvider elements={elements} links={links}>
  <ReactPaper
    renderElement={({ width, height }) => (
      <rect width={width} height={height} fill="blue" rx={4} />
    )}
    renderLink={() => <MyLink />}
  />
</GraphProvider>
    `,
  }),
};

export default meta;

/**
 * Link component that uses useLinkLayout hook to get path data.
 */
function DefaultLink() {
  const layout = useLinkLayout();
  if (!layout) return null;
  return <path d={layout.d} stroke="#333" strokeWidth={2} fill="none" strokeLinejoin="round" />;
}

function ArrowLink() {
  const layout = useLinkLayout();
  if (!layout) return null;
  return (
    <>
      <path d={layout.d} stroke="#764ba2" strokeWidth={3} fill="none" strokeLinecap="round" />
      <circle cx={layout.targetX} cy={layout.targetY} r={5} fill="#764ba2" />
      <circle cx={layout.sourceX} cy={layout.sourceY} r={5} fill="#764ba2" />
    </>
  );
}

/**
 * Dashed link style.
 */
function DashedLink() {
  const layout = useLinkLayout();
  if (!layout) return null;
  return <path d={layout.d} stroke="#764ba2" strokeWidth={2} fill="none" strokeDasharray="5,5" />;
}

/**
 * Default elements with explicit size for basic stories.
 */
const defaultElements: Record<string, GraphElement> = {
  e1: { x: 50, y: 50, width: 120, height: 60 },
  e2: { x: 300, y: 50, width: 120, height: 60 },
  e3: { x: 175, y: 200, width: 120, height: 60 },
};

/**
 * Default links connecting the elements.
 */
const defaultLinks: Record<string, GraphLink> = {
  l1: { source: 'e1', target: 'e2' },
  l2: { source: 'e1', target: 'e3' },
  l3: { source: 'e2', target: 'e3' },
};

export const Basic: Story = {
  render: () => (
    <GraphProvider elements={defaultElements} links={defaultLinks}>
      <ReactPaper
        width="100%"
        height={400}
        className={PAPER_CLASSNAME}
        renderElement={(element) => (
          <g>
            <rect
              width={element.width}
              height={element.height}
              fill={PRIMARY}
              stroke="#2C5B8F"
              strokeWidth={2}
              rx={4}
            />
            <text
              x={(element.width ?? 100) / 2}
              y={(element.height ?? 100) / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize={12}
              fontFamily="sans-serif"
            >
              {String(element.id)}
            </text>
          </g>
        )}
        renderLink={() => <DefaultLink />}
      />
    </GraphProvider>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Basic ReactPaper usage with simple SVG rectangles and text labels. Elements are rendered using pure React components. Use useLinkLayout() inside renderLink to access path data.',
      },
    },
  },
};

export const CustomLinks: Story = {
  render: () => (
    <GraphProvider elements={defaultElements} links={defaultLinks}>
      <ReactPaper
        width="100%"
        height={400}
        className={PAPER_CLASSNAME}
        renderElement={(element) => (
          <rect width={element.width} height={element.height} fill="#667eea" rx={8} />
        )}
        renderLink={() => <ArrowLink />}
      />
    </GraphProvider>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates custom link rendering with arrows. The `renderLink` prop allows full control over link appearance. Use useLinkLayout() to get sourceX, sourceY, targetX, targetY, and d (path string).',
      },
    },
  },
};

export const GradientElements: Story = {
  render: () => (
    <GraphProvider elements={defaultElements} links={defaultLinks}>
      <ReactPaper
        width="100%"
        height={400}
        className={PAPER_CLASSNAME}
        renderElement={(element) => (
          <g>
            <defs>
              <linearGradient id={`grad-${element.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#667eea" />
                <stop offset="100%" stopColor="#764ba2" />
              </linearGradient>
            </defs>
            <rect
              width={element.width}
              height={element.height}
              fill={`url(#grad-${element.id})`}
              rx={12}
            />
            <text
              x={(element.width ?? 100) / 2}
              y={(element.height ?? 100) / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize={14}
              fontWeight="bold"
              fontFamily="sans-serif"
            >
              {String(element.id)}
            </text>
          </g>
        )}
        renderLink={() => <DashedLink />}
      />
    </GraphProvider>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Shows advanced SVG features like gradients and dashed links. Each element has its own gradient definition.',
      },
    },
  },
};

/**
 * Elements without explicit size - useNodeSize measures them.
 */
const elementsWithoutSize: Record<string, GraphElement> = {
  e1: { x: 50, y: 50, label: 'Node 1' },
  e2: { x: 300, y: 50, label: 'Node 2' },
  e3: { x: 175, y: 200, label: 'Node 3' },
} as Record<string, GraphElement>;

/**
 * Element component that uses useNodeSize to auto-measure dimensions.
 */
function AutoSizedElement({ label }: Readonly<{ label?: string }>) {
  const ref = useRef<SVGRectElement>(null);
  useNodeSize(ref);

  return (
    <g>
      <rect ref={ref} width={120} height={50} fill={PRIMARY} rx={8} />
      <text
        x={60}
        y={25}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontSize={12}
        fontFamily="sans-serif"
      >
        {label ?? 'Node'}
      </text>
    </g>
  );
}

export const WithAutoNodeSize: Story = {
  render: () => (
    <GraphProvider elements={elementsWithoutSize} links={defaultLinks}>
      <ReactPaper
        width="100%"
        height={400}
        className={PAPER_CLASSNAME}
        renderElement={(element) => (
          <AutoSizedElement label={(element as GraphElement & { label?: string }).label} />
        )}
        renderLink={() => <DefaultLink />}
      />
    </GraphProvider>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates `useNodeSize` hook for auto-measuring element dimensions. Elements are defined without explicit width/height - the hook measures the rendered SVG rect and updates the model.',
      },
    },
  },
};

/**
 * Elements for native link rendering story.
 */
const nativeLinksElements: Record<string, GraphElement> = {
  e1: { x: 50, y: 100, width: 120, height: 60 },
  e2: { x: 300, y: 100, width: 120, height: 60 },
  e3: { x: 175, y: 250, width: 120, height: 60 },
};

/**
 * Links with styling attrs for native JointJS rendering.
 */
const nativeLinks: Record<string, GraphLink> = {
  l1: { source: 'e1', target: 'e2', attrs: { line: { stroke: '#764ba2', strokeWidth: 3 } } },
  l2: { source: 'e1', target: 'e3', attrs: { line: { stroke: '#667eea', strokeWidth: 2 } } },
  l3: {
    source: 'e2',
    target: 'e3',
    attrs: { line: { stroke: 'magenta', strokeWidth: 2, strokeDasharray: '5,5' } },
  },
};

export const WithNativeLinks: Story = {
  render: () => (
    <GraphProvider elements={nativeLinksElements} links={nativeLinks}>
      <ReactPaper
        width="100%"
        height={400}
        className={PAPER_CLASSNAME}
        renderElement={(element) => (
          <g>
            <rect
              width={element.width}
              height={element.height}
              fill={PRIMARY}
              stroke="#2C5B8F"
              strokeWidth={2}
              rx={4}
            />
            <text
              x={(element.width ?? 100) / 2}
              y={(element.height ?? 100) / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize={12}
              fontFamily="sans-serif"
            >
              {String(element.id)}
            </text>
          </g>
        )}
        // No renderLink - JointJS renders links natively
      />
    </GraphProvider>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates ReactPaper with native JointJS link rendering. When `renderLink` is not provided, JointJS renders links using their standard LinkView and markup. Link styling is controlled via `attrs` in the link data.',
      },
    },
  },
};
