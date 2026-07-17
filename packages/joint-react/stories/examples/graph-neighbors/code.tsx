import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type CellRecord,
  GraphProvider,
  Paper,
  SVGText,
  selectElementSize,
  useCell,
  useGraph,
  useMarkup,
} from '@joint/react';
import { highlighters, type dia } from '@joint/core';

import './styles.css';

// Colors — unified dark diagram palette.
const SELECTED_COLOR = '#ED2637';
const NEIGHBOR_COLOR = '#FF9505';
const NODE_STROKE_COLOR = '#3c4f63';
const TEXT_COLOR = '#DDE6ED';
const LINK_COLOR = '#8697A6';

interface NodeData {
  readonly label: string;
}

const SIZE = { width: 120, height: 40 };
const LINK_STYLE = { color: LINK_COLOR };

const initialCells: ReadonlyArray<CellRecord<NodeData>> = [
  { id: 'server', type: 'element', data: { label: 'Server' }, position: { x: 300, y: 30 }, size: SIZE },
  { id: 'db', type: 'element', data: { label: 'Database' }, position: { x: 80, y: 120 }, size: SIZE },
  { id: 'cache', type: 'element', data: { label: 'Cache' }, position: { x: 520, y: 120 }, size: SIZE },
  { id: 'auth', type: 'element', data: { label: 'Auth' }, position: { x: 120, y: 250 }, size: SIZE },
  { id: 'api', type: 'element', data: { label: 'API' }, position: { x: 480, y: 250 }, size: SIZE },
  { id: 'worker', type: 'element', data: { label: 'Worker' }, position: { x: 80, y: 380 }, size: SIZE },
  { id: 'queue', type: 'element', data: { label: 'Queue' }, position: { x: 520, y: 380 }, size: SIZE },
  { id: 'logs', type: 'element', data: { label: 'Logs' }, position: { x: 300, y: 420 }, size: SIZE },
  { id: 'l-server-db', type: 'link', source: { id: 'server' }, target: { id: 'db' }, style: LINK_STYLE },
  { id: 'l-server-cache', type: 'link', source: { id: 'server' }, target: { id: 'cache' }, style: LINK_STYLE },
  { id: 'l-server-api', type: 'link', source: { id: 'server' }, target: { id: 'api' }, style: LINK_STYLE },
  { id: 'l-db-auth', type: 'link', source: { id: 'db' }, target: { id: 'auth' }, style: LINK_STYLE },
  { id: 'l-cache-api', type: 'link', source: { id: 'cache' }, target: { id: 'api' }, style: LINK_STYLE },
  { id: 'l-auth-worker', type: 'link', source: { id: 'auth' }, target: { id: 'worker' }, style: LINK_STYLE },
  { id: 'l-api-queue', type: 'link', source: { id: 'api' }, target: { id: 'queue' }, style: LINK_STYLE },
  { id: 'l-worker-logs', type: 'link', source: { id: 'worker' }, target: { id: 'logs' }, style: LINK_STYLE },
  { id: 'l-queue-logs', type: 'link', source: { id: 'queue' }, target: { id: 'logs' }, style: LINK_STYLE },
  { id: 'l-db-cache', type: 'link', source: { id: 'db' }, target: { id: 'cache' }, style: LINK_STYLE },
];

interface HighlightState {
  readonly selectedId: string | null;
  readonly neighborIds: ReadonlySet<string>;
  readonly connectedLinkIds: ReadonlySet<string>;
}

const EMPTY_SET: ReadonlySet<string> = new Set<string>();

const INITIAL_STATE: HighlightState = {
  selectedId: null,
  neighborIds: EMPTY_SET,
  connectedLinkIds: EMPTY_SET,
};

const LINK_OPACITY_ID = 'neighbor-link-opacity';
const LINK_HIGHLIGHT_ID = 'neighbor-link-highlight';
const LINK_HIGHLIGHT_CLASS = 'highlighted-link';

const ELEMENT_OPACITY_ID = 'neighbor-element-opacity';
const ELEMENT_MASK_ID = 'neighbor-element-mask';

const DIMMED_OPACITY = 0.3;

function RenderNode({ label }: Readonly<NodeData>) {
  const { selectorRef } = useMarkup();
  const { width, height } = useCell(selectElementSize);
  return (
    <g className="cursor-pointer">
      <rect
        ref={selectorRef('body')}
        rx={8}
        ry={8}
        width={width}
        height={height}
        fill="transparent"
        stroke={NODE_STROKE_COLOR}
        strokeWidth={1.5}
      />
      <SVGText
        x={width / 2}
        y={height / 2}
        textAnchor="middle"
        textVerticalAnchor="middle"
        fill={TEXT_COLOR}
        fontSize={14}
        fontWeight={500}
      >
        {label}
      </SVGText>
    </g>
  );
}

/** Emphasise the links touching the selected node and dim the rest. */
function highlightLinks(paper: dia.Paper, state: HighlightState) {
  const graph = paper.model;
  for (const linkId of state.connectedLinkIds) {
    const cell = graph.getCell(linkId);
    if (!cell?.isLink()) continue;
    const view = paper.findViewByModel(cell);
    if (!view) continue;
    highlighters.addClass.add(view, 'line', LINK_HIGHLIGHT_ID, {
      className: LINK_HIGHLIGHT_CLASS,
    });
  }

  const otherLinks = graph.getLinks().filter((link) => !state.connectedLinkIds.has(String(link.id)));
  for (const link of otherLinks) {
    const view = paper.findViewByModel(link);
    if (!view) continue;
    highlighters.opacity.add(view, 'root', LINK_OPACITY_ID, {
      alphaValue: DIMMED_OPACITY,
    });
  }
}

/** Ring the selected node and its neighbors, dim every other element. */
function highlightElements(paper: dia.Paper, state: HighlightState) {
  const graph = paper.model;
  for (const element of graph.getElements()) {
    const elementId = String(element.id);
    const view = paper.findViewByModel(element);
    if (!view) continue;

    if (elementId === state.selectedId || state.neighborIds.has(elementId)) {
      highlighters.mask.add(view, 'body', ELEMENT_MASK_ID, {
        padding: 6,
        attrs: {
          stroke: elementId === state.selectedId ? SELECTED_COLOR : NEIGHBOR_COLOR,
          'stroke-width': 3,
          fill: 'none',
        },
      });
    } else {
      highlighters.opacity.add(view, 'root', ELEMENT_OPACITY_ID, {
        alphaValue: DIMMED_OPACITY,
      });
    }
  }
}

function clearHighlighters(paper: dia.Paper) {
  highlighters.addClass.removeAll(paper, LINK_HIGHLIGHT_ID);
  highlighters.opacity.removeAll(paper, LINK_OPACITY_ID);
  highlighters.opacity.removeAll(paper, ELEMENT_OPACITY_ID);
  highlighters.mask.removeAll(paper, ELEMENT_MASK_ID);
}

function Main() {
  const { graph } = useGraph();
  const paperRef = useRef<dia.Paper | null>(null);
  const [highlightState, setHighlightState] = useState<HighlightState>(INITIAL_STATE);

  useEffect(() => {
    const paper = paperRef.current;
    if (!paper) return;

    clearHighlighters(paper);
    if (highlightState.selectedId) {
      highlightLinks(paper, highlightState);
      highlightElements(paper, highlightState);
    }
  }, [highlightState]);

  const renderElement = useCallback((data: NodeData) => <RenderNode {...data} />, []);

  const handleElementClick = useCallback(
    ({ id }: { id: dia.Cell.ID }) => {
      const clickedId = String(id);
      setHighlightState((previous) => {
        if (previous.selectedId === clickedId) return INITIAL_STATE;

        const element = graph.getCell(id) as dia.Element;
        const neighbors = graph.getNeighbors(element);
        const connectedLinks = graph.getConnectedLinks(element);

        return {
          selectedId: clickedId,
          neighborIds: new Set(neighbors.map((neighbor) => String(neighbor.id))),
          connectedLinkIds: new Set(connectedLinks.map((link) => String(link.id))),
        };
      });
    },
    [graph]
  );

  const handleBlankClick = useCallback(() => setHighlightState(INITIAL_STATE), []);

  return (
    <Paper
      ref={paperRef}
      className="size-full"
      renderElement={renderElement}
      drawGrid={false}
      onElementPointerClick={handleElementClick}
      onBlankPointerClick={handleBlankClick}
    />
  );
}

export default function App() {
  return (
    <GraphProvider initialCells={initialCells}>
      <Main />
    </GraphProvider>
  );
}
