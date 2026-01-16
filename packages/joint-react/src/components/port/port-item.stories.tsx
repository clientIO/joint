/* eslint-disable react-perf/jsx-no-new-function-as-prop */
/* eslint-disable sonarjs/prefer-read-only-props */
import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import '../../stories/examples/index.css';
import { createElements, createLinks, GraphProvider, Port, useNodeSize } from '@joint/react';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import { getAPILink } from '../../stories/utils/get-api-documentation-link';
import { makeRootDocumentation, makeStory } from '../../stories/utils/make-story';
import { Paper } from '../paper/paper';

const initialElements = createElements([
  {
    id: '1',
    x: 100,
    y: 20,
  },
  {
    id: '2',
    x: 200,
    y: 250,
  },
]);

const initialLinks = createLinks([
  {
    id: 'link-1',
    source: {
      id: '1',
      port: 'port-one',
    },
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
const API_URL = getAPILink('Port.Item', 'variables');
function RenderItem(Story: React.FC) {
  const elementRef = React.useRef<HTMLDivElement>(null);
  const { width, height } = useNodeSize(elementRef);
  return (
    <>
      <Story />
      <foreignObject width={width} height={height}>
        <div ref={elementRef} className="node flex flex-col">
          Test
        </div>
      </foreignObject>
    </>
  );
}
function PaperDecorator(Story: React.FC) {
  const renderItem = () => RenderItem(Story);
  return (
    <GraphProvider elements={initialElements} links={initialLinks}>
      <Paper
        defaultLink={initialLinks[0]}
        className={PAPER_CLASSNAME}
        width={'100%'}
        height={350}
        renderElement={renderItem}
      />
    </GraphProvider>
  );
}

const meta: Meta<typeof Port.Item> = {
  title: 'Components/Port/Item',
  component: Port.Item,
  decorators: [PaperDecorator],
  tags: ['component'],
  parameters: makeRootDocumentation({
    apiURL: API_URL,
    description: `
The **Port.Item** component represents a connection point on an element. Ports are used to define where links can connect to elements, enabling precise control over connection points.

**Key Features:**
- Defines connection points for links
- Supports custom positioning and styling
- Can contain custom content (icons, labels, etc.)
- Works with Port.Group for relative positioning
- Must be used inside renderElement context
    `,
    usage: `
\`\`\`tsx
import { Port } from '@joint/react';

function RenderElement({ width, height }) {
  return (
    <>
      <rect width={width} height={height} fill="blue" />
      <Port.Item id="top" x={width / 2} y={0}>
        <circle r={5} fill="red" />
      </Port.Item>
      <Port.Item id="bottom" x={width / 2} y={height}>
        <circle r={5} fill="green" />
      </Port.Item>
    </>
  );
}
\`\`\`
    `,
    props: `
- **id**: Unique identifier for the port (required)
- **x/y**: Absolute position coordinates
- **children**: SVG content to render at the port location
- **group**: Port group ID for relative positioning (use with Port.Group)
    `,
    code: `import { Port } from '@joint/react';

<Port.Item id="port-one" x={50} y={25}>
  <circle r={5} fill="blue" />
</Port.Item>
    `,
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
