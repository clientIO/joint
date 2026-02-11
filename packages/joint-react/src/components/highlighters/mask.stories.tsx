import type { Meta, StoryObj } from '@storybook/react-vite';
import { SimpleRenderItemDecorator } from '../../../.storybook/decorators/with-simple-data';
import { Mask } from './mask';
import { PRIMARY, SECONDARY } from 'storybook-config/theme';
import { useElement } from '../../hooks';
import { makeRootDocumentation, makeStory } from '../../stories/utils/make-story';
import { getAPILink } from '../../stories/utils/get-api-documentation-link';

const API_URL = getAPILink('Highlighter.Mask', 'variables');

export type Story = StoryObj<typeof Mask>;
const meta: Meta<typeof Mask> = {
  title: 'Components/Highlighter/Mask',
  component: Mask,
  decorators: [SimpleRenderItemDecorator],
  tags: ['component'],
  parameters: makeRootDocumentation({
    description: `
The **Highlighter.Mask** component creates a visual mask/border around its children, useful for highlighting elements on hover or selection.

**Key Features:**
- Creates a mask border around child elements
- Supports customizable padding and stroke properties
- Works with SVG elements that forward refs
- Can be shown/hidden dynamically via \`isHidden\` prop
    `,
    usage: `
\`\`\`tsx
import { Highlighter } from '@joint/react';
import { forwardRef } from 'react';

const RectElement = forwardRef((props, ref) => (
  <rect ref={ref} width={100} height={50} fill="blue" />
));

<Highlighter.Mask 
  stroke="red" 
  strokeWidth={2} 
  padding={5}
  isHidden={false}
>
  <RectElement />
</Highlighter.Mask>
\`\`\`
    `,
    props: `
- **children**: SVG element that forwards a ref (required)
- **stroke**: Border color
- **strokeWidth**: Border thickness
- **padding**: Space between element and mask border
- **isHidden**: Controls visibility of the mask
- **strokeLinejoin**: SVG line join style (miter, round, bevel)
    `,
    apiURL: API_URL,
    code: `import { Highlighter } from '@joint/react'
import { forwardRef } from 'react';

const RectElement = forwardRef((props, ref) => (
  <rect ref={ref} width={100} height={50} fill="blue" />
));

<Highlighter.Mask stroke="red" padding={5}>
  <RectElement />
</Highlighter.Mask>
    `,
  }),
};

// we need to use forwardRef to pass the ref to the rect element, so highlighter can use it
function RectRender() {
  const { width, height } = useElement();
  return <rect rx={10} ry={10} width={width} height={height} fill={PRIMARY} />;
}

export default meta;

export const Default = makeStory<Story>({
  args: {
    stroke: SECONDARY,
    children: <RectRender />,
    isHidden: false,
  },

  apiURL: API_URL,
  description: 'Default mask highlighter with rectangle children.',
  code: `<Highlighter.Mask>
  <rect rx={10} ry={10} width={width} height={height} fill={"blue"} />
</Highlighter.Mask>`,
});

export const WithPadding = makeStory<Story>({
  args: {
    padding: 10,
    stroke: SECONDARY,
    children: <RectRender />,
    isHidden: false,
  },

  apiURL: API_URL,
  description: 'Mask highlighter with padding.',
  code: `<Highlighter.Mask padding={10}>
  <rect rx={10} ry={10} width={width} height={height} fill={"blue"} />
</Highlighter.Mask>`,
});

export const WithSVGProps = makeStory<Story>({
  args: {
    padding: 10,
    stroke: SECONDARY,
    strokeWidth: 5,
    strokeLinejoin: 'bevel',
    children: <RectRender />,
    isHidden: false,
  },

  apiURL: API_URL,
  description: 'Mask highlighter with SVG Element props.',
  code: `<Highlighter.Mask padding={10} stroke={SECONDARY} strokeWidth={5} strokeLinejoin="bevel">
  <rect rx={10} ry={10}  width={width} height={height}fill={"blue"} />
</Highlighter.Mask>`,
});

export const WithPolygonChildren = makeStory<Story>({
  args: {
    padding: 10,
    stroke: SECONDARY,
    strokeWidth: 5,
    // start at 0,0 and go to 100,0 and then 100,100 and then 0,100
    // <> shape
    children: <polygon points="150,15 258,77 258,202 150,265 42,202 42,77" fill={PRIMARY} />,
    isHidden: false,
  },

  apiURL: API_URL,
  description: 'Mask highlighter with SVG Element props.',
  code: `<Highlighter.Mask padding={10} stroke={SECONDARY} strokeWidth={5} strokeLinejoin="bevel">
  <rect rx={10} ry={10}  width={width} height={height}fill={"blue"} />
</Highlighter.Mask>`,
});
