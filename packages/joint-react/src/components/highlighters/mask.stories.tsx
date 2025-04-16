import type { Meta, StoryObj } from '@storybook/react/*';
import { SimpleRenderItemDecorator } from '../../../.storybook/decorators/with-simple-data';
import { Mask } from './mask';
import { PRIMARY, SECONDARY } from 'storybook/theme';
import { makeRootDocs, makeStory } from '@joint/react/src/stories/utils/make-story';
import { getAPILink } from '@joint/react/src/stories/utils/get-api-documentation-link';

const API_URL = getAPILink('Highlighter/variables/Mask', 'namespaces');

export type Story = StoryObj<typeof Mask>;
const meta: Meta<typeof Mask> = {
  title: 'Components/Highlighter/Mask',
  component: Mask,
  decorators: [SimpleRenderItemDecorator],
  parameters: makeRootDocs({
    description: `
Mask is a component that creates a mask around the children. It is used to highlight the children.
    `,
    apiURL: API_URL,
    code: `import { Highlighter } from '@joint/react'
<Highlighter.Mask>
  <rect rx={10} ry={10} width={100} height={50} fill={"blue"} />
</Highlighter.Mask>
    `,
  }),
};

export default meta;

export const Default = makeStory<Story>({
  args: {
    stroke: SECONDARY,
    children: <rect rx={10} ry={10} width={100} height={50} fill={PRIMARY} />,
  },

  apiURL: API_URL,
  description: 'Default mask highlighter with rectangle children.',
  code: `<Highlighter.Mask>
  <rect rx={10} ry={10} width={100} height={50} fill={"blue"} />
</Highlighter.Mask>`,
});

export const WithPadding = makeStory<Story>({
  args: {
    padding: 10,
    stroke: SECONDARY,
    children: <rect rx={10} ry={10} width={100} height={50} fill={PRIMARY} />,
  },

  apiURL: API_URL,
  description: 'Mask highlighter with padding.',
  code: `<Highlighter.Mask padding={10}>
  <rect rx={10} ry={10} width={100} height={50} fill={"blue"} />
</Highlighter.Mask>`,
});

export const WithSvgProps = makeStory<Story>({
  args: {
    padding: 10,
    stroke: SECONDARY,
    strokeWidth: 5,
    strokeLinejoin: 'bevel',
    children: <rect rx={10} ry={10} width={100} height={50} fill={PRIMARY} />,
  },

  apiURL: API_URL,
  description: 'Mask highlighter with SVG Element props.',
  code: `<Highlighter.Mask padding={10} stroke={SECONDARY} strokeWidth={5} strokeLinejoin="bevel">
  <rect rx={10} ry={10} width={100} height={50} fill={"blue"} />
</Highlighter.Mask>`,
});
