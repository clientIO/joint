export type OutputPort = {
  readonly id: string;
  readonly label: string;
};

export type OutputPortNode = {
  readonly outputPorts: readonly OutputPort[];
};

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
  };
}
