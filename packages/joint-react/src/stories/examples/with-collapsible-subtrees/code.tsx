/* eslint-disable react-perf/jsx-no-new-array-as-prop */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import type { LinkRecord, Cells, LinkStyle } from '@joint/react';
import {
  type ElementRecord,
  GraphProvider,
  jsx,
  Paper,
  SVGText,
  useCellId,
  useElement,
  useGraph,
  useMarkup,
  useNodesMeasuredEffect,
  usePaper,
  usePaperEvents,
  selectElementSize,
} from '@joint/react';
import { BG, LIGHT, PAPER_CLASSNAME, PAPER_STYLE, PRIMARY, TEXT } from 'storybook-config/theme';
import { useCallback, useId, useMemo, useRef } from 'react';
import { dia, elementTools } from '@joint/core';
import { DirectedGraph } from '@joint/layout-directed-graph';

import '../index.css';
import { linkRoutingOrthogonal } from '../../../presets';

const ORTHOGONAL_LINKS = linkRoutingOrthogonal({
  cornerType: 'line',
  cornerRadius: 10,
  mode: 'bottom-top',
});
// Base properties shared by all events
interface BaseEvent {
  readonly label: string;
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

type FTAData =
  | IntermediateEvent
  | UndevelopedEvent
  | BasicEvent
  | ExternalEvent
  | ConditioningEvent;

const initialElements: Array<ElementRecord<FTAData>> = [
  {
    id: 'ot8h17',
    type: 'element',
    data: { type: 'IntermediateEvent', label: 'Fall from Scaffolding', gate: 'INHIBIT' },
    size: { width: 120, height: 150 },
  },
  {
    id: 'd8jpey',
    type: 'element',
    data: { type: 'IntermediateEvent', label: 'Fall from the Scaffolding', gate: 'AND' },
    size: { width: 120, height: 150 },
  },
  {
    id: 'is079n',
    type: 'element',
    data: { type: 'IntermediateEvent', label: 'Safety Belt Not Working', gate: 'OR' },
    size: { width: 120, height: 150 },
  },
  {
    id: 'ht8wnb',
    type: 'element',
    data: { type: 'IntermediateEvent', label: 'Fall By Accident', gate: 'OR' },
    size: { width: 120, height: 150 },
  },
  {
    id: '07vhpd',
    type: 'element',
    data: { type: 'IntermediateEvent', label: 'Broken By Equipment', gate: 'OR' },
    size: { width: 120, height: 150 },
  },
  {
    id: 'd8ojep',
    type: 'element',
    data: { type: 'IntermediateEvent', label: 'Did not Wear Safety Belt', gate: 'OR' },
    size: { width: 120, height: 150 },
  },
  {
    id: 'szf1q3',
    type: 'element',
    data: { type: 'UndevelopedEvent', label: 'Slip and Fall' },
    size: { width: 140, height: 80 },
  },
  {
    id: 'kj5m9a',
    type: 'element',
    data: { type: 'UndevelopedEvent', label: 'Lose Balance' },
    size: { width: 140, height: 80 },
  },
  {
    id: 'tcv79r',
    type: 'element',
    data: { type: 'UndevelopedEvent', label: 'Upholder Broken' },
    size: { width: 140, height: 80 },
  },
  {
    id: 'ylp4gu',
    type: 'element',
    data: { type: 'BasicEvent', label: 'Safety Belt Broken' },
    size: { width: 80, height: 80 },
  },
  {
    id: 'q2vwnc',
    type: 'element',
    data: { type: 'BasicEvent', label: 'Forgot to Wear' },
    size: { width: 80, height: 80 },
  },
  {
    id: 'x8rboj',
    type: 'element',
    data: { type: 'ExternalEvent', label: 'Take off When Walking' },
    size: { width: 80, height: 100 },
  },
  {
    id: 'mte5xr',
    type: 'element',
    data: { type: 'ConditioningEvent', label: 'Height and Ground Condition' },
    size: { width: 140, height: 80 },
  },
];

const DEFAULT_LINK_STYLE: LinkStyle = { color: PRIMARY, width: 2, targetMarker: 'none' };

const initialLinks: LinkRecord[] = [
  {
    id: 'link-0',
    type: 'link',
    source: { id: 'ot8h17' },
    target: { id: 'd8jpey' },
    z: -1,
    style: DEFAULT_LINK_STYLE,
  },
  {
    id: 'link-1',
    type: 'link',
    source: { id: 'd8jpey' },
    target: { id: 'is079n' },
    z: -1,
    style: DEFAULT_LINK_STYLE,
  },
  {
    id: 'link-2',
    type: 'link',
    source: { id: 'd8jpey' },
    target: { id: 'ht8wnb' },
    z: -1,
    style: DEFAULT_LINK_STYLE,
  },
  {
    id: 'link-3',
    type: 'link',
    source: { id: 'is079n' },
    target: { id: '07vhpd' },
    z: -1,
    style: DEFAULT_LINK_STYLE,
  },
  {
    id: 'link-4',
    type: 'link',
    source: { id: 'is079n' },
    target: { id: 'd8ojep' },
    z: -1,
    style: DEFAULT_LINK_STYLE,
  },
  {
    id: 'link-5',
    type: 'link',
    source: { id: 'ht8wnb' },
    target: { id: 'szf1q3' },
    z: -1,
    style: DEFAULT_LINK_STYLE,
  },
  {
    id: 'link-6',
    type: 'link',
    source: { id: 'ht8wnb' },
    target: { id: 'kj5m9a' },
    z: -1,
    style: DEFAULT_LINK_STYLE,
  },
  {
    id: 'link-7',
    type: 'link',
    source: { id: '07vhpd' },
    target: { id: 'tcv79r' },
    z: -1,
    style: DEFAULT_LINK_STYLE,
  },
  {
    id: 'link-8',
    type: 'link',
    source: { id: '07vhpd' },
    target: { id: 'ylp4gu' },
    z: -1,
    style: DEFAULT_LINK_STYLE,
  },
  {
    id: 'link-9',
    type: 'link',
    source: { id: 'd8ojep' },
    target: { id: 'q2vwnc' },
    z: -1,
    style: DEFAULT_LINK_STYLE,
  },
  {
    id: 'link-10',
    type: 'link',
    source: { id: 'd8ojep' },
    target: { id: 'x8rboj' },
    z: -1,
    style: DEFAULT_LINK_STYLE,
  },
  {
    id: 'link-11',
    type: 'link',
    source: {
      id: 'ot8h17',
      magnet: 'gate',
      anchor: { name: 'perpendicular' },
      connectionPoint: { name: 'boundary' },
    },
    target: { id: 'mte5xr', anchor: { name: 'midSide' } },
    router: { name: 'normal' },
    z: -1,
    style: DEFAULT_LINK_STYLE,
  },
];

const initialCells: Cells<FTAData> = [...initialElements, ...initialLinks];

// ----------------------------------------------------------------------------
// Custom Hooks
// ----------------------------------------------------------------------------
function useElementPattern() {
  const { paper } = usePaper();

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
  const { paper } = usePaper();

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
function IntermediateEventNode({ label, gate }: Readonly<IntermediateEvent>) {
  const { width, height } = useElement(selectElementSize);
  const id = useCellId();
  const { setCell } = useGraph<FTAData>();
  const gatePatternUrl = useGatePattern();
  const { magnetRef } = useMarkup();

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

    setCell((previous) => {
      const previousElement = previous as ElementRecord<FTAData>;
      const data = previousElement.data as IntermediateEvent | undefined;
      if (!data) {
        return { ...previousElement, id } as ElementRecord<FTAData>;
      }
      return {
        ...previousElement,
        id,
        data: { ...data, gate: nextGate },
      } as ElementRecord<FTAData>;
    });
  }, [id, gate, setCell]);

  return (
    <>
      {/* Gate */}
      <path
        ref={magnetRef('gate')}
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
      <SVGText
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
      </SVGText>
      {/* ID Label */}
      <SVGText
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
      </SVGText>
    </>
  );
}

function UndevelopedEventNode({ label }: Readonly<UndevelopedEvent>) {
  const { width, height } = useElement(selectElementSize);
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
      <SVGText
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
      </SVGText>
    </>
  );
}

function BasicEventNode(props: Readonly<BasicEvent>) {
  const { width, height } = useElement(selectElementSize);
  const bodyPatternUrl = useElementPattern();
  const { label } = props;
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
      <SVGText
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
      </SVGText>
    </>
  );
}

function ExternalEventNode({ label }: Readonly<ExternalEvent>) {
  const { width, height } = useElement(selectElementSize);
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
      <SVGText
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
      </SVGText>
    </>
  );
}

function ConditioningEventNode({ label }: Readonly<ConditioningEvent>) {
  const { width, height } = useElement(selectElementSize);
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
      <SVGText
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
      </SVGText>
    </>
  );
}

// ----------------------------------------------------------------------------
// Render Dispatcher
// ----------------------------------------------------------------------------
function RenderFTAElement(data: FTAData) {
  switch (data.type) {
    case 'IntermediateEvent': {
      return <IntermediateEventNode {...data} />;
    }
    case 'UndevelopedEvent': {
      return <UndevelopedEventNode {...data} />;
    }
    case 'BasicEvent': {
      return <BasicEventNode {...data} />;
    }
    case 'ExternalEvent': {
      return <ExternalEventNode {...data} />;
    }
    case 'ConditioningEvent': {
      return <ConditioningEventNode {...data} />;
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
  const paperId = useId();
  const paperRef = useRef<dia.Paper | null>(null);
  const cellVisibilityCallback = useCallback((cell: dia.Cell) => {
    return !cell.prop('hidden');
  }, []);

  const handleElementsMeasured = useCallback(
    ({ isInitial, paper, graph }: { isInitial: boolean; paper: dia.Paper; graph: dia.Graph }) => {
      if (!isInitial) return;
      runLayout(graph);
      addExpandTools(paper);
      paper.transformToFitContent({
        padding: 40,
        useModelGeometry: true,
        verticalAlign: 'middle',
        horizontalAlign: 'middle',
      });
    },
    []
  );

  const handleExpand = useCallback((jointPaper: dia.Paper, elementView: dia.ElementView) => {
    const graph = jointPaper.model;
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

  usePaperEvents(
    paperId,
    ({ paper }) => ({
      'element:expand': (elementView) => {
        handleExpand(paper, elementView as dia.ElementView);
      },
    }),
    [handleExpand]
  );

  useNodesMeasuredEffect(paperId, handleElementsMeasured);

  const renderElement = useCallback((data: FTAData) => RenderFTAElement(data), []);

  return (
    <Paper
      ref={paperRef}
      id={paperId}
      height={600}
      className={PAPER_CLASSNAME}
      renderElement={renderElement}
      cellVisibility={cellVisibilityCallback}
      {...ORTHOGONAL_LINKS}
      interactive={false}
      style={PAPER_STYLE}
      drawGrid={false}
    />
  );
}

export default function App() {
  return (
    <GraphProvider<FTAData> initialCells={initialCells}>
      <Main />
    </GraphProvider>
  );
}
