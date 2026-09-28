import { useCallback, useRef, useState } from 'react';
import type { dia } from '@joint/core';
import {
  type CellRecord,
  GraphProvider,
  HTMLBox,
  Paper,
  type RenderElement,
} from '@joint/react';

interface NodeData {
  readonly label: string;
}

const SIZE = { width: 140, height: 50 };
const LINK_COLOR = '#8697A6';
const LINK_STYLE = { color: LINK_COLOR, targetMarker: 'arrow' } as const;

const initialCells: ReadonlyArray<CellRecord<NodeData>> = [
  { id: 'a', type: 'element', data: { label: 'Pinch' }, position: { x: 60, y: 40 }, size: SIZE },
  { id: 'b', type: 'element', data: { label: 'to' }, position: { x: 300, y: 140 }, size: SIZE },
  { id: 'c', type: 'element', data: { label: 'zoom' }, position: { x: 540, y: 40 }, size: SIZE },
  { id: 'a→b', type: 'link', source: { id: 'a' }, target: { id: 'b' }, style: LINK_STYLE },
  { id: 'b→c', type: 'link', source: { id: 'b' }, target: { id: 'c' }, style: LINK_STYLE },
];

const renderElement: RenderElement<NodeData> = (data) => (
  <HTMLBox className="jj-node">{data.label}</HTMLBox>
);

function Main() {
  const paperRef = useRef<dia.Paper | null>(null);
  const [zoom, setZoom] = useState(1);

  const resetView = useCallback(() => {
    const paper = paperRef.current;
    if (!paper) return;
    paper.scale(1, 1);
    paper.translate(0, 0);
  }, []);

  const handleScale = useCallback(
    (params: { readonly scaleX: number }) => setZoom(params.scaleX),
    []
  );

  return (
    <div className="flex size-full flex-col">
      <div className="jj-controls m-3">
        <span className="jj-chip">{Math.round(zoom * 100)}%</span>
        <button type="button" className="jj-btn jj-btn--primary" onClick={resetView}>
          Reset view
        </button>
        <span className="jj-label">
          Pinch to zoom &amp; two-finger drag to pan on a touchscreen — or Ctrl/Cmd + wheel on a
          touchpad. Built in, no props needed.
        </span>
      </div>
      <Paper
        ref={paperRef}
        className="min-h-0 flex-1"
        renderElement={renderElement}
        onScale={handleScale}
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
