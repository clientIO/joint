/* eslint-disable react-perf/jsx-no-new-array-as-prop */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import type { GraphLink } from '@joint/react';
import {
  type GraphElement,
  GraphProvider,
  jsx,
  Paper,
  TextNode,
  useCellActions,
  useCellId,
  usePaper,
} from '@joint/react';
import { BG, LIGHT, PAPER_CLASSNAME, PRIMARY, TEXT } from 'storybook-config/theme';
import { useCallback, useMemo } from 'react';
import { dia, elementTools } from '@joint/core';
import { DirectedGraph } from '@joint/layout-directed-graph';

import '../index.css';

// Base properties shared by all events
interface BaseEvent extends GraphElement {
  readonly label: string;
  readonly width: number;
  readonly height: number;
  readonly collapsed?: boolean;
}

const GATE_TYPES = ['OR', 'XOR', 'AND', 'PRIORITY_AND', 'INHIBIT', 'TRANSFER'] as const;

interface IntermediateEvent extends BaseEvent {
  readonly type: 'IntermediateEvent';
  readonly gate: (typeof GATE_TYPES)[number];
}

interface UndevelopedEvent extends BaseEvent {
  readonly type: 'UndevelopedEvent';
}

interface BasicEvent extends BaseEvent {
  readonly type: 'BasicEvent';
}

interface ExternalEvent extends BaseEvent {
  readonly type: 'ExternalEvent';
}

interface ConditioningEvent extends BaseEvent {
  readonly type: 'ConditioningEvent';
}

type FTAElement =
  | IntermediateEvent
  | UndevelopedEvent
  | BasicEvent
  | ExternalEvent
  | ConditioningEvent;

const initialElements: Record<string, FTAElement> = {
  ot8h17: {
    type: 'IntermediateEvent',
    width: 120,
    height: 150,
    label: 'Fall from Scaffolding',
    gate: 'INHIBIT',
  },
  d8jpey: {
    type: 'IntermediateEvent',
    width: 120,
    height: 150,
    label: 'Fall from the Scaffolding',
    gate: 'AND',
  },
  is079n: {
    type: 'IntermediateEvent',
    width: 120,
    height: 150,
    label: 'Safety Belt Not Working',
    gate: 'OR',
  },
  ht8wnb: {
    type: 'IntermediateEvent',
    width: 120,
    height: 150,
    label: 'Fall By Accident',
    gate: 'OR',
  },
  '07vhpd': {
    type: 'IntermediateEvent',
    width: 120,
    height: 150,
    label: 'Broken By Equipment',
    gate: 'OR',
  },
  d8ojep: {
    type: 'IntermediateEvent',
    width: 120,
    height: 150,
    label: 'Did not Wear Safety Belt',
    gate: 'OR',
  },
  szf1q3: {
    type: 'UndevelopedEvent',
    width: 140,
    height: 80,
    label: 'Slip and Fall',
  },
  kj5m9a: {
    type: 'UndevelopedEvent',
    width: 140,
    height: 80,
    label: 'Lose Balance',
  },
  tcv79r: {
    type: 'UndevelopedEvent',
    width: 140,
    height: 80,
    label: 'Upholder Broken',
  },
  ylp4gu: {
    type: 'BasicEvent',
    width: 80,
    height: 80,
    label: 'Safety Belt Broken',
  },
  q2vwnc: {
    type: 'BasicEvent',
    width: 80,
    height: 80,
    label: 'Forgot to Wear',
  },
  x8rboj: {
    type: 'ExternalEvent',
    width: 80,
    height: 100,
    label: 'Take off When Walking',
  },
  mte5xr: {
    type: 'ConditioningEvent',
    width: 140,
    height: 80,
    label: 'Height and Ground Condition',
  },
};

const initialLinks: Record<string, GraphLink> = {
  'link-0': {
    source: 'ot8h17',
    target: 'd8jpey',
    z: -1,
    color: PRIMARY,
    width: 2,
    targetMarker: 'none',
  },
  'link-1': {
    source: 'd8jpey',
    target: 'is079n',
    z: -1,
    color: PRIMARY,
    width: 2,
    targetMarker: 'none',
  },
  'link-2': {
    source: 'd8jpey',
    target: 'ht8wnb',
    z: -1,
    color: PRIMARY,
    width: 2,
    targetMarker: 'none',
  },
  'link-3': {
    source: 'is079n',
    target: '07vhpd',
    z: -1,
    color: PRIMARY,
    width: 2,
    targetMarker: 'none',
  },
  'link-4': {
    id: 'link-4',
    source: 'is079n',
    target: 'd8ojep',
    z: -1,
    color: PRIMARY,
    width: 2,
    targetMarker: 'none',
  },
  'link-5': {
    id: 'link-5',
    source: 'ht8wnb',
    target: 'szf1q3',
    z: -1,
    color: PRIMARY,
    width: 2,
    targetMarker: 'none',
  },
  'link-6': {
    id: 'link-6',
    source: 'ht8wnb',
    target: 'kj5m9a',
    z: -1,
    color: PRIMARY,
    width: 2,
    targetMarker: 'none',
  },
  'link-7': {
    id: 'link-7',
    source: '07vhpd',
    target: 'tcv79r',
    z: -1,
    color: PRIMARY,
    width: 2,
    targetMarker: 'none',
  },
  'link-8': {
    id: 'link-8',
    source: '07vhpd',
    target: 'ylp4gu',
    z: -1,
    color: PRIMARY,
    width: 2,
    targetMarker: 'none',
  },
  'link-9': {
    id: 'link-9',
    source: 'd8ojep',
    target: 'q2vwnc',
    z: -1,
    color: PRIMARY,
    width: 2,
    targetMarker: 'none',
  },
  'link-10': {
    source: 'd8ojep',
    target: 'x8rboj',
    z: -1,
    color: PRIMARY,
    width: 2,
    targetMarker: 'none',
  },
  'link-11': {
    source: 'ot8h17',
    sourceAnchor: {
      name: 'perpendicular',
    },
    target: 'mte5xr',
    z: -1,
    color: PRIMARY,
    width: 2,
    targetMarker: 'none',
  },
};

// ----------------------------------------------------------------------------
// Custom Hooks
// ----------------------------------------------------------------------------
function useElementPattern() {
  const paper = usePaper();

  return useMemo(() => {
    const patternId = paper.definePattern({
      id: 'body-pattern',
      attrs: {
        width: 12,
        height: 12,
        strokeWidth: 2,
        strokeOpacity: 0.3,
        stroke: PRIMARY,
        fill: 'none',
      },
      markup: jsx(
        <>
          <rect width="12" height="12" fill="#131e29" stroke="none" />
          <path d="M 0 0 L 12 12 M 6 -6 L 18 6 M -6 6 L 6 18" />
        </>
      ),
    });

    return `url(#${patternId})`;
  }, [paper]);
}

function useGatePattern() {
  const paper = usePaper();

  return useMemo(() => {
    const patternId = paper.definePattern({
      id: 'gate-pattern',
      attrs: {
        width: 6,
        height: 6,
        strokeWidth: 1,
        strokeOpacity: 0.3,
        stroke: LIGHT,
        fill: 'none',
      },
      markup: jsx(
        <>
          <rect width="6" height="6" fill="#131e29" stroke="none" />
          <path d="M 3 0 L 3 6" />
        </>
      ),
    });

    return `url(#${patternId})`;
  }, [paper]);
}

// ----------------------------------------------------------------------------
// Shapes
// ----------------------------------------------------------------------------
function IntermediateEventNode({ label, width, height, gate }: Readonly<IntermediateEvent>) {
  const id = useCellId();
  const { set } = useCellActions<IntermediateEvent>();
  const gatePatternUrl = useGatePattern();

  const gateSvgPath = useMemo(() => {
    // Add vertical line extending upward for better connection
    const verticalLine = ' M 0 -30 0 -80';

    switch (gate) {
      case 'OR': {
        return (
          'M -20 0 C -20 -15 -10 -30 0 -30 C 10 -30 20 -15 20 0 C 10 -6 -10 -6 -20 0' + verticalLine
        );
      }
      case 'XOR': {
        return (
          'M -20 0 C -20 -15 -10 -30 0 -30 C 10 -30 20 -15 20 0 C 10 -6 -10 -6 -20 0 M -20 0 0 -30 M 0 -30 20 0' +
          verticalLine
        );
      }
      case 'AND': {
        return 'M -20 0 C -20 -25 -10 -30 0 -30 C 10 -30 20 -25 20 0 Z' + verticalLine;
      }
      case 'PRIORITY_AND': {
        return (
          'M -20 0 C -20 -25 -10 -30 0 -30 C 10 -30 20 -25 20 0 Z M -20 0 0 -30 20 0' + verticalLine
        );
      }
      case 'INHIBIT': {
        return 'M -10 0 -20 -15 -10 -30 10 -30 20 -15 10 0 Z' + verticalLine;
      }
      case 'TRANSFER': {
        return 'M -20 0 20 0 0 -30 z' + verticalLine;
      }
    }
  }, [gate]);

  const changeGate = useCallback(() => {
    const currentIndex = GATE_TYPES.indexOf(gate);
    const nextIndex = (currentIndex + 1) % GATE_TYPES.length;
    const nextGate = GATE_TYPES[nextIndex];

    set(id, (previous) => ({
      ...previous,
      gate: nextGate,
    }));
  }, [id, gate, set]);

  return (
    <>
      {/* Gate */}
      <path
        stroke={LIGHT}
        strokeWidth={2}
        fill={gatePatternUrl}
        fillRule="nonzero"
        cursor="pointer"
        d={gateSvgPath}
        transform={`translate(${width / 2}, ${height})`}
        onClick={changeGate}
      />
      {/* Body */}
      <path
        d={`M 10 0 H ${width - 10} l 10 10 V ${height - 90} l -10 10 H 10 l -10 -10 V 10 Z`}
        stroke={PRIMARY}
        strokeWidth={2}
        fill={BG}
      />
      {/* ID Body */}
      <rect
        width={width - 20}
        height={30}
        x={10}
        y={height - 70}
        fill={BG}
        stroke={LIGHT}
        strokeWidth={2}
      />
      {/* Label */}
      <TextNode
        width={width - 20}
        height={height - 90}
        fontSize={16}
        fontFamily="sans-serif"
        fill={TEXT}
        x={width / 2}
        y={height / 2 - 40}
        textWrap={{ ellipsis: true }}
        textAnchor="middle"
        textVerticalAnchor="middle"
      >
        {label}
      </TextNode>
      {/* ID Label */}
      <TextNode
        x={width / 2}
        y={height - 55}
        fontSize={14}
        fontFamily="sans-serif"
        fill={TEXT}
        textAnchor="middle"
        textVerticalAnchor="middle"
        annotations={[{ start: 4, end: 10, attrs: { fill: '#f6f740' } }]}
      >
        {`id: ${id}`}
      </TextNode>
    </>
  );
}

function UndevelopedEventNode({ label, width, height }: Readonly<UndevelopedEvent>) {
  const bodyPatternUrl = useElementPattern();

  return (
    <>
      {/* Diamond Body */}
      <path
        d={`M 0 ${height / 2} ${width / 2} ${height} ${width} ${height / 2} ${width / 2} 0 Z`}
        stroke={PRIMARY}
        fill={bodyPatternUrl}
        strokeWidth={2}
      />
      {/* Label */}
      <TextNode
        width={width - 20}
        height={height - 20}
        fontSize={16}
        fontFamily="sans-serif"
        fill={TEXT}
        x={width / 2}
        y={height / 2}
        textWrap={{ ellipsis: true }}
        textAnchor="middle"
        textVerticalAnchor="middle"
      >
        {label}
      </TextNode>
    </>
  );
}

function BasicEventNode({ label, width, height }: Readonly<BasicEvent>) {
  const bodyPatternUrl = useElementPattern();

  return (
    <>
      {/* Circle Body */}
      <circle
        cx={width / 2}
        cy={height / 2}
        r={width / 2}
        stroke={PRIMARY}
        fill={bodyPatternUrl}
        strokeWidth={2}
      />
      {/* Label */}
      <TextNode
        width={width - 20}
        height={height - 20}
        fontSize={16}
        fontFamily="sans-serif"
        fill={TEXT}
        x={width / 2}
        y={height / 2}
        textWrap={{ ellipsis: true }}
        textAnchor="middle"
        textVerticalAnchor="middle"
      >
        {label}
      </TextNode>
    </>
  );
}

function ExternalEventNode({ label, width, height }: Readonly<ExternalEvent>) {
  const bodyPatternUrl = useElementPattern();

  return (
    <>
      {/* Pentagon/House Body */}
      <path
        d={`M 0 20 ${width / 2} 0 ${width} 20 ${width} ${height} 0 ${height} Z`}
        stroke={PRIMARY}
        fill={bodyPatternUrl}
        strokeWidth={2}
      />
      {/* Label */}
      <TextNode
        width={width - 20}
        height={height - 20}
        fontSize={16}
        fontFamily="sans-serif"
        fill={TEXT}
        x={width / 2}
        y={height / 2}
        textWrap={{ ellipsis: true }}
        textAnchor="middle"
        textVerticalAnchor="middle"
      >
        {label}
      </TextNode>
    </>
  );
}

function ConditioningEventNode({ label, width, height }: Readonly<ConditioningEvent>) {
  const bodyPatternUrl = useElementPattern();

  return (
    <>
      {/* Ellipse Body */}
      <ellipse
        cx={width / 2}
        cy={height / 2}
        rx={width / 2}
        ry={height / 2}
        stroke={PRIMARY}
        fill={bodyPatternUrl}
        strokeWidth={2}
      />
      {/* Label */}
      <TextNode
        width={width - 20}
        height={height - 20}
        fontSize={16}
        fontFamily="sans-serif"
        fill={TEXT}
        x={width / 2}
        y={height / 2}
        textWrap={{ ellipsis: true }}
        textAnchor="middle"
        textVerticalAnchor="middle"
      >
        {label}
      </TextNode>
    </>
  );
}

// ----------------------------------------------------------------------------
// Render Dispatcher
// ----------------------------------------------------------------------------
function RenderFTAElement(props: Readonly<FTAElement>) {
  switch (props.type) {
    case 'IntermediateEvent': {
      return <IntermediateEventNode {...props} />;
    }
    case 'UndevelopedEvent': {
      return <UndevelopedEventNode {...props} />;
    }
    case 'BasicEvent': {
      return <BasicEventNode {...props} />;
    }
    case 'ExternalEvent': {
      return <ExternalEventNode {...props} />;
    }
    case 'ConditioningEvent': {
      return <ConditioningEventNode {...props} />;
    }
  }
}

// ----------------------------------------------------------------------------
// Custom Element Tools
// ----------------------------------------------------------------------------
class ExpandButton extends elementTools.Button {
  options: elementTools.Button.Options = {
    x: 'calc(w / 2 - 35)',
    y: 'calc(h - 15)',
    action: (event, view, _tool) => {
      view.paper?.trigger('element:expand', view, event);
    },
  };

  children = jsx(
    <>
      <rect
        joint-selector="button"
        fill="#cad8e3"
        x="-8"
        y="-8"
        width="16"
        height="16"
        cursor="pointer"
      />
      <path
        joint-selector="icon"
        fill="none"
        stroke="#131e29"
        stroke-width="2"
        pointer-events="none"
      />
    </>
  );

  update() {
    super.update();
    this.childNodes?.icon?.setAttribute('d', this.getIconPath());
  }

  protected getIconPath(): string {
    const collapsed = this.relatedView.model.prop('data/collapsed');
    return collapsed ? 'M -4 0 4 0 M 0 -4 0 4' : 'M -4 0 4 0';
  }
}

// ----------------------------------------------------------------------------
// Layout
// ----------------------------------------------------------------------------
function runLayout(graph: dia.Graph) {
  const autoLayoutElements: dia.Element[] = [];
  const manualLayoutElements: dia.Element[] = [];

  for (const element of graph.getElements()) {
    if (element.prop('data/hidden')) continue;
    // ConditioningEvent needs manual positioning relative to its neighbor
    if (element.prop('data/type') === 'ConditioningEvent') {
      manualLayoutElements.push(element);
    } else {
      autoLayoutElements.push(element);
    }
  }

  // Automatic Layout using DirectedGraph
  DirectedGraph.layout(graph.getSubgraph(autoLayoutElements), {
    rankDir: 'TB',
    setVertices: true,
  });

  // Manual Layout for ConditioningEvent (positioned to the right of its neighbor)
  for (const element of manualLayoutElements) {
    const [neighbor] = graph.getNeighbors(element, { inbound: true });
    if (!neighbor) continue;
    const neighborPosition = neighbor.getBBox().bottomRight();
    element.position(neighborPosition.x + 50, neighborPosition.y - element.size().height / 2 - 15);
  }

  // Make sure the root element of the graph is always at the same position after the layout
  const rootCenter = { x: 500, y: 100 };
  const [source] = graph.getSources();
  if (source) {
    const { width, height } = source.size();
    const diff = source.position().difference({
      x: rootCenter.x - width / 2,
      y: rootCenter.y - height / 2,
    });
    graph.translate(-diff.x, -diff.y);
  }
}

// ----------------------------------------------------------------------------
// Helper Functions
// ----------------------------------------------------------------------------
function addExpandTools(paper: dia.Paper) {
  const graph = paper.model;
  const elements = graph.getElements();

  for (const element of elements) {
    // Only add tools to IntermediateEvent elements
    if (element.prop('data/type') !== 'IntermediateEvent') continue;

    const elementView = element.findView(paper);
    if (!elementView) continue;

    const toolsView = new dia.ToolsView({
      name: 'expand-tools',
      tools: [new ExpandButton()],
    });

    elementView.addTools(toolsView);
  }
}

// ----------------------------------------------------------------------------
// Application Components
// ----------------------------------------------------------------------------
function Main() {
  const cellVisibilityCallback = useCallback((cell: dia.Cell) => {
    return !cell.prop('hidden');
  }, []);

  const handleElementsSizeReady = useCallback(({ paper }: { paper: dia.Paper }) => {
    const graph = paper.model;
    runLayout(graph);
    addExpandTools(paper);

    paper.transformToFitContent({
      padding: 40,
      useModelGeometry: true,
      verticalAlign: 'middle',
      horizontalAlign: 'middle',
    });
  }, []);

  const handleExpand = useCallback((paper: dia.Paper, elementView: dia.ElementView) => {
    const graph = paper.model;
    const element = elementView.model;
    const successorElements = graph.getSuccessors(element);
    const [successor] = successorElements;

    if (successorElements.length === 0) return;

    const shouldExpand = !successor.prop('hidden');
    const successorCells = graph.getSubgraph([element, ...successorElements]);

    for (const cell of successorCells) {
      if (cell === element) {
        cell.prop({
          hidden: false,
          data: {
            collapsed: shouldExpand,
          },
        });
      } else {
        cell.prop('hidden', shouldExpand);
        if (cell.isElement()) {
          cell.prop('data/collapsed', false);
        }
      }
    }

    runLayout(graph);
  }, []);

  return (
    <Paper
      height={600}
      className={PAPER_CLASSNAME}
      renderElement={RenderFTAElement}
      cellVisibility={cellVisibilityCallback}
      onElementsSizeReady={handleElementsSizeReady}
      defaultConnectionPoint={{ name: 'rectangle', args: { useModelGeometry: true } }}
      defaultConnector={{
        name: 'straight',
        args: { cornerType: 'line', cornerRadius: 10 },
      }}
      defaultRouter={{ name: 'orthogonal' }}
      interactive={false}
      async
      customEvents={{
        'element:expand': ({ paper, args }) => {
          const [elementView] = args;
          handleExpand(paper, elementView);
        },
      }}
    />
  );
}

export default function App() {
  return (
    <GraphProvider elements={initialElements} links={initialLinks}>
      <Main />
    </GraphProvider>
  );
}
