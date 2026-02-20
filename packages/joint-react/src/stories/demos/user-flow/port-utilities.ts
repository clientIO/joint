import type { GraphElement } from '@joint/react';

export type OutputPort = {
  readonly id: string;
  readonly label: string;
};

export type OutputPortNode = {
  readonly outputPorts: readonly OutputPort[];
  readonly ports?: GraphElement['ports'];
} & GraphElement;

export const PORT_IN_SIZE = 15;
export const NODE_MIN_WIDTH = 250;
export const NODE_BASE_PADDING = 55;
export const NODE_PORT_PILL_SPACING = 85;
export const OUTPUT_PORT_CENTER_X = 45;
export const OUTPUT_PORT_CENTER_Y = 111;

const INPUT_PORT_ATTRIBUTES = {
  circle: {
    fill: '#FFFFFF',
    stroke: '#000000',
    'stroke-width': 2,
    opacity: 0.5,
    r: 8,
    magnet: true,
  },
  text: {
    display: 'none',
  },
} as const;

const HIDDEN_OUTPUT_PORT_ATTRIBUTES = {
  circle: {
    fill: 'transparent',
    stroke: 'transparent',
    r: 8,
    magnet: true,
    'pointer-events': 'all',
  },
  text: {
    display: 'none',
  },
} as const;

export function createPorts(outputPorts: readonly OutputPort[]): GraphElement['ports'] {
  return {
    items: [
      {
        id: 'in',
        args: { x: 12, y: -PORT_IN_SIZE / 2 },
        attrs: INPUT_PORT_ATTRIBUTES,
        z: 100 as const,
      },
      ...outputPorts.map((port, index) => ({
        id: port.id,
        args: { x: OUTPUT_PORT_CENTER_X + index * NODE_PORT_PILL_SPACING, y: OUTPUT_PORT_CENTER_Y },
        attrs: {
          ...HIDDEN_OUTPUT_PORT_ATTRIBUTES,
          circle: {
            ...HIDDEN_OUTPUT_PORT_ATTRIBUTES.circle,
            r: 10,
            'stroke-width': 16,
          },
        },
        z: 100 as const,
      })),
    ],
    // keep a group-less native ports model for v1
  };
}

export function createNextOutputPort(outputPorts: readonly OutputPort[]): OutputPort {
  let maximum = 0;
  for (const port of outputPorts) {
    const parsed = Number.parseInt(port.id, 10);
    if (Number.isNaN(parsed)) continue;
    if (parsed > maximum) maximum = parsed;
  }
  const nextNumericId = maximum + 1;
  return {
    id: String(nextNumericId),
    label: `Port ${nextNumericId}`,
  };
}

export function appendOutputPort<Node extends OutputPortNode>(node: Node): Node {
  const nextPort = createNextOutputPort(node.outputPorts);
  const nextOutputPorts = [...node.outputPorts, nextPort];

  return {
    ...node,
    outputPorts: nextOutputPorts,
    ports: createPorts(nextOutputPorts),
  };
}
