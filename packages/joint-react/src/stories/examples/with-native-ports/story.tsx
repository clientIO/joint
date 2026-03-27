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
Demonstrates how to use native [JointJS ports](https://docs.jointjs.com/learn/features/ports) with @joint/react using \`useElementDefaults\` with \`mapAttributes\`.

Elements are rendered as React components via \`renderElement\`, while native JointJS ports are added through \`mapAttributes\`. This combines React's rendering flexibility with JointJS's built-in port positioning and magnet behavior.

## Key Concept: Native Ports via mapAttributes

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

// mapAttributes adds native ports to the PortalElement
const elementMappers = useElementDefaults({
  mapAttributes: ({ attributes, data }) => {
    const ports = buildNativePorts(data.inputPorts, data.outputPorts);
    if (!ports) return attributes;
    return { ...attributes, ports };
  },
}, []);

// renderElement provides the React visual
const renderElement = useCallback(
  (data) => <div style={{ background: data.color }}>{data.label}</div>,
  [],
);

<GraphProvider elements={elements} {...elementMappers}>
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
    'React-rendered elements with native JointJS ports added via useElementDefaults mapAttributes, without React Port portals.',
});
