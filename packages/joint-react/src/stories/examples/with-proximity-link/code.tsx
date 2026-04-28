/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import {
  GraphProvider,
  HTMLBox,
  Paper,
  useCell,
  useCellId,
  useCells,
  useGraph,
  type CellRecord,
  type ResolvedCellRecord,
  type ResolvedElementRecord,
} from '@joint/react';
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

type ProximityElement = ResolvedElementRecord<NodeData>;

const initialCells: ReadonlyArray<CellRecord<NodeData>> = [
  { id: '1', type: 'element', data: { label: 'Node 1' }, position: { x: 100, y: 15 } },
  { id: '2', type: 'element', data: { label: 'Node 2' }, position: { x: 100, y: 200 } },
  { id: '3', type: 'element', data: { label: 'Node 3' }, position: { x: 280, y: 100 } },
  { id: '4', type: 'element', data: { label: 'Node 4' }, position: { x: 15, y: 100 } },
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

function isProximityElement(cell: ResolvedCellRecord): cell is ProximityElement {
  return cell.type === 'element';
}

function bboxesOverlap(a: ProximityElement, b: ProximityElement, padding: number): boolean {
  const aRight = a.position.x + a.size.width + padding;
  const aBottom = a.position.y + a.size.height + padding;
  const bRight = b.position.x + b.size.width;
  const bBottom = b.position.y + b.size.height;
  return (
    a.position.x - padding < bRight &&
    aRight > b.position.x &&
    a.position.y - padding < bBottom &&
    aBottom > b.position.y
  );
}

function ResizableNode() {
  const id = useCellId();
  const label = useCell((element: ProximityElement) => element.data.label);
  const { setCell, removeCell } = useGraph();

  const closeIds = useCells((cells) => {
    const me = cells.find((cell) => cell.id === id);
    if (!me || !isProximityElement(me)) return [];
    return cells
      .filter(isProximityElement)
      .filter((cell) => cell.id !== id && bboxesOverlap(me, cell, PROXIMITY_THRESHOLD))
      .map((cell) => cell.id);
  });

  useEffect(() => {
    for (const closeId of closeIds) {
      const { linkId, source, target } = getProximityLink(id, closeId);
      setCell({
        id: linkId,
        type: 'link',
        source,
        target,
        style: { color: PRIMARY, width: 2, dasharray: '5 5' },
      });
    }
    return () => {
      for (const closeId of closeIds) {
        const { linkId } = getProximityLink(id, closeId);
        removeCell(linkId);
      }
    };
  }, [setCell, closeIds, id, removeCell]);

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
