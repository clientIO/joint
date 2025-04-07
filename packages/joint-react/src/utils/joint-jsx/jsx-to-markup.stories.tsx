/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { dia } from '@joint/core';
import '../../stories/examples/index.css';
import { createElements, createLinks, GraphProvider, jsx, MeasuredNode, Paper } from '@joint/react';
import { PRIMARY } from '.storybook/theme';
import type { Meta, StoryObj } from '@storybook/react/*';
import { SimpleGraphDecorator } from '.storybook/decorators/with-simple-data';
import { makeRootDocs } from '@joint/react/src/stories/utils/make-story';
import { getAPILink } from '@joint/react/src/stories/utils/get-api-documentation-link';

const API_URL = getAPILink('jsx');

const customLink = dia.Link.define(
  'standard.Link',
  {
    attrs: {
      line: {
        connection: true,
      },
    },
  },
  {
    markup: jsx(
      <path
        strokeWidth={10}
        strokeLinejoin="round"
        fill="none"
        pointerEvents="none"
        d="M 10 -5 0 0 10 5 z"
      />
    ),
  }
);

const initialEdges = createLinks([
  {
    type: 'customLink',
    id: 'e1-2',
    source: '1',
    target: '2',
    attrs: {
      line: {
        stroke: PRIMARY,
        strokeDasharray: '5 5',
      },
    },
  },
]);
const initialElements = createElements([
  { id: '1', data: { label: 'Node 1' }, x: 100, y: 0 },
  { id: '2', data: { label: 'Node 2' }, x: 100, y: 200 },
]);

function RenderedRect() {
  return (
    <MeasuredNode>
      <rect rx={10} ry={10} width={150} height={35} fill={PRIMARY} />
    </MeasuredNode>
  );
}

function Main() {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', position: 'relative' }}>
      <Paper
        width={400}
        height={280}
        renderElement={RenderedRect}
        // add listeners when show and hide tools
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
        }}
      ></div>
    </div>
  );
}

function App() {
  return (
    <GraphProvider
      cellNamespace={{ customLink }}
      defaultElements={initialElements}
      defaultLinks={initialEdges}
    >
      <Main />
    </GraphProvider>
  );
}

export type Story = StoryObj<typeof App>;

const meta: Meta<typeof App> = {
  title: 'Utils/JSX',
  component: App,
  decorators: [SimpleGraphDecorator],
  parameters: makeRootDocs({
    apiURL: API_URL,
    code: `import { dia } from '@joint/core';

const customLink = dia.Link.define(
  'standard.Link',
  {
    attrs: {
      line: {
        connection: true,
      },
    },
  },
  {
    markup: jsx(
      <path
        strokeWidth={10}
        strokeLinejoin="round"
        joint-selector="line"
        fill="none"
        pointer-events="none"
        d="M 10 -5 0 0 10 5 z"
      />
    ),
  }


function App() {
    return <GraphProvider
      cellNamespace={{ customLink }}
      defaultElements={initialElements}
      defaultLinks={initialEdges}
    >
      <Main />
  </GraphProvider>
  }
);`,
    description: `
    JSX is a utility that allows you to create JointJS markup using JSX syntax.
    `,
  }),
};

export default meta;

export const Default: Story = {
  args: {},
};
