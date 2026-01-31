/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import { DataRenderer, SimpleGraphDecorator } from '../../.storybook/decorators/with-simple-data';
import type { Meta } from '@storybook/react-vite';
import { HookTester, type TesterHookStory } from '../stories/utils/hook-tester';
import { useElements } from './use-elements';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import { getAPILink } from '../stories/utils/get-api-documentation-link';
import { makeRootDocumentation, makeStory } from '../stories/utils/make-story';
import { Paper } from '../components/paper/paper';

const API_URL = getAPILink('useElements');

const meta: Meta<typeof HookTester> = {
  title: 'Hooks/useElements useLinks',
  component: HookTester,
  decorators: [SimpleGraphDecorator],
  tags: ['hook'],
  parameters: makeRootDocumentation({
    apiURL: API_URL,
    description: `
The **useElements** hook provides access to all elements in the graph. It supports selector functions for optimized re-renders, only updating when selected element properties change.

**Key Features:**
- Returns all elements in the graph as a Record keyed by ID
- Supports selector functions for performance optimization
- Only re-renders when selected properties change
- Can be used anywhere within GraphProvider context
    `,
    usage: `
\`\`\`tsx
import { useElements } from '@joint/react';

// Get all elements (returns Record<string, GraphElement>)
function Component() {
  const elements = useElements();
  return <div>Total elements: {Object.keys(elements).length}</div>;
}

// Get specific properties (optimized)
function OptimizedComponent() {
  const elementIds = useElements((elements) =>
    Object.values(elements).map(element => element.id)
  );
  return <div>Element IDs: {elementIds.join(', ')}</div>;
}
\`\`\`
    `,
    props: `
- **selector** (optional): Function that transforms the elements Record
  - Returns: Transformed elements data or full elements Record if no selector provided
  - Re-renders only when selected properties change
    `,
    code: `import { useElements } from '@joint/react'

function Component() {
  const elements = useElements();
  return <div>Total elements: {Object.keys(elements).length}</div>;
}

// With selector for optimization
function OptimizedComponent() {
  const elementIds = useElements((elements) =>
    Object.values(elements).map(element => element.id)
  );
  return <div>Element IDs: {elementIds.join(', ')}</div>;
}`,
  }),
};

export default meta;

type Story = TesterHookStory<typeof useElements>;

export const Default = makeStory<Story>({
  args: {
    useHook: useElements,
    hookArgs: [],
    render: (result) => (
      <div>
        <Paper
          width="100%"
          className={PAPER_CLASSNAME}
          renderElement={({ width, height }) => {
            return <rect width={width} height={height} fill={PRIMARY} />;
          }}
        />
        <DataRenderer data={result} name="All Elements" />
      </div>
    ),
  },
  apiURL: API_URL,
  code: `import { useElements } from '@joint/react'

function Component() {
  const elements = useElements(); // returns Record<string, GraphElement>
  return <div>elements are: {JSON.stringify(elements)}</div>;
}`,
  description: 'Get all elements as a Record keyed by ID.',
});

export const WithSelectedJustIds = makeStory<Story>({
  args: {
    useHook: useElements,
    hookArgs: [(elements) => Object.values(elements).map((element) => element.id)],
    render: (result) => (
      <span>
        <Paper
          width="100%"
          className={PAPER_CLASSNAME}
          renderElement={({ width, height }) => {
            return <rect width={width} height={height} fill={PRIMARY} />;
          }}
        />
        <DataRenderer data={result} name="Element IDs" />
      </span>
    ),
  },
  apiURL: API_URL,
  code: `import { useElements } from '@joint/react'

function Component() {
  const elementIds = useElements((elements) => Object.values(elements).map((element) => element.id));
  return <div>element ids are: {JSON.stringify(elementIds)}</div>;
}`,
  description: 'Get the ids of the elements.',
});

export const WithGetJustSize = makeStory<Story>({
  args: {
    useHook: useElements,
    hookArgs: [(elements) => Object.keys(elements).length],
    render: (result) => (
      <div>
        <Paper
          width="100%"
          className={PAPER_CLASSNAME}
          renderElement={({ width, height }) => {
            return <rect width={width} height={height} fill={PRIMARY} />;
          }}
        />
        <DataRenderer data={result} name="Size of Elements" />
      </div>
    ),
  },
  apiURL: API_URL,
  code: `import { useElements } from '@joint/react'

function Component() {
  const size = useElements((elements) => Object.keys(elements).length);
  return <div>size of elements is: {JSON.stringify(size)}</div>;
}`,
  description: 'Get the size of the elements.',
});

export const WithJustPosition = makeStory<Story>({
  args: {
    useHook: useElements,
    hookArgs: [
      (elements) =>
        Object.values(elements).map((element) => ({
          x: element.x,
          y: element.y,
        })),
    ],
    render: (result) => (
      <div>
        <Paper
          width="100%"
          className={PAPER_CLASSNAME}
          renderElement={({ width, height }) => {
            return <rect width={width} height={height} fill={PRIMARY} />;
          }}
        />
        <DataRenderer data={result} name="Position" />
      </div>
    ),
  },
  apiURL: API_URL,
  code: `import { useElements } from '@joint/react'

function Component() {
  const positions = useElements((elements) =>
    Object.values(elements).map((element) => ({ x: element.x, y: element.y }))
  );
  return <div>positions are: {JSON.stringify(positions)}</div>;
}`,
  description: 'Get the positions of the elements.',
});

export const WithJustPositionButNotReRenderBecauseCompareFN = makeStory<Story>({
  args: {
    useHook: useElements,
    hookArgs: [
      (elements) =>
        Object.values(elements).map((element) => ({
          x: element.x,
          y: element.y,
        })),
      (_previous, _next) => true,
    ],
    render: (result) => (
      <div>
        <Paper
          width="100%"
          className={PAPER_CLASSNAME}
          renderElement={({ width, height }) => {
            return <rect width={width} height={height} fill={PRIMARY} />;
          }}
        />
        <DataRenderer data={result} name="Position" />
      </div>
    ),
  },
  apiURL: API_URL,
  code: `import { useElements } from '@joint/react'

function Component() {
  const positions = useElements(
    (elements) => Object.values(elements).map((element) => ({ x: element.x, y: element.y })),
    (_previous, _next) => true
  );
  return <div>positions are: {JSON.stringify(positions)}</div>;
}`,
  description:
    'Get the positions of the elements but do not re-render because of custom compare function.',
});

export const WithAdditionalData = makeStory<Story>({
  args: {
    useHook: useElements,
    hookArgs: [(elements) => Object.values(elements).map((element) => ({ id: element.id, other: 'something' }))],
    render: (result) => (
      <div>
        <Paper
          width="100%"
          className={PAPER_CLASSNAME}
          renderElement={({ width, height }) => {
            return <rect width={width} height={height} fill={PRIMARY} />;
          }}
        />
        <DataRenderer data={result} name="Element with new data" />
      </div>
    ),
  },
  apiURL: API_URL,
  code: `import { useElements } from '@joint/react'

function Component() {
  const elements = useElements((elements) =>
    Object.values(elements).map((element) => ({ id: element.id, data: element.data, other: 'something' }))
  );
  return <div>elements with new data are: {JSON.stringify(elements)}</div>;
}`,
  description: 'Get the elements with additional data.',
});
