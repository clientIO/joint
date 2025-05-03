/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
/* eslint-disable react-hooks/rules-of-hooks */
import type { Meta, StoryObj } from '@storybook/react';
import { useAddElement } from './use-add-element';
import { makeRootDocs, makeStory } from '@joint/react/src/stories/utils/make-story';
import { getAPILink } from '@joint/react/src/stories/utils/get-api-documentation-link';
import type { SimpleElement } from '../../.storybook/decorators/with-simple-data';
import { HTMLNode, SimpleGraphDecorator } from '../../.storybook/decorators/with-simple-data';
import '../stories/examples/index.css';
import { Paper } from '../components';

const API_URL = getAPILink('useAddElement');
const BUTTON_CLASSNAME =
  'bg-blue-500 cursor-pointer hover:bg-blue-700 text-white font-bold py-2 px-4 rounded m-2 text-sm';
export type Story = StoryObj<typeof Hook>;

const meta: Meta<typeof Hook> = {
  title: 'Hooks/useAddElement',
  component: Hook,
  decorators: [SimpleGraphDecorator],
  render: () => {
    const addElement = useAddElement<SimpleElement>();
    return (
      <div className="flex flex-row">
        <div style={{ width: '100%', height: 450 }}>
          <Paper width={'100%'} height={450} renderElement={Hook} linkPinning={false} />
        </div>
        <div>
          <button
            type="button"
            className={BUTTON_CLASSNAME}
            onClick={() =>
              addElement({
                id: '10',
                data: { label: 'New node added', color: 'red' },
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
  parameters: makeRootDocs({
    apiURL: API_URL,
    description: `\`useAddElement\` is a hook to add elements to the graph. It returns a function to add an element. It must be used inside the GraphProvider.`,
    code: `import { useAddElement } from '@joint/react'

function Component() {
  const addElement = useAddElement();
  return <button onClick={() => addElement({ id: '1', data: { label: 'Node 1' } })}>Add Element</button>;
}`,
  }),
};

export default meta;

function Hook({ data: { label } }: Readonly<{ id: string; data: { label: string } }>) {
  return <HTMLNode className="node">{label}</HTMLNode>;
}

export const Default: Story = makeStory<Story>({
  args: {},
  apiURL: API_URL,
  code: `import { useAddElement } from '@joint/react'

function Hook() {
  const addElement = useAddElement();

  return (
    <div>
      <button onClick={() => addElement({ id: '1', data: { label: 'Node 1' } })}>
        Add Node 1
      </button>
      <button onClick={() => addElement({ id: '2', data: { label: 'Node 2' } })}>
        Add Node 2
      </button>
    </div>
  );
}`,
  description: 'Add elements to the graph.',
});
