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

Instead of using the React \`<Port>\` component (which creates React portals), you can use JointJS's built-in port rendering by constructing port definitions inside \`mapDataToElementAttributes\`. Element data stays minimal and declarative — only describing *what* is needed (colors, labels, port IDs). The mapper builds the full JointJS shape type, attrs, and ports.

## Key Concept: Native Ports via Mapper

\`\`\`tsx
// Element data is minimal — no JointJS specifics
const elements = {
  'node-1': {
    x: 50, y: 50, width: 140, height: 60,
    color: '#3b82f6',
    label: 'Node 1',
    outputPorts: ['out-1', 'out-2'],
  },
};

// Mapper builds JointJS type, attrs, and ports from data
const mapDataToElementAttributes = ({ data, defaultAttributes }) => {
  const result = defaultAttributes();
  const { color, label, inputPorts, outputPorts } = data;
  return {
    ...result,
    type: 'standard.Rectangle',
    attrs: {
      body: { fill: color, ... },
      label: { text: label, ... },
    },
    ports: buildNativePorts(inputPorts, outputPorts),
  };
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
    'Elements with native JointJS ports built inside mapDataToElementAttributes from declarative port descriptors, without React Port portals.',
});
