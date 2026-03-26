import type { Meta, StoryObj } from '@storybook/react-vite';
import { DataRenderer, SimpleGraphDecorator } from '../../.storybook/decorators/with-simple-data';
import { useLinksData } from './use-links-data';
import { getAPILink } from '../stories/utils/get-api-documentation-link';
import { HookTester } from '../stories/utils/hook-tester';
import { makeRootDocumentation, makeStory } from '../stories/utils/make-story';

const API_URL = getAPILink('useLinksData');

export type Story = StoryObj<typeof HookTester>;

const meta: Meta<typeof HookTester> = {
  title: 'Hooks/useLinksData',
  component: HookTester,
  decorators: [SimpleGraphDecorator],
  tags: ['hook'],
  parameters: makeRootDocumentation({
    apiURL: API_URL,
    description: `
The **useLinksData** hook provides access to all links in the graph. It supports selector functions for optimized re-renders, only updating when selected link properties change.

**Key Features:**
- Returns all links in the graph as a Map keyed by ID
- Supports selector functions for performance optimization
- Only re-renders when selected properties change
- Can be used anywhere within GraphProvider context
    `,
    usage: `
\`\`\`tsx
import { useLinksData } from '@joint/react';

// Get all links (returns Map<CellId, CellData>)
function Component() {
  const links = useLinksData();
  return <div>Total links: {links.size}</div>;
}

// Get specific properties (optimized)
function OptimizedComponent() {
  const linkIds = useLinksData((links) => [...links.values()].map(link => link.id));
  return <div>Link IDs: {linkIds.join(', ')}</div>;
}
\`\`\`
    `,
    props: `
- **selector** (optional): Function that transforms the links Map
  - Returns: Transformed links data or full links Map if no selector provided
  - Re-renders only when selected properties change
    `,
    code: `import { useLinksData } from '@joint/react'

function Component() {
  const links = useLinksData();
  return <div>Total links: {links.size}</div>;
}

// With selector for optimization
function OptimizedComponent() {
  const linkIds = useLinksData((links) => [...links.values()].map(link => link.id));
  return <div>Link IDs: {linkIds.join(', ')}</div>;
}`,
  }),
};

export default meta;

export const GetAllLinks: Story = makeStory<Story>({
  args: {
    useHook: useLinksData,
    hookArgs: [],
    render: (result) => <DataRenderer data={result} name="All Links" />,
  },
  apiURL: API_URL,
  code: `import { useLinksData } from '@joint/react'

function Component() {
  const links = useLinksData(); // returns Map<CellId, CellData>
  return (
    <div>
      <p>Total links: {links.size}</p>
      <pre>{JSON.stringify([...links.entries()], null, 2)}</pre>
    </div>
  );
}`,
  description:
    'Retrieves all links in the graph as a Map keyed by ID. The component re-renders whenever any link is added, removed, or modified.',
  details:
    '**Use Case:** Display link count, render link lists, or perform operations on all links.',
});

export const GetLinkIds: Story = makeStory<Story>({
  args: {
    useHook: useLinksData,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    hookArgs: [(links: any) => [...links.values()].map((link: any) => link.id)],
    render: (result) => <DataRenderer data={result} name="Link IDs" />,
  },
  apiURL: API_URL,
  code: `import { useLinksData } from '@joint/react'

function Component() {
  const linkIds = useLinksData((links) => [...links.values()].map(link => link.id));
  return <div>Link IDs: {linkIds.join(', ')}</div>;
}`,
  description:
    'Extracts only link IDs using a selector function. The component re-renders only when links are added or removed, not when link properties (like position or style) change.',
  details:
    '**Performance Tip:** Using a selector ensures the component only re-renders when the link count changes, not when individual link properties are updated.',
});
