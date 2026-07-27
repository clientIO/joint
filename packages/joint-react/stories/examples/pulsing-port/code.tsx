import { dia, highlighters, linkTools, V } from '@joint/core';
import {
  GraphProvider,
  HTMLBox,
  jsx,
  linkRoutingOrthogonal,
  Paper,
  useCellId,
  useCells,
} from '@joint/react';
import type { CellRecord, DefaultLink, ElementPort, ValidateConnection } from '@joint/react';

// Colors — unified dark diagram palette. The brand red is semantic here: it marks
// the ports and links this demo is about.
const PRIMARY = '#ED2637';
const MUTED_COLOR = '#93A4B3';

const PORT_SIZE = 20;

const ORTHOGONAL_LINKS = linkRoutingOrthogonal({ cornerType: 'line', margin: 20 });

/** Highlighter that draws an expanding, fading ring on each available magnet. */
const Pulse = dia.HighlighterView.extend({
  tagName: 'g',
  attributes: {
    'pointer-events': 'none',
  },
  children() {
    const { radius = PORT_SIZE / 2 } = this.options;
    return jsx(
      <circle fill="none" r={radius} stroke={PRIMARY} strokeWidth={2}>
        <animate attributeName="r" from="8" to="20" dur="1.5s" begin="0s" repeatCount="indefinite" />
        <animate
          attributeName="opacity"
          from="1"
          to="0"
          dur="1.5s"
          begin="0s"
          repeatCount="indefinite"
        />
      </circle>
    );
  },
  highlight(elementView: dia.ElementView, node: SVGElement) {
    this.renderChildren();
    const nodeBBox = elementView.getNodeBoundingRect(node);
    const nodeMatrix = elementView.getNodeMatrix(node);
    const position = V.transformRect(nodeBBox, nodeMatrix).center();
    this.el.setAttribute('transform', `translate(${position.x}, ${position.y})`);
  },
});

const NODE_PORTS: Record<string, ElementPort> = {
  in: {
    cx: 'calc(w / 2)',
    cy: 0,
    width: PORT_SIZE,
    height: PORT_SIZE,
    color: PRIMARY,
    passive: true,
  },
  out: {
    cx: 'calc(w / 2)',
    cy: 'calc(h)',
    width: PORT_SIZE,
    height: PORT_SIZE,
    color: PRIMARY,
  },
};

const initialCells: readonly CellRecord[] = [
  { id: '1', type: 'element', position: { x: 50, y: 50 }, portMap: NODE_PORTS },
  { id: '2', type: 'element', position: { x: 350, y: 50 }, portMap: NODE_PORTS },
  { id: '3', type: 'element', position: { x: 150, y: 250 }, portMap: NODE_PORTS },
];

const DEFAULT_LINK: DefaultLink = { style: { color: PRIMARY, targetMarker: 'arrow' } };
const SNAP_LINKS = { radius: 25 };

const HIGHLIGHTING = {
  [dia.CellView.Highlighting.MAGNET_AVAILABILITY]: {
    name: 'pulse',
    options: { radius: PORT_SIZE / 2 + 4 },
  },
};

const HIGHLIGHTER_NAMESPACE = { ...highlighters, pulse: Pulse };

const removeTool = new linkTools.Remove({ scale: 1.5, style: { stroke: MUTED_COLOR } });
const toolsView = new dia.ToolsView({ tools: [removeTool] });

/** Only allow a connection to finish on a node's passive `in` port. */
const acceptInputPorts: ValidateConnection = ({ target }) => target.port === 'in';

function showRemoveTool({ view }: { view: dia.LinkView }) {
  view.addTools(toolsView);
}

function hideRemoveTool({ view }: { view: dia.LinkView }) {
  view.removeTools();
}

function NodeElement() {
  const id = useCellId();
  const isConnected = useCells((cells) =>
    cells.some(
      (cell) => cell.type === 'link' && (cell.source.id === id || cell.target.id === id)
    )
  );

  return <HTMLBox className={isConnected ? 'jj-node jj-node--active' : 'jj-node'}>{id}</HTMLBox>;
}

export default function App() {
  return (
    <GraphProvider initialCells={initialCells}>
      <Paper
        className="size-full"
        renderElement={NodeElement}
        defaultLink={DEFAULT_LINK}
        validateConnection={acceptInputPorts}
        onLinkMouseEnter={showRemoveTool}
        onLinkMouseLeave={hideRemoveTool}
        linkPinning={false}
        markAvailable
        highlighting={HIGHLIGHTING}
        highlighterNamespace={HIGHLIGHTER_NAMESPACE}
        linkRouting={ORTHOGONAL_LINKS}
        snapLinks={SNAP_LINKS}
      />
    </GraphProvider>
  );
}
