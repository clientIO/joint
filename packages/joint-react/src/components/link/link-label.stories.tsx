 
import type { Meta, StoryObj } from '@storybook/react';
import '../../stories/examples/index.css';
import { Link } from '@joint/react';
import { getAPILink } from '../../stories/utils/get-api-documentation-link';
import { makeRootDocumentation, makeStory } from '../../stories/utils/make-story';
import { SimpleRenderLinkDecorator } from 'storybook-config/decorators/with-simple-data';

export type Story = StoryObj<typeof Link.Label>;
const API_URL = getAPILink('Link.Label', 'variables');

const meta: Meta<typeof Link.Label> = {
  title: 'Components/Link/Label',
  component: Link.Label,
  decorators: [SimpleRenderLinkDecorator],
  tags: ['component'],
  parameters: makeRootDocumentation({
    apiURL: API_URL,
    description: `
The **Link.Label** component renders content at a specific position along a link. It uses React portals to render children into the link label node.

**Key Features:**
- Renders content at specific positions along links (start, middle, end, custom)
- Supports custom positioning with distance, offset, and angle
- Uses React portals for rendering
- Must be used inside renderLink context
    `,
    usage: `
\`\`\`tsx
import { Link } from '@joint/react';

function RenderLink({ id }) {
  return (
    <>
      <Link.BaseLink attrs={{ line: { stroke: 'blue' } }} />
      <Link.Label position={{ distance: 0.5 }}>
        <text>Label</text>
      </Link.Label>
    </>
  );
}
\`\`\`
    `,
    props: `
- **position**: Position of the label along the link (required)
  - **distance**: 0-1 (0 = start, 0.5 = middle, 1 = end)
  - **offset**: number (perpendicular) or {x, y} (absolute)
  - **angle**: rotation angle in degrees
- **children**: Content to render inside the label portal
- **attrs**: Label attributes
- **size**: Label size
    `,
    code: `import { Link } from '@joint/react';

<Link.Label position={{ distance: 0.5 }}>
  <text>Label</text>
</Link.Label>
    `,
  }),
};

export default meta;

function Component() {
  const labelWidth = 100;
  const labelHeight = 20;
  // Center the label by offsetting by negative half-width and half-height
  const offsetX = -labelWidth / 2;
  const offsetY = -labelHeight / 2;

  return (
    <>
      <Link.Label distance={0.05}>
        <foreignObject x={offsetX} y={offsetY} width={labelWidth} height={labelHeight}>
          <div className="size-full bg-red-400 rounded text-xs flex items-center justify-center">
            Start
          </div>
        </foreignObject>
      </Link.Label>
      <Link.Label distance={0.5}>
        <foreignObject x={offsetX} y={offsetY} width={labelWidth} height={labelHeight}>
          <div className="size-full bg-red-400 rounded text-xs flex items-center justify-center">
            Middle
          </div>
        </foreignObject>
      </Link.Label>
      <Link.Label distance={0.95}>
        <foreignObject x={offsetX} y={offsetY} width={labelWidth} height={labelHeight}>
          <div className="size-full bg-red-400 rounded text-xs flex items-center justify-center">
            End
          </div>
        </foreignObject>
      </Link.Label>
    </>
  );
}
export const Default = makeStory<Story>({
  component: Component,
  apiURL: API_URL,
  name: 'Label at middle',
});
