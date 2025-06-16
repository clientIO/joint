/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
/* eslint-disable react-hooks/rules-of-hooks */
import type { Meta, StoryObj } from '@storybook/react';
import { useCreateElement } from './use-create-element';
import { makeRootDocumentation, makeStory } from '@joint/react/src/stories/utils/make-story';
import { getAPILink } from '@joint/react/src/stories/utils/get-api-documentation-link';
import type { SimpleElement } from '../../.storybook/decorators/with-simple-data';
import { HTMLNode, SimpleGraphDecorator } from '../../.storybook/decorators/with-simple-data';
import '../stories/examples/index.css';
import { Paper } from '../components';
import { BUTTON_CLASSNAME, PAPER_CLASSNAME } from 'storybook-config/theme';

const API_URL = getAPILink('useCreateElement');

export type Story = StoryObj<typeof Hook>;

const meta: Meta<typeof Hook> = {
  title: 'Hooks/useCreateElement',
  component: Hook,
  decorators: [SimpleGraphDecorator],
  render: () => {
    const addElement = useCreateElement<SimpleElement>();
    return (
      <div className="flex flex-row">
        <div style={{ width: '100%', height: 450 }}>
          <Paper
            className={PAPER_CLASSNAME}
            width={'100%'}
            height={450}
            renderElement={Hook}
            linkPinning={false}
          />
        </div>
        <div>
          <button
            type="button"
            className={BUTTON_CLASSNAME}
            onClick={() =>
              addElement({
                id: '10',
                label: 'New node added',
                color: 'red',
                x: 300,
                y: 100,
              })
            }
          >
            Add Node
          </button>
        </div>
      </div>
    );
  },
  parameters: makeRootDocumentation({
    apiURL: API_URL,
    description: `\`useCreateElement\` is a hook to add elements to the graph. It returns a function to add an element. It must be used inside the GraphProvider.`,
    code: `import { useCreateElement } from '@joint/react'

function Component() {
  const addElement = useCreateElement();
  return <button onClick={() => addElement({ id: '1', label: 'Node 1' })}>Add Element</button>;
}`,
  }),
};

export default meta;

function Hook({ label }: SimpleElement) {
  return <HTMLNode className="node">{label}</HTMLNode>;
}

export const Default: Story = makeStory<Story>({
  args: {},
  code: `import { useCreateElement } from '@joint/react'

function Hook() {
  const addElement = useCreateElement();

  return (
    <div>
      <button onClick={() => addElement({ id: '1', label: 'Node 1' })}>
        Add Node 1
      </button>
      <button onClick={() => addElement({ id: '2', label: 'Node 2' })}>
        Add Node 2
      </button>
    </div>
  );
}`,
  description: 'Add elements to the graph.',
});
