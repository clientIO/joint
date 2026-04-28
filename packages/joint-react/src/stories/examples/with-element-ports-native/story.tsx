import { Meta, StoryObj } from '@storybook/react-vite';
import '../index.css';

import NativePorts from './code';
import NativePortsRawCode from './code?raw';
import { makeStory } from '../../utils/make-story';

export type Story = StoryObj<typeof NativePorts>;

export default {
  title: 'Examples/Element Ports (Native)',
  component: NativePorts,
  tags: ['example'],
  parameters: {
    docs: {
      description: {
        component: `
Demonstrates how to use native [JointJS ports](https://docs.jointjs.com/learn/features/ports) with @joint/react by including port definitions directly in element data.

Elements are rendered as React components via \`renderElement\`, while native JointJS ports are included in the initial element data via the \`ports\` property. This combines React's rendering flexibility with JointJS's built-in port positioning and magnet behavior.

## Key Concept: Native Ports via Element Data

\`\`\`tsx
// Build native JointJS port definitions
const ports = buildNativePorts(['in-1'], ['out-1', 'out-2']);

// Include ports directly in element data
const elements = {
  'node-1': {
    data: { color: '#3b82f6', label: 'Node 1' },
    position: { x: 50, y: 50 },
    size: { width: 140, height: 60 },
    ports,
  },
};

// renderElement provides the React visual
const renderElement = useCallback(
  (data) => <div style={{ background: data.color }}>{data.label}</div>,
  [],
);

<GraphProvider initialElements={elements}>
  <Paper renderElement={renderElement} />
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
    'React-rendered elements with native JointJS ports included directly in element data, without React Port portals.',
});
