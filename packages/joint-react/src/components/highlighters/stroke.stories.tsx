import type { Meta, StoryObj } from '@storybook/react/*';
import { SimpleRenderItemDecorator } from '../../../.storybook/decorators/with-simple-data';
import { Stroke } from './stroke';
import { PRIMARY, SECONDARY } from 'storybook-config/theme';
import { makeRootDocumentation } from '@joint/react/src/stories/utils/make-story';
import { getAPILink } from '@joint/react/src/stories/utils/get-api-documentation-link';
import { useElement } from '../../hooks';
import { forwardRef, type PropsWithChildren } from 'react';

const API_URL = getAPILink('Highlighter/variables/Stroke', 'namespaces');

export type Story = StoryObj<typeof Stroke>;

// we need to use forwardRef to pass the ref to the rect element, so highlighter can use it
function RectRenderComponent(_: PropsWithChildren, ref: React.Ref<SVGRectElement>) {
  const { width, height } = useElement();
  return <rect ref={ref} rx={10} ry={10} width={width} height={height} fill={PRIMARY} />;
}
const RectRender = forwardRef(RectRenderComponent);

const meta: Meta<typeof Stroke> = {
  title: 'Components/Highlighter/Stroke',
  component: Stroke,
  decorators: [SimpleRenderItemDecorator],
  parameters: makeRootDocumentation({
    description: `
Stroke is a component that adds a stroke around the children. It is used to highlight the children.
    `,
    apiURL: API_URL,
    code: `import { Highlighter } from '@joint/react'
<Highlighter.Stroke>
  <rect rx={10} ry={10} width={100} height={50} fill={"blue"} />
</Highlighter.Stroke>
    `,
  }),
};

export default meta;

export const Default: Story = {
  args: {
    padding: 10,
    rx: 5,
    ry: 5,
    useFirstSubpath: true,
    strokeWidth: 3,
    stroke: SECONDARY,
    children: <RectRender />,
  },
};
