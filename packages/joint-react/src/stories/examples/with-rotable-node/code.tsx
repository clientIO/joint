/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { GraphProvider, Paper, useElementsLayout, usePaper, useMeasureNode, useElementId, type FlatElementData, type FlatLinkData } from '@joint/react';
import '../index.css';
import { useCallback, useRef } from 'react';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import { useGraph } from '@joint/react';

interface NodeData {
  readonly [key: string]: unknown;
  readonly label: string;
}

const initialElements: Record<string, FlatElementData<NodeData>> = {
  '1': { data: { label: 'Node 1' }, x: 20, y: 100 },
  '2': { data: { label: 'Node 2' }, x: 200, y: 100 },
};

const initialEdges: Record<string, FlatLinkData> = {
  'e1-2': {
    source: '1',
    target: '2',
    color: PRIMARY,
  },
};

function RotatableNode({ label }: Readonly<NodeData>) {
  const id = useElementId();
  const { paper } = usePaper();
  const { setElement } = useGraph();

  const dragHandle = useCallback(
    (event: PointerEvent) => {
      if (!paper) return;
      const graph = paper.model;
      const point = paper.clientToLocalPoint(event.clientX, event.clientY);
      const center = graph.getCell(id).getBBox().center();
      const deg = center.angleBetween(point, center.clone().offset(0, -1));
      setElement(id, (previous) => ({ ...previous, angle: Math.round(deg) }));
    },
    [id, paper, setElement]
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
  const { width, height } = useMeasureNode(elementRef);
  return (
    <foreignObject width={width} height={height} overflow="visible">
      <div ref={elementRef} className="rotatable-node">
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
  const elementRotation = useElementsLayout<string[]>((layout) =>
    [...layout.values()].map(({ angle }) => `${angle?.toString().padStart(3, '0')} deg`)
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
