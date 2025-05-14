/* eslint-disable react-perf/jsx-no-new-array-as-prop */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { dia } from '@joint/core';
import '../../stories/examples/index.css';
import { GraphProvider, jsx, Paper } from '@joint/react';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import type { Meta, StoryObj } from '@storybook/react/*';
import { SimpleGraphDecorator } from 'storybook-config/decorators/with-simple-data';
import { makeRootDocumentation } from '@joint/react/src/stories/utils/make-story';
import { getAPILink } from '@joint/react/src/stories/utils/get-api-documentation-link';

const API_URL = getAPILink('jsx');

// Define a custom element using JointJS and provide markup using the jsx utility
const CustomRect = dia.Element.define(
  'CustomRect',
  {
    attrs: {
      body: {
        fill: PRIMARY,
        stroke: '#333',
        strokeWidth: 2,
      },
      label: {
        text: 'JSX Markup',
        fill: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
      },
    },
    size: { width: 120, height: 50 },
  },
  {
    markup: jsx(
      <g>
        <rect joint-selector="body" width="120" height="50" rx="10" ry="10" />
        <text joint-selector="label" x="60" y="25" textAnchor="middle" dominantBaseline="middle" />
      </g>
    ),
  }
);

const initialElements = [
  {
    type: 'CustomRect',
    id: 'rect1',
    x: 80,
    y: 80,
  },
];

function App() {
  return (
    <GraphProvider
      cellNamespace={{ CustomRect }}
      defaultElements={initialElements}
      defaultLinks={[]}
    >
      <Paper width={320} height={220} className={PAPER_CLASSNAME} />
    </GraphProvider>
  );
}

export type Story = StoryObj<typeof App>;

const meta: Meta<typeof App> = {
  title: 'Utils/JSX',
  component: App,
  decorators: [SimpleGraphDecorator],
  parameters: makeRootDocumentation({
    apiURL: API_URL,
    code: `import { dia } from '@joint/core';
import { jsx } from '@joint/react';

const CustomRect = dia.Element.define(
  'custom.Rect',
  {
    attrs: {
      body: { fill: '#007bff' },
      label: { text: 'JSX Markup' },
    },
    size: { width: 120, height: 50 },
  },
  {
    markup: jsx(
      <g>
        <rect joint-selector="body" width="120" height="50" rx="10" ry="10" />
        <text
          joint-selector="label"
          x="60"
          y="25"
          textAnchor="middle"
          dominantBaseline="middle"
        />
      </g>
    ),
  }
);`,
    description: `
This story demonstrates how to use the \`jsx\` utility to define JointJS markup for a custom element.
    `,
  }),
};

export default meta;

export const Default: Story = {
  args: {},
};
