/* eslint-disable react-perf/jsx-no-new-function-as-prop */
/* eslint-disable no-shadow */
/* eslint-disable sonarjs/prefer-read-only-props */
import type { Meta, StoryObj } from '@storybook/react/*';
import { makeRootDocs, makeStory } from '@joint/react/src/stories/utils/make-story';
import { getAPILink } from '@joint/react/src/stories/utils/get-api-documentation-link';
import '../../stories/examples/index.css';
import { HTMLNode } from '../html-node/html-node';
import { createElements, createLinks, GraphProvider, Paper, Port } from '@joint/react';
import { PRIMARY } from 'storybook/theme';
import { PortGroup } from './port-group';

const initialElements = createElements([
  {
    id: '1',
    data: { label: 'Node 1', color: PRIMARY },
    x: 100,
    y: 20,
    width: 100,
    height: 50,
  },
  {
    id: '2',
    data: { label: 'Node 2', color: PRIMARY },
    x: 200,
    y: 250,
    width: 100,
    height: 50,
  },
]);

const defaultLinks = createLinks([
  {
    id: 'e1-2',

    target: {
      id: '2',
      port: 'port-one',
    },
    source: {
      id: '1',
      port: 'port-one',
    },
    attrs: {
      line: {
        stroke: PRIMARY,
      },
    },
  },
]);

export type Story = StoryObj<typeof PortGroup>;
const API_URL = getAPILink('Port/variables/Group', 'namespaces');

function RenderItem(Story: React.FC) {
  return (
    <HTMLNode className="node flex flex-col">
      Test
      <Story />
    </HTMLNode>
  );
}
function PaperDecorator(Story: React.FC) {
  const renderItem = () => RenderItem(Story);
  return (
    <GraphProvider defaultElements={initialElements} defaultLinks={defaultLinks}>
      <Paper width={'100%'} height={350} renderElement={renderItem} linkPinning={false} />
    </GraphProvider>
  );
}

const meta: Meta<typeof PortGroup> = {
  title: 'Components/Port/Group',
  component: PortGroup,
  decorators: [PaperDecorator],
  parameters: makeRootDocs({
    apiURL: API_URL,
    code: `
        import { Port } from '@joint/react';

        <Port.Group
          id="group-one"
          angle={0}
          compensateRotation={false}
          dx={0}>
            <Port.Item id="port-one" x={0} y={0}>
                <rect width={10} height={10} fill="red" />
            </Port.Item>
        </Port.Group>
    `,
    description: `Port Group is a container for ports. It can be used to group ports together and apply transformations to them. The group can be positioned using the position prop, which can be either 'absolute' or 'relative'.`,
  }),
};

export default meta;
export const Default = makeStory<Story>({
  args: {
    children: (
      <Port.Item id="port-one">
        <foreignObject width={20} height={20}>
          <div className="size-5 bg-sky-200 rounded-full" />
        </foreignObject>
      </Port.Item>
    ),
    id: 'group-one',
    y: 10,
    dx: 10,
    position: 'right',
  },
  apiURL: API_URL,
  name: 'Default group',
});
