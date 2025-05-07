/* eslint-disable @eslint-react/dom/no-missing-button-type */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import type { Meta, StoryObj } from '@storybook/react';
import type { SimpleElement } from '../../.storybook/decorators/with-simple-data';
import { HTMLNode, RenderItemDecorator } from '../../.storybook/decorators/with-simple-data';
import { useSetElement } from './use-set-element';
import { makeRootDocs, makeStory } from '@joint/react/src/stories/utils/make-story';
import { getAPILink } from '@joint/react/src/stories/utils/get-api-documentation-link';
import '../stories/examples/index.css';
import { BUTTON_CLASSNAME } from 'storybook-config/theme';

const API_URL = getAPILink('useSetElement');

export type Story = StoryObj<typeof Hook>;

const meta: Meta<typeof Hook> = {
  title: 'Hooks/useSetElement',
  component: Hook,
  render: () => <RenderItemDecorator renderElement={Hook} />,
  parameters: makeRootDocs({
    apiURL: API_URL,
    description: `\`useSetElement\` is a hook to set element attributes. It returns a function to set the element attribute. It must be used inside the GraphProvider.
    `,
    code: `import { useSetElement } from '@joint/react'

function Component() {
  const setPosition = useSetElement('element-id', 'position');
  return <button onClick={() => setPosition({ x: 100, y: 100 })}>Set Position</button>;
}`,
  }),
};

export default meta;

function Hook({ label, id }: SimpleElement) {
  const setLabel = useSetElement<SimpleElement>(id, 'label');

  return (
    <HTMLNode className="node">
      <button className={BUTTON_CLASSNAME} onClick={() => setLabel('Hello')}>
        Set label
      </button>
      label: {label}
    </HTMLNode>
  );
}
export const Default: Story = makeStory<Story>({
  args: {
    label: 'default',
    color: 'red',
    id: 'default-id',
  },
  apiURL: API_URL,
  code: `import { useSetElement } from '@joint/react'


  function Hook({  label , id }: SimpleElement) {
    const setLabel = useSetElement(id, 'label');
  
    return (
      <HTMLNode className="node">
        <button onClick={() => setLabel("Hello")>Set label</button>
        label: {label}
      </HTMLNode>
    );
  }`,
  description: 'Set new data for the element.',
});

function HookSetPosition({ label, id }: SimpleElement) {
  const set = useSetElement(id, 'position');

  return (
    <HTMLNode className="node">
      <button
        className={BUTTON_CLASSNAME}
        onClick={() =>
          set((previous) => {
            if (previous === undefined) {
              return { x: 0, y: 0 };
            }
            return { x: previous.x + 10, y: previous.y + 10 };
          })
        }
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
  code: `import { useSetElement } from '@joint/react'

  function HookSetPosition({ label, id }: SimpleElement) {
    const set = useSetElement(id, 'position');
  
    return (
      <HTMLNode className="node">
        <button
          onClick={() =>
            set((previous) => {
              if (previous === undefined) {
                return { x: 0, y: 0 };
              }
              return { x: previous.x + 10, y: previous.y + 10 };
            })
          }
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
  const set = useSetElement(id, 'size');

  return (
    <HTMLNode className="node">
      <button
        className={BUTTON_CLASSNAME}
        onClick={() =>
          set((previous) => {
            if (previous === undefined) {
              return { width: 0, height: 0 };
            }
            return { width: previous.width + 10, height: previous.height + 10 };
          })
        }
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
  code: `import { useSetElement } from '@joint/react'

function HookSetSize({  label, id }: SimpleElement) {
  const set = useSetElement(id, 'size');

  return (
    <HTMLNode className="node">
      <button
        onClick={() =>
          set((previous) => {
            if (previous === undefined) {
              return { width: 0, height: 0 };
            }
            return { width: previous.width + 10, height: previous.height + 10 };
          })
        }
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
  const set = useSetElement(id, 'angle');

  return (
    <HTMLNode className="node">
      <button
        className={BUTTON_CLASSNAME}
        onClick={() =>
          set((previous) => {
            if (previous === undefined) {
              return 0;
            }
            return previous + 45;
          })
        }
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
  code: `function HookSetAngle({  label, id }: SimpleElement) {
  const set = useSetElement(id, 'angle');

  return (
    <HTMLNode className="node">
      <button
        onClick={() =>
          set((previous) => {
            if (previous === undefined) {
              return 0;
            }
            return previous + 45;
          })
        }
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
  const set = useSetElement(id);

  return (
    <HTMLNode className="node">
      <button
        className={BUTTON_CLASSNAME}
        onClick={() =>
          set('position', (previous) => {
            if (previous === undefined) {
              return { x: 0, y: 0 };
            }
            return { x: previous.x + 10, y: previous.y + 10 };
          })
        }
      >
        Set Position
      </button>
      <button
        className={BUTTON_CLASSNAME}
        onClick={() =>
          set('size', (previous) => {
            if (previous === undefined) {
              return { width: 0, height: 0 };
            }
            return { width: previous.width + 10, height: previous.height + 10 };
          })
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
  code: `import { useSetElement } from '@joint/react'

function HookSetAny({  label , id }: SimpleElement) {
  const set = useSetElement(id);

  return (
    <HTMLNode className="node">
      <button
        onClick={() =>
          set('position', (previous) => {
            if (previous === undefined) {
              return { x: 0, y: 0 };
            }
            return { x: previous.x + 10, y: previous.y + 10 };
          })
        }
      >
        Set Position
      </button>
      <button
        onClick={() =>
          set('size', (previous) => {
            if (previous === undefined) {
              return { width: 0, height: 0 };
            }
            return { width: previous.width + 10, height: previous.height + 10 };
          })
        }
      >
        Set Size
      </button>
      label: {label}
    </HTMLNode>
  );
}`,
  description: 'Set the markup of the element.',
});
