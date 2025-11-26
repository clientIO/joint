import type { Meta, StoryObj } from '@storybook/react';
import { SimpleRenderItemDecorator } from '../../../.storybook/decorators/with-simple-data';
import { Stroke } from './stroke';
import { PRIMARY, SECONDARY } from 'storybook-config/theme';
import { useElement } from '../../hooks';
import { forwardRef, type PropsWithChildren } from 'react';
import { makeRootDocumentation } from '../../stories/utils/make-story';
import { getAPILink } from '../../stories/utils/get-api-documentation-link';

const API_URL = getAPILink('Highlighter.Stroke', 'variables');

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
  tags: ['component'],
  parameters: makeRootDocumentation({
    description: `
The **Highlighter.Stroke** component adds a stroke outline around its children, creating a border effect for highlighting elements.

**Key Features:**
- Adds a customizable stroke border around elements
- Supports padding to control border distance from element
- Works with any SVG element that forwards refs
- Can be shown/hidden dynamically
    `,
    usage: `
\`\`\`tsx
import { Highlighter } from '@joint/react';
import { forwardRef } from 'react';

const RectElement = forwardRef((props, ref) => (
  <rect ref={ref} width={100} height={50} fill="blue" />
));

<Highlighter.Stroke 
  stroke="red" 
  strokeWidth={3} 
  padding={5}
  rx={5}
  ry={5}
>
  <RectElement />
</Highlighter.Stroke>
\`\`\`
    `,
    props: `
- **children**: SVG element that forwards a ref (required)
- **stroke**: Border color
- **strokeWidth**: Border thickness
- **padding**: Space between element and stroke border
- **rx/ry**: Border corner radius
- **useFirstSubpath**: Use first subpath for complex shapes
    `,
    apiURL: API_URL,
    code: `import { Highlighter } from '@joint/react'
import { forwardRef } from 'react';

const RectElement = forwardRef((props, ref) => (
  <rect ref={ref} width={100} height={50} fill="blue" />
));

<Highlighter.Stroke stroke="red" strokeWidth={3} padding={5}>
  <RectElement />
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
