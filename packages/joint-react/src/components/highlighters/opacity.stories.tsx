import type { Meta, StoryObj } from '@storybook/react';
import { SimpleRenderItemDecorator } from '../../../.storybook/decorators/with-simple-data';
import { Opacity } from './opacity';
import { PRIMARY } from 'storybook-config/theme';
import { forwardRef, type PropsWithChildren } from 'react';
import { useElement } from '../../hooks';
import { getAPILink } from '../../stories/utils/get-api-documentation-link';
import { makeRootDocumentation, makeStory } from '../../stories/utils/make-story';

const API_URL = getAPILink('Highlighter.Opacity', 'variables');

export type Story = StoryObj<typeof Opacity>;
const meta: Meta<typeof Opacity> = {
  title: 'Components/Highlighter/Opacity',
  component: Opacity,
  decorators: [SimpleRenderItemDecorator],
  parameters: makeRootDocumentation({
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

// we need to use forwardRef to pass the ref to the rect element, so highlighter can use it
function RectRenderComponent(_: PropsWithChildren, ref: React.Ref<SVGRectElement>) {
  const { width, height } = useElement();
  return <rect ref={ref} rx={10} ry={10} width={width} height={height} fill={PRIMARY} />;
}
const RectRender = forwardRef(RectRenderComponent);
export default meta;

export const Default = makeStory<Story>({
  args: {
    alphaValue: 0.5,
    children: <RectRender />,
  },

  apiURL: API_URL,
  description: 'Default opacity highlighter with rectangle children.',
  code: `<Highlighter.Opacity alphaValue={0.5}>
  <rect rx={10} ry={10} width={100} height={50} fill={"blue"} />
</Highlighter.Opacity>`,
});
