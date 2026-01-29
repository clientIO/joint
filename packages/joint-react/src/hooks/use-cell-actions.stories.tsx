/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import type { Meta, StoryObj } from '@storybook/react';
import type { SimpleElement } from '../../.storybook/decorators/with-simple-data';
import { HTMLNode, RenderItemDecorator } from '../../.storybook/decorators/with-simple-data';
import '../stories/examples/index.css';
import { BUTTON_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import { makeRootDocumentation, makeStory } from '../stories/utils/make-story';
import { getAPILink } from '../stories/utils/get-api-documentation-link';
import { useCellActions } from './use-cell-actions';

const API_URL = getAPILink('useCellActions');

export type Story = StoryObj<typeof Hook>;

const meta: Meta<typeof Hook> = {
  title: 'Hooks/useCellActions',
  component: Hook,
  render: () => <RenderItemDecorator renderElement={Hook} />,
  tags: ['hook'],
  parameters: makeRootDocumentation({
    apiURL: API_URL,
    description: `
The **useCellActions** hook provides functions to modify the graph state. It allows you to add, update, and remove elements and links programmatically.

**Key Features:**
- Update element/link properties with \`set\`
- Insert new elements/links with \`insert\`
- Remove elements/links with \`remove\`
- Type-safe updates with TypeScript
- Must be used within GraphProvider context
    `,
    usage: `
\`\`\`tsx
import { useCellActions } from '@joint/react';

function Component() {
  const { set, insert, remove } = useCellActions();
  
  // Update an element
  const updateElement = () => {
    set('element-id', (previous) => ({ 
      ...previous, 
      label: 'Updated' 
    }));
  };
  
  // Insert a new element
  const addElement = () => {
    insert('elements', {
      id: 'new-element',
      x: 100,
      y: 100,
      width: 100,
      height: 50,
    });
  };
  
  // Remove an element
  const deleteElement = () => {
    remove('element-id');
  };
  
  return (
    <div>
      <button onClick={updateElement}>Update</button>
      <button onClick={addElement}>Add</button>
      <button onClick={deleteElement}>Delete</button>
    </div>
  );
}
\`\`\`
    `,
    props: `
- **set(id, updater)**: Updates a cell (element or link) by ID
  - \`id\`: Cell ID to update
  - \`updater\`: Function that receives previous state and returns new state
- **insert(collection, item)**: Inserts a new element or link
  - \`collection\`: 'elements' or 'links'
  - \`item\`: Element or link object to insert
- **remove(id)**: Removes a cell by ID
    `,
    code: `import { useCellActions } from '@joint/react'

function Component() {
  const { set, insert, remove } = useCellActions();
  
  return (
    <button onClick={() => 
      set('element-id', (prev) => ({ ...prev, label: 'Hello' }))
    }>
      Update Element
    </button>
  );
}`,
  }),
};

export default meta;

function Hook({ label, id }: Readonly<SimpleElement>) {
  const { set } = useCellActions<SimpleElement>();

  return (
    <HTMLNode className="node">
      <button
        className={BUTTON_CLASSNAME}
        onClick={() => set(id, (previous) => ({ ...previous, label: 'Hello' }))}
      >
        Set label
      </button>
      label: {label}
    </HTMLNode>
  );
}
export const SetLabel: Story = makeStory<Story>({
  args: {
    label: 'default',
    color: 'red',
    id: 'default-id',
  },
  apiURL: API_URL,
  code: `import { useCellActions } from '@joint/react'


  function Hook({  label , id }: SimpleElement) {
    const { set } = useCellActions();

    return (
      <HTMLNode className="node">
        <button
          onClick={() => set(id, (previous) => ({ ...previous, label: 'Hello' }))}
        >
          Set label
        </button>
        label: {label}
      </HTMLNode>
    );
  }`,
  description: 'Set new data for the element.',
});

function HookSetPosition({ label, id }: Readonly<SimpleElement>) {
  const { set } = useCellActions<SimpleElement>();

  return (
    <HTMLNode className="node">
      <button
        className={BUTTON_CLASSNAME}
        onClick={() => set(id, (previous) => ({ ...previous, position: { x: 100, y: 100 } }))}
      >
        Set position
      </button>
      label: {label}
    </HTMLNode>
  );
}

export const SetPosition: Story = makeStory<Story>({
  component: () => <RenderItemDecorator renderElement={HookSetPosition} />,
  apiURL: API_URL,
  code: `
import { useCellActions } from '@joint/react'

function HookSetPosition({  label , id }: SimpleElement) {
  const { set } = useCellActions();

  return (
    <HTMLNode className="node">
      <button
        onClick={() => set(id, (previous) => ({ ...previous, position: { x: 100, y: 100 } }))}
      >
        Set position
      </button>
      label: {label}
    </HTMLNode>
  );
}   
  `,
  description: 'Set the position of the element.',
});

function HookSetSize({ label, id }: Readonly<SimpleElement>) {
  const { set } = useCellActions<SimpleElement>();
  return (
    <HTMLNode className="node">
      <button
        className={BUTTON_CLASSNAME}
        onClick={() => set(id, (previous) => ({ ...previous, size: { width: 100, height: 100 } }))}
      >
        Set size
      </button>
      label: {label}
    </HTMLNode>
  );
}

export const SetSize: Story = makeStory<Story>({
  component: () => <RenderItemDecorator renderElement={HookSetSize} />,
  apiURL: API_URL,
  code: `import { useCellActions } from '@joint/react'

function HookSetSize({  label , id }: SimpleElement) {
  const { set } = useCellActions();

  return (
    <HTMLNode className="node">
      <button
        onClick={() => set(id, (previous) => ({ ...previous, size: { width: 100, height: 100 } }))}
      >
        Set size
      </button>
      label: {label}
    </HTMLNode>
  );
}`,
  description: 'Set the size of the element.',
});

function HookSetAngle({ label, id }: Readonly<SimpleElement>) {
  const { set } = useCellActions<SimpleElement>();

  return (
    <HTMLNode className="node">
      <button
        className={BUTTON_CLASSNAME}
        onClick={() => {
          set(id, (previous) => {
            const { angle = 0 } = previous;
            const newAngle = angle + 45;
            return { ...previous, angle: newAngle % 360 };
          });
        }}
      >
        Set Angle
      </button>
      label: {label}
    </HTMLNode>
  );
}

export const SetAngle: Story = makeStory<Story>({
  component: () => <RenderItemDecorator renderElement={HookSetAngle} />,
  apiURL: API_URL,
  code: `import { useCellActions } from '@joint/react'

function HookSetAngle({  label , id }: SimpleElement) {
  const { set } = useCellActions();

  return (
    <HTMLNode className="node">
      <button
        onClick={() => {
          set(id, (previous) => ({ ...previous, angle: ((previous?.angle ?? 0) + 45) % 360 }));
        }}
      >
        Set Angle
      </button>
      label: {label}
    </HTMLNode>
  );
}`,
  description: 'Set the angle of the element.',
});

function HookSetAny({ label, id }: Readonly<SimpleElement>) {
  const { set } = useCellActions();

  return (
    <HTMLNode className="node">
      <button
        className={BUTTON_CLASSNAME}
        onClick={() =>
          set(id, (previous) => ({
            ...previous,
            position: {
              x: ((previous?.x as number) ?? 0) + 10,
              y: ((previous?.y as number) ?? 0) + 10,
            },
          }))
        }
      >
        Set Position
      </button>
      <button
        className={BUTTON_CLASSNAME}
        onClick={() =>
          set(id, (previous) => ({
            ...previous,
            size: {
              width: (typeof previous?.width === 'number' ? previous.width : 0) + 10,
              height: (typeof previous?.height === 'number' ? previous.height : 0) + 10,
            },
          }))
        }
      >
        Set Size
      </button>
      label: {label}
    </HTMLNode>
  );
}

export const SetAnyProperty: Story = makeStory<Story>({
  apiURL: API_URL,
  component: () => <RenderItemDecorator renderElement={HookSetAny} />,
  code: `import { useCellActions } from '@joint/react'

function HookSetAny({  label , id }: SimpleElement) {
  const { set } = useCellActions();

  return (
    <HTMLNode className="node">
      <button
        onClick={() =>
          set(id, (previous) => ({
            ...previous,
            position: { x: ((previous?.x as number) ?? 0) + 10, y: ((previous?.y as number) ?? 0) + 10 },
          }))
        }
      >
        Set Position
      </button>
      <button
        onClick={() =>
          set(id, (previous) => ({
            ...previous,
            size: {
              width: (typeof previous?.width === 'number' ? previous.width : 0) + 10,
              height: (typeof previous?.height === 'number' ? previous.height : 0) + 10,
            },
          }))
        }
      >
        Set Size
      </button>
      label: {label}
    </HTMLNode>
  );
}
`,
  description: 'Set the markup of the element.',
});

// remove elements
function HookRemoveElement({ label, id }: Readonly<SimpleElement>) {
  const { remove } = useCellActions();

  return (
    <HTMLNode className="node">
      <button className={BUTTON_CLASSNAME} onClick={() => remove(id)}>
        Remove Element
      </button>
      label: {label}
    </HTMLNode>
  );
}
export const RemoveElement: Story = makeStory<Story>({
  component: () => <RenderItemDecorator renderElement={HookRemoveElement} />,
  apiURL: API_URL,
  code: `import { useCellActions } from '@joint/react'

function HookRemoveElement({  label , id }: SimpleElement) {
  const { remove } = useCellActions();

  return (
    <HTMLNode className="node">
      <button onClick={() => remove(id)}>
        Remove Element
      </button>
      label: {label}
    </HTMLNode>
  );
}
`,
  description: 'Remove the element from the graph.',
});

// set link example
function HookSetAndRemoveLink({ label, id }: Readonly<SimpleElement>) {
  const { remove, set } = useCellActions();

  return (
    <HTMLNode className="node">
      <button
        className={BUTTON_CLASSNAME}
        onClick={() =>
          set('l-1', {
            source: id,
            target: id === '1' ? '2' : '1',
            attrs: {
              line: { stroke: PRIMARY, strokeDasharray: '5 5' },
            },
          })
        }
      >
        Set link
      </button>
      <button className={BUTTON_CLASSNAME} onClick={() => remove('l-1')}>
        Remove Link
      </button>
      label: {label}
    </HTMLNode>
  );
}

export const SetAndRemoveLink: Story = makeStory<Story>({
  component: () => <RenderItemDecorator renderElement={HookSetAndRemoveLink} />,
  apiURL: API_URL,
  code: `import { useCellActions } from '@joint/react'

function SetAndRemoveLink({  label , id }: SimpleElement) {
  const { remove, set } = useCellActions();

  return (
    <HTMLNode className="node">
      <button
        onClick={() =>
          set({
            id: 'xxlink',
            source: id,
            target: id === '1' ? '2' : '1',
            attrs: {
              line: { stroke: PRIMARY, strokeDasharray: '5 5' },
            },
          })
        }
      >
        Set link
      </button>
      <button onClick={() => remove('xxlink')}>
        Remove Link
      </button>
      label: {label}
    </HTMLNode>
  );
}
`,
  description: 'Set the link source and target.',
});
