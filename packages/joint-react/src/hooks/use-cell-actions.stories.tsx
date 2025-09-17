/* eslint-disable @eslint-react/dom/no-missing-button-type */
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
  parameters: makeRootDocumentation({
    apiURL: API_URL,
    description: `\`useCellActions\` is a hook to set / insert / remove elements and links in the graph. It returns a function to update an element. It must be used inside the GraphProvider.
    `,
    code: `import { useCellActions } from '@joint/react'

function Component() {
    const { set } = useCellActions();
    return <button onClick={() => set("element-id", (previous) => ({ ...previous, label: 'Hello' }))}>Set label</button>;
}`,
  }),
};

export default meta;

function Hook({ label, id }: SimpleElement) {
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

function HookSetPosition({ label, id }: SimpleElement) {
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

function HookSetSize({ label, id }: SimpleElement) {
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

function HookSetAngle({ label, id }: SimpleElement) {
  const { set } = useCellActions();

  return (
    <HTMLNode className="node">
      <button
        className={BUTTON_CLASSNAME}
        onClick={() => {
          set(id, (previous) => ({ ...previous, angle: ((previous?.angle ?? 0) + 45) % 360 }));
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

function HookSetAny({ label, id }: SimpleElement) {
  const { set } = useCellActions();

  return (
    <HTMLNode className="node">
      <button
        className={BUTTON_CLASSNAME}
        onClick={() =>
          set(id, (previous) => ({
            ...previous,
            position: { x: (previous?.x ?? 0) + 10, y: (previous?.y ?? 0) + 10 },
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
            position: { x: (previous?.x ?? 0) + 10, y: (previous?.y ?? 0) + 10 },
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
function HookRemoveElement({ label, id }: SimpleElement) {
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
function HookSetAndRemoveLink({ label, id }: SimpleElement) {
  const { remove, set } = useCellActions();

  return (
    <HTMLNode className="node">
      <button
        className={BUTTON_CLASSNAME}
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
      <button className={BUTTON_CLASSNAME} onClick={() => remove('xxlink')}>
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
