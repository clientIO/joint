/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import {
  GraphProvider,
  useGraph,
  Paper,
  useCellId,
  HTMLBox,
  useCells,
  type Cells,
} from '@joint/react';
import '../index.css';
import type { dia } from '@joint/core';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';

interface NodeData {
  readonly [key: string]: unknown;
  readonly label: string;
}

const initialCells: Cells<NodeData> = [
  { id: '1', type: 'ElementModel', data: { label: 'Node 1' }, position: { x: 100, y: 15 } },
  { id: '2', type: 'ElementModel', data: { label: 'Node 2' }, position: { x: 100, y: 200 } },
  { id: '3', type: 'ElementModel', data: { label: 'Node 3' }, position: { x: 200, y: 100 } },
  { id: '4', type: 'ElementModel', data: { label: 'Node 4' }, position: { x: 15, y: 100 } },
];

function ResizableNode(data: NodeData) {
  const { graph } = useGraph();
  const id = useCellId();
  const element = graph.getCell(id) as dia.Element;

  const isIntersected = useCells(() => {
    return graph.findElementsUnderElement(element).length > 0;
  });

  return <HTMLBox style={{ borderColor: isIntersected ? PRIMARY : '' }}>{data.label}</HTMLBox>;
}

function Main() {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', position: 'relative' }}>
      <Paper className={PAPER_CLASSNAME} renderElement={ResizableNode} />
    </div>
  );
}

export default function App() {
  return (
    <GraphProvider initialCells={initialCells}>
      <Main />
    </GraphProvider>
  );
}
