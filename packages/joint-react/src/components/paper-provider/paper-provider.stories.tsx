/* eslint-disable react-perf/jsx-no-new-object-as-prop */

import type { Meta, StoryObj } from '@storybook/react';
import {
  SimpleGraphDecorator,
  type SimpleElement,
} from '../../../.storybook/decorators/with-simple-data';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import { MeasuredNode } from '../measured-node/measured-node';
import { PaperProvider } from './paper-provider';
import { Paper } from '../paper/paper';
import { useEffect, useState } from 'react';
import { getAPILink } from '../../stories/utils/get-api-documentation-link';
import { makeRootDocumentation } from '../../stories/utils/make-story';

export type Story = StoryObj<typeof PaperProvider>;

const API_URL = getAPILink('Paper', 'variables');
const meta: Meta<typeof PaperProvider> = {
  title: 'Components/PaperProvider',
  component: PaperProvider,
  decorators: [SimpleGraphDecorator],
  parameters: makeRootDocumentation({
    description: `
Paper Provider is a component that distribute paper context. It must have Paper children. It is used to display and interact with graph elements.
    `,
    apiURL: API_URL,
    code: `import { Paper } from '@joint/react'
<Paper renderElement={() => <rect rx={10} ry={10} width={100} height={50} fill={"blue"} />} />
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
    width: '100%',
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
    width: '100%',
    children: <Component />,
  },
};
