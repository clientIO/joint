/* eslint-disable react-perf/jsx-no-new-object-as-prop */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  GraphProvider,
  Highlighter,
  Paper,
  TextNode,
  useCellId,
  useGraph,
  type GraphElement,
  type GraphLink,
  type PaperStore,
} from '@joint/react';
import { highlighters, type dia } from '@joint/core';
import { LIGHT, PAPER_CLASSNAME, PRIMARY, SECONDARY } from 'storybook-config/theme';

import '../index.css';
import './styles.css';

// ============================================================================
// Data
// ============================================================================

interface NodeData extends GraphElement {
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

const initialLinks: Record<string, GraphLink> = {
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

const DIMMED_OPACITY = 0.3;

// ============================================================================
// RenderNode
// ============================================================================

interface RenderNodeProps extends NodeData {
  readonly selectedId: string | null;
  readonly neighborIds: ReadonlySet<string>;
}

function RenderNode({ label, width, height, selectedId, neighborIds }: Readonly<RenderNodeProps>) {
  const id = String(useCellId());

  const isSelected = selectedId === id;
  const isNeighbor = neighborIds.has(id);
  const isDimmed = selectedId !== null && !isSelected && !isNeighbor;

  return (
    <Highlighter.Opacity isHidden={!isDimmed} alphaValue={DIMMED_OPACITY}>
      <g className="cursor-pointer">
        <Highlighter.Mask isHidden={!isSelected && !isNeighbor} padding={6} strokeWidth={3} stroke={isSelected ? PRIMARY : SECONDARY}>
          <rect
            rx={8}
            ry={8}
            width={width}
            height={height}
            fill="transparent"
            stroke={LIGHT}
            strokeWidth={1.5}
          />
        </Highlighter.Mask>
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
    </Highlighter.Opacity>
  );
}

// ============================================================================
// Main
// ============================================================================

function Main() {
  const graph = useGraph();
  const paperStoreRef = useRef<PaperStore | null>(null);

  const [highlightState, setHighlightState] = useState<HighlightState>(INITIAL_STATE);

  useEffect(() => {
    const paper = paperStoreRef.current?.paper;
    if (!paper) return;

    highlighters.addClass.removeAll(paper, LINK_HIGHLIGHT_ID);
    highlighters.opacity.removeAll(paper, LINK_OPACITY_ID);

    for (const linkId of highlightState.connectedLinkIds) {
      const cell = graph.getCell(linkId);
      if (!cell?.isLink()) continue;
      const view = paper.findViewByModel(cell);
      if (!view) continue;

      highlighters.addClass.add(view, 'line', LINK_HIGHLIGHT_ID, {
        className: LINK_HIGHLIGHT_CLASS,
      });
    }

    if (highlightState.selectedId) {
      const otherLinks = graph.getLinks().filter((l) => !highlightState.connectedLinkIds.has(String(l.id)));
      for (const link of otherLinks) {
        const view = paper.findViewByModel(link);
        if (!view) continue;

        highlighters.opacity.add(view, 'root', LINK_OPACITY_ID, {
          alphaValue: DIMMED_OPACITY,
        });
      }
    }

    return () => {
      highlighters.addClass.removeAll(paper, LINK_HIGHLIGHT_ID);
      highlighters.opacity.removeAll(paper, LINK_OPACITY_ID);
    };
  }, [graph, highlightState]);

  const handleElementClick = useCallback(
    ({ elementView }: { elementView: dia.ElementView }) => {
      const clickedId = String(elementView.model.id);

      setHighlightState((previous) => {
        if (previous.selectedId === clickedId) {
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
    [graph],
  );

  const handleBlankClick = useCallback(() => {
    setHighlightState(INITIAL_STATE);
  }, []);

  const renderElement = useCallback(
    (props: NodeData) => <RenderNode {...props} selectedId={highlightState.selectedId} neighborIds={highlightState.neighborIds} />,
    [highlightState],
  );

  return (
    <Paper
      ref={paperStoreRef}
      width="100%"
      className={PAPER_CLASSNAME}
      height={500}
      renderElement={renderElement}
      defaultRouter={{ name: 'normal' }}
      defaultConnector={{ name: 'rounded', args: { radius: 20 } }}
      onElementPointerClick={handleElementClick}
      onBlankPointerClick={handleBlankClick}
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
