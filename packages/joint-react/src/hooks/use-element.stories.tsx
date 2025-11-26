import { useElement } from './use-element';
import { SimpleRenderItemDecorator } from '../../.storybook/decorators/with-simple-data';
import type { Meta } from '@storybook/react';
import { HookTester, type TesterHookStory } from '../stories/utils/hook-tester';
import { makeRootDocumentation, makeStory } from '../stories/utils/make-story';
import { getAPILink } from '../stories/utils/get-api-documentation-link';

const API_URL = getAPILink('useElement');

const meta: Meta<typeof HookTester> = {
  title: 'Hooks/useElement',
  component: HookTester,
  decorators: [SimpleRenderItemDecorator],
  tags: ['hook'],
  parameters: makeRootDocumentation({
    apiURL: API_URL,
    description: `
The **useElement** hook provides access to the current element's data within a \`renderElement\` function. It supports selector functions for optimized re-renders, only updating when selected properties change.

**Key Features:**
- Returns the full element object by default
- Supports selector functions for performance optimization
- Only re-renders when selected properties change
- Must be used inside \`renderElement\` prop
    `,
    usage: `
\`\`\`tsx
import { useElement } from '@joint/react';

// Get full element
function Component() {
  const element = useElement();
  return <div>ID: {element.id}, Position: ({element.x}, {element.y})</div>;
}

// Get specific properties (optimized)
function OptimizedComponent() {
  const { x, y } = useElement((el) => ({ x: el.x, y: el.y }));
  return <div>Position: ({x}, {y})</div>;
}
\`\`\`
    `,
    props: `
- **selector** (optional): Function that selects specific properties from the element
  - Returns: Selected properties or full element if no selector provided
  - Re-renders only when selected properties change
    `,
    code: `import { useElement } from '@joint/react'

function Component() {
  const element = useElement();
  return <div>Element ID: {element.id}</div>;
}

// With selector for optimization
function OptimizedComponent() {
  const position = useElement((el) => ({ x: el.x, y: el.y }));
  return <div>Position: ({position.x}, {position.y})</div>;
}`,
  }),
};

export default meta;

type Story = TesterHookStory<typeof useElement>;

export const WithId = makeStory<Story>({
  args: {
    useHook: useElement,
    hookArgs: [(element) => element.id],
  },
  apiURL: API_URL,
  code: `import { useElement } from '@joint/react'

function Component() {  
  const elementId = useElement((element) => element.id);
  return <div>Element ID: {elementId}</div>;
}`,
  description:
    'Extracts only the element ID using a selector function. The component will only re-render when the ID changes, not when other element properties change.',
  details:
    '**Performance Tip:** Using a selector function ensures the component only re-renders when the selected property (ID) changes, improving performance.',
});

export const WithCoordinates = makeStory<Story>({
  args: {
    useHook: useElement,
    hookArgs: [(element) => ({ x: element.x, y: element.y })],
  },
  apiURL: API_URL,
  code: `import { useElement } from '@joint/react'

function Component() {
  const { x, y } = useElement((element) => ({ 
    x: element.x, 
    y: element.y 
  }));
  return <div>Position: ({x}, {y})</div>;
}`,
  description:
    'Extracts element coordinates (x, y) using a selector function. The component re-renders only when the position changes, not when other properties like size or color change.',
  details:
    "**Use Case:** Perfect for displaying position information or creating position-dependent UI elements that don't need to update when other element properties change.",
});
