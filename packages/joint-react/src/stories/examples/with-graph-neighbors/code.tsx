 

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  GraphProvider,
  useElement,
  Paper,
  SVGText,
    useGraph,
  useMarkup,
  usePaperEvents,
  type Cells,
} from '@joint/react';
import { highlighters, type dia } from '@joint/core';
import { LIGHT, PAPER_CLASSNAME, PAPER_STYLE, PRIMARY, SECONDARY } from 'storybook-config/theme';

import '../index.css';
import './styles.css';

// ============================================================================
// Data
// ============================================================================

interface NodeData {
  readonly label: string;
}

const SIZE = { width: 120, height: 40 };

const initialCells: Cells<NodeData> = [
  { id: 'server', type: 'ElementModel', data: { label: 'Server' }, position: { x: 300, y: 30 }, size: SIZE },
  { id: 'db', type: 'ElementModel', data: { label: 'Database' }, position: { x: 80, y: 120 }, size: SIZE },
  { id: 'cache', type: 'ElementModel', data: { label: 'Cache' }, position: { x: 520, y: 120 }, size: SIZE },
  { id: 'auth', type: 'ElementModel', data: { label: 'Auth' }, position: { x: 120, y: 250 }, size: SIZE },
  { id: 'api', type: 'ElementModel', data: { label: 'API' }, position: { x: 480, y: 250 }, size: SIZE },
  { id: 'worker', type: 'ElementModel', data: { label: 'Worker' }, position: { x: 80, y: 380 }, size: SIZE },
  { id: 'queue', type: 'ElementModel', data: { label: 'Queue' }, position: { x: 520, y: 380 }, size: SIZE },
  { id: 'logs', type: 'ElementModel', data: { label: 'Logs' }, position: { x: 300, y: 420 }, size: SIZE },
  { id: 'l-server-db', type: 'LinkModel', source: { id: 'server' }, target: { id: 'db' }, style: { color: LIGHT } },
  { id: 'l-server-cache', type: 'LinkModel', source: { id: 'server' }, target: { id: 'cache' }, style: { color: LIGHT } },
  { id: 'l-server-api', type: 'LinkModel', source: { id: 'server' }, target: { id: 'api' }, style: { color: LIGHT } },
  { id: 'l-db-auth', type: 'LinkModel', source: { id: 'db' }, target: { id: 'auth' }, style: { color: LIGHT } },
  { id: 'l-cache-api', type: 'LinkModel', source: { id: 'cache' }, target: { id: 'api' }, style: { color: LIGHT } },
  { id: 'l-auth-worker', type: 'LinkModel', source: { id: 'auth' }, target: { id: 'worker' }, style: { color: LIGHT } },
  { id: 'l-api-queue', type: 'LinkModel', source: { id: 'api' }, target: { id: 'queue' }, style: { color: LIGHT } },
  { id: 'l-worker-logs', type: 'LinkModel', source: { id: 'worker' }, target: { id: 'logs' }, style: { color: LIGHT } },
  { id: 'l-queue-logs', type: 'LinkModel', source: { id: 'queue' }, target: { id: 'logs' }, style: { color: LIGHT } },
  { id: 'l-db-cache', type: 'LinkModel', source: { id: 'db' }, target: { id: 'cache' }, style: { color: LIGHT } },
];

// ============================================================================
// Highlight State
// ============================================================================

interface HighlightState {
  readonly selectedId: string | null;
  readonly neighborIds: ReadonlySet<string>;
  readonly connectedLinkIds: ReadonlySet<string>;
}

const EMPTY_SET = new Set<string>();

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

// ============================================================================
// RenderNode
// ============================================================================

function RenderNode({ label }: Readonly<NodeData>) {
  const { selectorRef } = useMarkup();
  const { width, height } = useElement((element) => element.size);
  return (
    <g className="cursor-pointer">
      <rect
        ref={selectorRef('body')}
        rx={8}
        ry={8}
        width={width}
        height={height}
        fill="transparent"
        stroke={LIGHT}
        strokeWidth={1.5}
      />

      <SVGText
        x={width / 2}
        y={height / 2}
        textAnchor="middle"
        textVerticalAnchor="middle"
        fill={LIGHT}
        fontSize={14}
        fontWeight={500}
      >
        {label}
      </SVGText>
    </g>
  );
}

// ============================================================================
// Highlight Helpers
// ============================================================================

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

  const otherLinks = graph.getLinks().filter((l) => !state.connectedLinkIds.has(String(l.id)));
  for (const link of otherLinks) {
    const view = paper.findViewByModel(link);
    if (!view) continue;
    highlighters.opacity.add(view, 'root', LINK_OPACITY_ID, {
      alphaValue: DIMMED_OPACITY,
    });
  }
}

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
          stroke: elementId === state.selectedId ? PRIMARY : SECONDARY,
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

// ============================================================================
// Main
// ============================================================================

function Main() {
  const { graph } = useGraph();
  const paperId = useId();
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

  usePaperEvents(
    paperId,
    {
      'element:pointerclick': (elementView: dia.ElementView) => {
        const clickedId = String(elementView.model.id);

        setHighlightState((previous) => {
          if (previous.selectedId === clickedId) {
            // Deselect if the same element is clicked again
            return INITIAL_STATE;
          }

          const element = graph.getCell(clickedId) as dia.Element;
          const neighbors = graph.getNeighbors(element);
          const nextNeighborIds = new Set(neighbors.map((n) => String(n.id)));

          const connectedLinks = graph.getConnectedLinks(element);
          const nextConnectedLinkIds = new Set(connectedLinks.map((l) => String(l.id)));

          return {
            selectedId: clickedId,
            neighborIds: nextNeighborIds,
            connectedLinkIds: nextConnectedLinkIds,
          };
        });
      },
      'blank:pointerclick': () => setHighlightState(INITIAL_STATE),
    },
    [graph]
  );

  const renderElement = useCallback(
    (data: NodeData) => <RenderNode {...data} />,
    []
  );

  return (
    <Paper
      ref={paperRef}
      id={paperId}
      width="100%"
      className={PAPER_CLASSNAME}
      height={500}
      renderElement={renderElement}
      style={PAPER_STYLE}
      drawGrid={false}
    />
  );
}

// ============================================================================
// App
// ============================================================================

export default function App() {
  return (
    <GraphProvider initialCells={initialCells}>
      <Main />
    </GraphProvider>
  );
}
