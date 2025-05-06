/* eslint-disable react-perf/jsx-no-new-function-as-prop */
/* eslint-disable no-shadow */
/* eslint-disable sonarjs/prefer-read-only-props */
import type { Meta, StoryObj } from '@storybook/react/*';
import { makeRootDocs, makeStory } from '@joint/react/src/stories/utils/make-story';
import { getAPILink } from '@joint/react/src/stories/utils/get-api-documentation-link';
import '../../stories/examples/index.css';
import {
  createElements,
  createLinks,
  GraphProvider,
  MeasuredNode,
  Paper,
  Port,
  useElement,
} from '@joint/react';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';

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
    source: '1',
    target: {
      id: '2',
      port: 'port-one',
    },
    attrs: {
      line: {
        stroke: PRIMARY,
      },
    },
  },
]);

export type Story = StoryObj<typeof Port.Item>;
const API_URL = getAPILink('Port/variables/Item', 'namespaces');
function RenderItem(Story: React.FC) {
  const { width, height } = useElement();
  return (
    <foreignObject width={width} height={height}>
      <MeasuredNode>
        <div className="node flex flex-col">
          Test
          <Story />
        </div>
      </MeasuredNode>
    </foreignObject>
  );
}
function PaperDecorator(Story: React.FC) {
  const renderItem = () => RenderItem(Story);
  return (
    <GraphProvider defaultElements={initialElements} defaultLinks={defaultLinks}>
      <Paper
        className={PAPER_CLASSNAME}
        width={'100%'}
        height={350}
        renderElement={renderItem}
        linkPinning={false}
      />
    </GraphProvider>
  );
}

const meta: Meta<typeof Port.Item> = {
  title: 'Components/Port/Item',
  component: Port.Item,
  decorators: [PaperDecorator],
  parameters: makeRootDocs({
    apiURL: API_URL,
    code: `
      import { Port } from '@joint/react';
      <Port.Item id="port-one" x={0} y={0}>
        <foreignObject  />
      </Port.Item>
    `,
    description:
      'Port item is a component that represents a port in the graph. It is used to connect elements in the graph. Its appended outside the node elements, so when using positions, you can use group component for that `<Port.Group />`',
  }),
};

export default meta;
export const Default = makeStory<Story>({
  args: {
    children: (
      <foreignObject width={20} height={20}>
        <div className="size-5 bg-sky-200 rounded-full" />
      </foreignObject>
    ),
    id: 'port-one',
    x: 0,
    y: 0,
  },
  apiURL: API_URL,
  name: 'Basic port',
});
