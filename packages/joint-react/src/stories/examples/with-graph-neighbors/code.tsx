/* eslint-disable react-perf/jsx-no-new-object-as-prop */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  GraphProvider,
  Paper,
  TextNode,
  useGraph,
  useMarkup,
  usePaperEvents,
  type FlatElementData,
  type FlatLinkData,
} from '@joint/react';
import { highlighters, type dia } from '@joint/core';
import { LIGHT, PAPER_CLASSNAME, PRIMARY, SECONDARY } from 'storybook-config/theme';

import '../index.css';
import './styles.css';

// ============================================================================
// Data
// ============================================================================

interface NodeData extends FlatElementData {
  readonly label: string;
  readonly width: number;
  readonly height: number;
}

const initialElements: Record<string, NodeData> = {
  server: {
    label: 'Server',
    x: 300,
    y: 30,
    width: 120,
    height: 40,
  },
  db: {
    label: 'Database',
    x: 80,
    y: 120,
    width: 120,
    height: 40,
  },
  cache: {
    label: 'Cache',
    x: 520,
    y: 120,
    width: 120,
    height: 40,
  },
  auth: {
    label: 'Auth',
    x: 120,
    y: 250,
    width: 120,
    height: 40,
  },
  api: {
    label: 'API',
    x: 480,
    y: 250,
    width: 120,
    height: 40,
  },
  worker: {
    label: 'Worker',
    x: 80,
    y: 380,
    width: 120,
    height: 40,
  },
  queue: {
    label: 'Queue',
    x: 520,
    y: 380,
    width: 120,
    height: 40,
  },
  logs: {
    label: 'Logs',
    x: 300,
    y: 420,
    width: 120,
    height: 40,
  },
};

const initialLinks: Record<string, FlatLinkData> = {
  'l-server-db': {
    source: 'server',
    target: 'db',
    color: LIGHT,
  },
  'l-server-cache': {
    source: 'server',
    target: 'cache',
    color: LIGHT,
  },
  'l-server-api': {
    source: 'server',
    target: 'api',
    color: LIGHT,
  },
  'l-db-auth': {
    source: 'db',
    target: 'auth',
    color: LIGHT,
  },
  'l-cache-api': {
    source: 'cache',
    target: 'api',
    color: LIGHT,
  },
  'l-auth-worker': {
    source: 'auth',
    target: 'worker',
    color: LIGHT,
  },
  'l-api-queue': {
    source: 'api',
    target: 'queue',
    color: LIGHT,
  },
  'l-worker-logs': {
    source: 'worker',
    target: 'logs',
    color: LIGHT,
  },
  'l-queue-logs': {
    source: 'queue',
    target: 'logs',
    color: LIGHT,
  },
  'l-db-cache': {
    source: 'db',
    target: 'cache',
    color: LIGHT,
  },
};

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

function RenderNode({ label, width, height }: Readonly<NodeData>) {
  const { selectorRef } = useMarkup();
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

      <TextNode
        x={width / 2}
        y={height / 2}
        textAnchor="middle"
        textVerticalAnchor="middle"
        fill={LIGHT}
        fontSize={14}
        fontWeight={500}
      >
        {label}
      </TextNode>
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

  const otherLinks = graph
    .getLinks()
    .filter((l) => !state.connectedLinkIds.has(String(l.id)));
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
  const graph = useGraph();
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
    paperRef,
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

  const renderElement = useCallback((props: NodeData) => <RenderNode {...props} />, []);

  return (
    <Paper
      ref={paperRef}
      width="100%"
      className={PAPER_CLASSNAME}
      height={500}
      renderElement={renderElement}
      defaultRouter={{ name: 'normal' }}
      defaultConnector={{ name: 'rounded', args: { radius: 20 } }}
    />
  );
}

// ============================================================================
// App
// ============================================================================

export default function App() {
  return (
    <GraphProvider elements={initialElements} links={initialLinks}>
      <Main />
    </GraphProvider>
  );
}
