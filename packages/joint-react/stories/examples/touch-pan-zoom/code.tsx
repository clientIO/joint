import { startTransition, useCallback, useRef, useState } from 'react';
import type { dia } from '@joint/core';
import {
  type CellRecord,
  GraphProvider,
  HTMLBox,
  Paper,
  type PaperEventHandler,
  type RenderElement,
} from '@joint/react';

interface NodeData {
  readonly label: string;
}

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 5;
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

  // `paper:pinch` comes from a touchpad (Ctrl/Cmd + wheel) and from a two-finger
  // pinch on a touchscreen alike: a relative scale at a point in local coordinates.
  const onPaperPinch = useCallback<PaperEventHandler<'onPaperPinch'>>(
    ({ x, y, scale }) => {
      const paper = paperRef.current;
      if (!paper) return;
      const current = paper.scale().sx;
      const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, current * scale));
      if (next !== current) paper.scaleUniformAtPoint(next, { x, y });
    },
    []
  );

  // `paper:pan` comes from a wheel / touchpad scroll and from a two-finger pan on a
  // touchscreen, with the wheel sign convention: the content moves against the delta.
  const onPaperPan = useCallback<PaperEventHandler<'onPaperPan'>>(
    ({ event, deltaX, deltaY }) => {
      const paper = paperRef.current;
      if (!paper) return;
      // Keeps a wheel scroll from also scrolling the page; the paper prevents the
      // browser defaults of a touch gesture itself.
      event.preventDefault();
      const { tx, ty } = paper.translate();
      paper.translate(tx - deltaX, ty - deltaY);
    },
    []
  );

  const resetView = useCallback(() => {
    const paper = paperRef.current;
    if (!paper) return;
    paper.scale(1, 1);
    paper.translate(0, 0);
  }, []);

  // The zoom chip is not urgent: a transition keeps the paper's own scale work ahead of it.
  const handleScale = useCallback<PaperEventHandler<'onScale'>>(({ scaleX }) => {
    startTransition(() => setZoom(scaleX));
  }, []);

  return (
    <div className="flex size-full flex-col">
      <div className="jj-controls m-3">
        <span className="jj-chip">{Math.round(zoom * 100)}%</span>
        <button type="button" className="jj-btn jj-btn--primary" onClick={resetView}>
          Reset view
        </button>
        <span className="jj-label">
          Pinch to zoom and drag with two fingers to pan on a touchscreen, or Ctrl/Cmd +
          wheel and scroll on a touchpad. A pinch over a node never selects or moves it.
        </span>
      </div>
      <Paper
        ref={paperRef}
        className="min-h-0 flex-1"
        renderElement={renderElement}
        onPaperPinch={onPaperPinch}
        onPaperPan={onPaperPan}
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
