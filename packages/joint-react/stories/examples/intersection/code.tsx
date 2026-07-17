import {
  type CellRecord,
  GraphProvider,
  useGraph,
  Paper,
  useCellId,
  HTMLBox,
  useCells,
} from '@joint/react';
import type { dia } from '@joint/core';

interface NodeData {
  readonly label: string;
}

const initialCells: ReadonlyArray<CellRecord<NodeData>> = [
  { id: '1', type: 'element', data: { label: 'Node 1' }, position: { x: 100, y: 15 } },
  { id: '2', type: 'element', data: { label: 'Node 2' }, position: { x: 100, y: 200 } },
  { id: '3', type: 'element', data: { label: 'Node 3' }, position: { x: 200, y: 100 } },
  { id: '4', type: 'element', data: { label: 'Node 4' }, position: { x: 15, y: 100 } },
];

function IntersectionNode(data: Readonly<NodeData>) {
  const { graph } = useGraph();
  const id = useCellId();

  // Recompute on every graph change whether this element overlaps another.
  const isIntersected = useCells(() => {
    const element = graph.getCell(id) as dia.Element;
    return graph.findElementsUnderElement(element).length > 0;
  });

  return (
    <HTMLBox className={isIntersected ? 'jj-node jj-node--active' : 'jj-node'}>{data.label}</HTMLBox>
  );
}

export default function App() {
  return (
    <GraphProvider initialCells={initialCells}>
      <Paper className="size-full" renderElement={IntersectionNode} />
    </GraphProvider>
  );
}
