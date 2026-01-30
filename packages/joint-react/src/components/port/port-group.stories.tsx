/* eslint-disable react-perf/jsx-no-new-function-as-prop */
/* eslint-disable sonarjs/prefer-read-only-props */
import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import '../../stories/examples/index.css';
import { GraphProvider, Port, useElement, useNodeSize } from '@joint/react';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import { PortGroup } from './port-group';
import { getAPILink } from '../../stories/utils/get-api-documentation-link';
import { makeRootDocumentation, makeStory } from '../../stories/utils/make-story';
import { Paper } from '../paper/paper';

const initialElements: Record<string, {
  x: number;
  y: number;
  width: number;
  height: number;
}> = {
  '1': {
    x: 100,
    y: 20,
    width: 100,
    height: 50,
  },
  '2': {
    x: 200,
    y: 250,
    width: 100,
    height: 50,
  },
};

const initialLinks: Record<string, {
  target: { id: string; port: string };
  source: { id: string; port: string };
  attrs: { line: { stroke: string } };
}> = {
  'e1-2': {
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
};

export type Story = StoryObj<typeof PortGroup>;
const API_URL = getAPILink('Port.Group', 'variables');

function RenderItem(Story: React.FC) {
  const { width, height } = useElement();
  const elementRef = React.useRef<HTMLDivElement>(null);
  useNodeSize(elementRef);
  return (
    <foreignObject width={width} height={height}>
      <div ref={elementRef} className="node flex flex-col">
        Test
        <Story />
      </div>
    </foreignObject>
  );
}
function PaperDecorator(Story: React.FC) {
  const renderItem = () => RenderItem(Story);
  return (
    <GraphProvider elements={initialElements} links={initialLinks}>
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

const meta: Meta<typeof PortGroup> = {
  title: 'Components/Port/Group',
  component: PortGroup,
  decorators: [PaperDecorator],
  tags: ['component'],
  parameters: makeRootDocumentation({
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
    description: 'Port Group is a container for ports. It can be used to group ports together and apply transformations to them. The group can be positioned using the position prop, which can be either \'absolute\' or \'relative\'.',
  }),
};

export default meta;

export const Default = makeStory<Story>({
  args: {
    children: (
      <Port.Item id="port-1">
        <foreignObject width={20} height={20}>
          <div className="size-5 bg-sky-200" />
        </foreignObject>
      </Port.Item>
    ),
    id: 'group-one',
    position: 'right',
    angle: 0,
    height: 1,
  },
  apiURL: API_URL,
  name: 'Default group',
});
