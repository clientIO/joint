/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import {
  GraphProvider,
  useGraph,
  Paper,
  useElementId,
  type PortalElementRecord,
  DefaultElement,
  useElements,
} from '@joint/react';
import '../index.css';
import type { dia } from '@joint/core';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';

interface NodeData {
  readonly [key: string]: unknown;
  readonly label: string;
}

const initialElements: Record<string, PortalElementRecord<NodeData>> = {
  '1': { data: { label: 'Node 1' }, position: { x: 100, y: 15 } },
  '2': { data: { label: 'Node 2' }, position: { x: 100, y: 200 } },
  '3': { data: { label: 'Node 3' }, position: { x: 200, y: 100 } },
  '4': { data: { label: 'Node 4' }, position: { x: 15, y: 100 } },
};

function ResizableNode({ label }: Readonly<NodeData>) {
  const { graph } = useGraph();
  const id = useElementId();
  const element = graph.getCell(id) as dia.Element;

  const isIntersected = useElements(() => {
    return graph.findElementsUnderElement(element).length > 0;
  });

  return <DefaultElement label={label} style={{ borderColor: isIntersected ? PRIMARY : '' }} />;
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
    <GraphProvider elements={initialElements}>
      <Main />
    </GraphProvider>
  );
}
