/* eslint-disable react-perf/jsx-no-new-object-as-prop */

import type { Meta, StoryObj } from '@storybook/react/*';
import { SimpleRenderItemDecorator } from '../../../.storybook/decorators/with-simple-data';
import { makeRootDocs, makeStory } from '@joint/react/src/stories/utils/make-story';
import { getAPILink } from '@joint/react/src/stories/utils/get-api-documentation-link';
import { Port } from './port';
import '../../stories/examples/index.css';
import { HTMLNode } from '../html-node/html-node';

export type Story = StoryObj<typeof Port>;
const API_URL = getAPILink('Port', 'variables');

// eslint-disable-next-line no-shadow, sonarjs/prefer-read-only-props
function ItemRender(Story: React.FC) {
  return (
    <HTMLNode className="node">
      <Story />
    </HTMLNode>
  );
}

const meta: Meta<typeof Port> = {
  title: 'Components/Port',
  component: Port,
  decorators: [ItemRender, SimpleRenderItemDecorator],
  parameters: makeRootDocs({
    apiURL: API_URL,
    code: `
    `,
    description: ``,
  }),
};

export default meta;

export const DivWithExactSize = makeStory<Story>({
  args: {
    children: <HTMLNode className="node">wleocm</HTMLNode>,
  },
  apiURL: API_URL,
  name: 'Measured div with exact size',
  description: 'Div with exact size.',
});
