import { useMemo } from 'react';
import { dia } from '@joint/core';
import { GraphProvider, jsx, Paper } from '@joint/react';

const PRIMARY = '#ED2637';

// Define a JointJS element whose SVG markup is written as JSX via the `jsx` util.
const CustomShape = dia.Element.define(
  'CustomShape',
  {
    attrs: {
      body: { fill: PRIMARY, stroke: '#0c141c', strokeWidth: 2 },
      label: { text: 'JSX Markup', fill: '#fff', fontSize: 14, fontWeight: 'bold' },
    },
    size: { width: 140, height: 56 },
  },
  {
    markup: jsx(
      <g>
        <rect joint-selector="body" width="140" height="56" rx="10" ry="10" />
        <text joint-selector="label" x="70" y="28" textAnchor="middle" dominantBaseline="middle" />
      </g>
    ),
  }
);

function createGraph(): dia.Graph {
  const graph = new dia.Graph({}, { cellNamespace: { CustomShape } });
  graph.addCell(new CustomShape({ position: { x: 70, y: 70 } }));
  return graph;
}

export default function App() {
  const graph = useMemo(() => createGraph(), []);
  return (
    <GraphProvider graph={graph}>
      <Paper className="size-full" />
    </GraphProvider>
  );
}
