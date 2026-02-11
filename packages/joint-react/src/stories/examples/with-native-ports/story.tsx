import type { Meta, StoryObj } from '@storybook/react-vite';
import '../index.css';

import NativePorts from './code';
import NativePortsRawCode from './code?raw';
import { makeStory } from '../../utils/make-story';

export type Story = StoryObj<typeof NativePorts>;

export default {
  title: 'Examples/Native ports',
  component: NativePorts,
  tags: ['example'],
  parameters: {
    docs: {
      description: {
        component: `
Demonstrates how to use native [JointJS ports](https://docs.jointjs.com/learn/features/ports) with @joint/react using the \`mapDataToElementAttributes\` selector.

Instead of using the React \`<Port>\` component (which creates React portals), you can define ports directly in your element data using the standard JointJS ports API. This is useful when you want to use JointJS's built-in port rendering without React portals.

## Key Concept: Native Ports via Element Data

\`\`\`tsx
// Define element with native ports
const elements = {
  'node-1': {
    x: 50, y: 50, width: 140, height: 60,
    type: 'standard.Rectangle',
    ports: {
      groups: {
        out: {
          position: 'right',
          attrs: { circle: { r: 8, magnet: true, fill: '#6366f1' } },
        },
      },
      items: [{ id: 'out-1', group: 'out' }],
    },
  },
};

// Custom selector that preserves ports
const mapDataToElementAttributes = ({ data, defaultAttributes }) => {
  const result = defaultAttributes();
  const { type, attrs, ports } = data;
  return { ...result, type, attrs, ports };
};

<GraphProvider
  elements={elements}
  mapDataToElementAttributes={mapDataToElementAttributes}
>
  <Paper />
</GraphProvider>
\`\`\`
        `,
      },
    },
  },
} satisfies Meta<typeof NativePorts>;

export const Default = makeStory({
  component: NativePorts,
  code: NativePortsRawCode,
  name: 'Native Ports',
  apiURL: 'https://docs.jointjs.com/learn/features/ports',
  description:
    'Elements with native JointJS ports defined via the ports property and mapDataToElementAttributes, without React Port portals.',
});
