/* eslint-disable react-perf/jsx-no-new-object-as-prop */

import type { Meta, StoryObj } from '@storybook/react';
import {
  testElements,
  testLinks,
  type SimpleElement,
} from '../../../.storybook/decorators/with-simple-data';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import { MeasuredNode } from '../measured-node/measured-node';
import { useEffect, useState } from 'react';
import { getAPILink } from '../../stories/utils/get-api-documentation-link';
import { makeRootDocumentation } from '../../stories/utils/make-story';
import { GraphProvider } from './graph-provider';
import { Paper } from '../paper/paper';

export type Story = StoryObj<typeof GraphProvider>;

const API_URL = getAPILink('GraphProvider', 'variables');
const meta: Meta<typeof GraphProvider> = {
  title: 'Components/GraphProvider',
  component: GraphProvider,
  parameters: makeRootDocumentation({
    description: `
GraphProvider provides a shared Graph context for its descendants. Use it to scope any components that read or write the graph state. You can render one or multiple Paper instances inside.
    `,
    apiURL: API_URL,
    code: `import { GraphProvider } from '@joint/react'
function Render({ width, height }) {
  return <rect rx={10} ry={10} width={width} height={height} fill="blue" />
}
<GraphProvider>
  <Paper className={PAPER_CLASSNAME} renderElement={Render} />
</GraphProvider>
    `,
  }),
};

export default meta;

function RenderHTMLElement({ width, height }: SimpleElement) {
  return (
    <foreignObject width={width} height={height}>
      <MeasuredNode>
        <div
          style={{
            width,
            height,
            boxShadow: '0 0 10px rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: PRIMARY,
            borderRadius: 10,
          }}
        >
          Hello
        </div>
      </MeasuredNode>
    </foreignObject>
  );
}

export const Default: Story = {
  args: {
    elements: testElements,
    links: testLinks,
    children: <Paper className={PAPER_CLASSNAME} renderElement={RenderHTMLElement} />,
  },
};
function Component() {
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line @eslint-react/web-api/no-leaked-timeout
    setTimeout(() => {
      setIsReady(true);
    }, 1000);
  }, []);
  return (
    isReady && (
      <Paper interactive={false} className={PAPER_CLASSNAME} renderElement={RenderHTMLElement} />
    )
  );
}

export const ConditionalRender: Story = {
  args: {
    elements: testElements,
    links: testLinks,
    children: <Component />,
  },
};
