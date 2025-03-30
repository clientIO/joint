import type { Meta, StoryObj } from '@storybook/react/*';
import { SimpleRenderItemDecorator } from '../../../.storybook/decorators/with-simple-data';
import { Opacity } from './opacity';
import { PRIMARY } from '.storybook/theme';
import { makeRootDocs, makeStory } from '@joint/react/src/stories/utils/make-story';
import { getAPILink } from '@joint/react/src/stories/utils/get-api-documentation-link';

const API_URL = getAPILink('Highlighter/variables/Opacity', 'namespaces');

export type Story = StoryObj<typeof Opacity>;
const meta: Meta<typeof Opacity> = {
  title: 'Components/Highlighter/Opacity',
  component: Opacity,
  decorators: [SimpleRenderItemDecorator],
  parameters: makeRootDocs({
    description: `
Opacity is a component that changes the opacity of the children. It is used to highlight the children.
    `,
    apiURL: API_URL,
    code: `import { Highlighter } from '@joint/react'
<Highlighter.Opacity>
  <rect rx={10} ry={10} width={100} height={50} fill={"blue"} />
</Highlighter.Opacity>
    `,
  }),
};

export default meta;

export const Default = makeStory<Story>({
  args: {
    children: <rect rx={10} ry={10} width={100} height={50} fill={PRIMARY} />,
  },

  apiURL: API_URL,
  description: 'Default opacity highlighter with rectangle children.',
  code: `<Highlighter.Opacity>
  <rect rx={10} ry={10} width={100} height={50} fill={"blue"} />
</Highlighter.Opacity>`,
});

export const WithAlphaValue = makeStory<Story>({
  args: {
    alphaValue: 0.5,
    children: <rect rx={10} ry={10} width={100} height={50} fill={PRIMARY} />,
  },

  apiURL: API_URL,
  description: 'Opacity highlighter with alpha value.',
  code: `<Highlighter.Opacity alphaValue={0.5}>
  <rect rx={10} ry={10} width={100} height={50} fill={"blue"} />
</Highlighter.Opacity>`,
});
