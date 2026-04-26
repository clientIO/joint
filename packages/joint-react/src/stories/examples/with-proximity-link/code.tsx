/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import {
  GraphProvider,
  HTMLBox,
  Paper,
  useCellId,
  useCells,
  useElement,
  useGraph,
  type Cells,
  type CellRecord,
  type ResolvedElementRecord,
} from '@joint/react';
import { util } from '@joint/core';
import '../index.css';
import { useEffect } from 'react';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import { linkRoutingStraight } from '@joint/react/presets';
import type { dia } from '@joint/core';

const STRAIGHT_LINKS = linkRoutingStraight({ perpendicular: true });

interface NodeData {
  readonly [key: string]: unknown;
  readonly label: string;
}

const initialCells: Cells<NodeData> = [
  { id: '1', type: 'ElementModel', data: { label: 'Node 1' }, position: { x: 100, y: 15 } },
  { id: '2', type: 'ElementModel', data: { label: 'Node 2' }, position: { x: 100, y: 200 } },
  { id: '3', type: 'ElementModel', data: { label: 'Node 3' }, position: { x: 280, y: 100 } },
  { id: '4', type: 'ElementModel', data: { label: 'Node 4' }, position: { x: 15, y: 100 } },
];

const PROXIMITY_THRESHOLD = 60;

function getProximityLink(id: dia.Cell.ID, closeId: dia.Cell.ID) {
  const [source, target] = [String(id), String(closeId)].toSorted((first, second) =>
    first.localeCompare(second)
  );
  return {
    linkId: `${source}-${target}`,
    source: { id: source },
    target: { id: target },
  };
}

function ResizableNode() {
  const id = useCellId();
  const label = useElement((element: ResolvedElementRecord<NodeData>) => element.data.label);

  const { graph, setCell, addCell, removeCell } = useGraph();
  const closeIds = useCells<NodeData, unknown, readonly dia.Cell.ID[]>(() => {
    const currentElement = graph.getCell(id);
    if (!currentElement) return [];
    const area = currentElement.getBBox().inflate(PROXIMITY_THRESHOLD);
    const proximityElements = graph
      .findElementsInArea(area)
      .filter((element_) => element_.id !== id);
    return proximityElements.map((element_) => element_.id);
  }, util.isEqual);

  useEffect(() => {
    for (const closeId of closeIds) {
      const { linkId, source, target } = getProximityLink(id, closeId);
      const existing = graph.getCell(linkId) as unknown as CellRecord | undefined;
      if (existing) {
        setCell({
          id: linkId,
          source,
          target,
          style: { color: PRIMARY, width: 2, dasharray: '5 5' },
        } as CellRecord);
      } else {
        addCell({
          id: linkId,
          type: 'LinkModel',
          source,
          target,
          style: { color: PRIMARY, width: 2, dasharray: '5 5' },
        });
      }
    }
    return () => {
      for (const closeId of closeIds) {
        const { linkId } = getProximityLink(id, closeId);
        removeCell(linkId);
      }
    };
  }, [addCell, closeIds, graph, id, removeCell, setCell]);

  return <HTMLBox>{label}</HTMLBox>;
}

function Main() {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', position: 'relative' }}>
      <Paper
        className={PAPER_CLASSNAME}
        height={280}
        renderElement={ResizableNode}
        {...STRAIGHT_LINKS}
      />
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
