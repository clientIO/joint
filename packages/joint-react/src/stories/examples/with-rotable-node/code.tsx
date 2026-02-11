/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { GraphProvider, Paper, useElements, usePaper, useNodeSize, useCellId } from '@joint/react';
import '../index.css';
import { useCallback, useRef } from 'react';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import { useCellActions } from '../../../hooks/use-cell-actions';

const initialElements: Record<string, { label: string; x: number; y: number }> = {
  '1': { label: 'Node 1', x: 20, y: 100 },
  '2': { label: 'Node 2', x: 200, y: 100 },
};

const initialEdges: Record<string, { source: string; target: string; color: string }> = {
  'e1-2': {
    source: '1',
    target: '2',
    color: PRIMARY,
  },
};

type BaseElementWithData = (typeof initialElements)[string];

function RotatableNode({ label }: Readonly<BaseElementWithData>) {
  const id = useCellId();
  const paper = usePaper();
  const { set } = useCellActions();

  const dragHandle = useCallback(
    (event: PointerEvent) => {
      if (!paper) return;
      const graph = paper.model;
      const point = paper.clientToLocalPoint(event.clientX, event.clientY);
      const center = graph.getCell(id).getBBox().center();
      const deg = center.angleBetween(point, center.clone().offset(0, -1));
      set(id, (previous) => ({ ...previous, angle: Math.round(deg) }));
    },
    [id, paper, set]
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent) => {
      event.stopPropagation();
      event.preventDefault();
      const node = event.currentTarget as HTMLDivElement;
      if (!node) {
        return;
      }
      node.setPointerCapture(event.pointerId);
      node.addEventListener('pointermove', dragHandle);
    },
    [dragHandle]
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent) => {
      const node = event.currentTarget as HTMLDivElement;
      if (!node) {
        return;
      }
      node.removeEventListener('pointermove', dragHandle);
      node.releasePointerCapture(event.pointerId);
    },
    [dragHandle]
  );

  const elementRef = useRef<HTMLDivElement>(null);
  const { width, height } = useNodeSize(elementRef);
  return (
    <foreignObject width={width} height={height} overflow="visible">
      <div ref={elementRef} className="node">
        <div
          className="rotatable-node__handle"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
        />
        {label}
      </div>
    </foreignObject>
  );
}

function Main() {
  const elementRotation = useElements((items) =>
    Object.values(items).map(({ angle }) => `${angle?.toString().padStart(3, '0')} deg`)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'row', position: 'relative' }}>
      <Paper className={PAPER_CLASSNAME} height={280} renderElement={RotatableNode} />
      <div>
        <u>angle</u>
        {elementRotation.map((rotation, index) => (
          // eslint-disable-next-line @eslint-react/no-array-index-key
          <div key={`${index}-${rotation}`} style={{ marginLeft: 10 }}>
            {index + 1}. {rotation}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <GraphProvider elements={initialElements} links={initialEdges}>
      <Main />
    </GraphProvider>
  );
}
