/* eslint-disable unicorn/consistent-function-scoping */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import './index.css';
import type {
  Cells,
  ElementRecord,
  LinkRecord,
  LinkLabel,
  TransformOptions,
} from '@joint/react';
import {
  GraphProvider,
  Paper,
  useMarkup,
  useMeasureNode,
  useNodesMeasuredEffect,
  usePaperEvents,
} from '@joint/react';
import { PAPER_CLASSNAME } from 'storybook-config/theme';
import { dia, highlighters, linkTools } from '@joint/core';
import { linkRoutingOrthogonal } from '@joint/react/presets';
import { forwardRef, useId, useRef, useState } from 'react';

const unit = 4;
const bevel = 2 * unit;
const nodeFontSize = 13;
const labelFontSize = 15;
const linkOffset = unit * 1.5;

const ORTHOGONAL_LINKS = linkRoutingOrthogonal({
  cornerType: 'line',
  cornerRadius: bevel,
  margin: unit * 7,
});

type NodeElementData = {
  readonly label: string;
  readonly type: 'start' | 'step' | 'decision';
  readonly cx: number;
  readonly cy: number;
};

const flowchartNodes: Array<ElementRecord<NodeElementData>> = [
  { id: 'start', type: 'ElementModel', data: { label: 'Start', type: 'start', cx: 60, cy: 40 } },
  { id: 'addToCart', type: 'ElementModel', data: { label: 'Add to Cart', type: 'step', cx: 195, cy: 40 } },
  { id: 'checkoutItems', type: 'ElementModel', data: { label: 'Checkout Items', type: 'step', cx: 365, cy: 40 } },
  { id: 'addShippingInfo', type: 'ElementModel', data: { label: 'Add Shipping Info', type: 'step', cx: 550, cy: 40 } },
  { id: 'addPaymentInfo', type: 'ElementModel', data: { label: 'Add Payment Info', type: 'step', cx: 550, cy: 150 } },
  { id: 'validPayment', type: 'ElementModel', data: { label: 'Valid Payment?', type: 'decision', cx: 550, cy: 270 } },
  { id: 'presentErrorMessage', type: 'ElementModel', data: { label: 'Present Error Message', type: 'step', cx: 810, cy: 380 } },
  { id: 'sendOrder', type: 'ElementModel', data: { label: 'Send Order to Warehouse', type: 'step', cx: 230, cy: 270 } },
  { id: 'packOrder', type: 'ElementModel', data: { label: 'Pack Order', type: 'step', cx: 40, cy: 380 } },
  { id: 'qualityCheck', type: 'ElementModel', data: { label: 'Quality Check?', type: 'decision', cx: 230, cy: 500 } },
  { id: 'shipItems', type: 'ElementModel', data: { label: 'Ship Items to Customer', type: 'step', cx: 550, cy: 500 } },
];
const TOP = { name: 'top', args: { useModelGeometry: true, dy: -linkOffset } } as const;
const BOTTOM = { name: 'bottom', args: { useModelGeometry: true, dy: linkOffset } } as const;
const LEFT = { name: 'left', args: { useModelGeometry: true, dx: -linkOffset } } as const;
const RIGHT = { name: 'right', args: { useModelGeometry: true, dx: linkOffset } } as const;

const LINK_OPTIONS: Partial<LinkRecord> = {
  z: 2,
  style: {
    width: 2,
    className: 'jj-flow-line link',
    wrapperClassName: 'jj-flow-outline',
    targetMarker: {
      markup: [{ tagName: 'path', attributes: { d: `M 0 0 L ${2 * unit} ${unit} L ${2 * unit} -${unit} Z` }, className: 'jj-flow-arrowhead' }],
    },
  },
};

const labelPx = unit * 3;
const labelPy = unit * 2;

function bevelRectPath(px: number, py: number, bv: number): string {
  // Single-variable calc: calc(v), calc(v + n), calc(v - n)
  const c1 = (v: string, offset: number) => {
    if (offset === 0) return `calc(${v})`;
    if (offset > 0) return `calc(${v} + ${offset})`;
    return `calc(${v} - ${-offset})`;
  };
  // Two-variable calc via nesting: calc(v1 + calc(v2 + n))
  const c2 = (v1: string, v2: string, offset: number) => `calc(${v1} + ${c1(v2, offset)})`;
  return [
    `M ${c1('x', -(px - bv))} ${c1('y', -py)}`,
    `L ${c2('x', 'w', px - bv)} ${c1('y', -py)}`,
    `L ${c2('x', 'w', px)} ${c1('y', -(py - bv))}`,
    `L ${c2('x', 'w', px)} ${c2('y', 'h', py - bv)}`,
    `L ${c2('x', 'w', px - bv)} ${c2('y', 'h', py)}`,
    `L ${c1('x', -(px - bv))} ${c2('y', 'h', py)}`,
    `L ${c1('x', -px)} ${c2('y', 'h', py - bv)}`,
    `L ${c1('x', -px)} ${c1('y', -(py - bv))}`,
    'Z',
  ].join(' ');
}

const LABEL: LinkLabel = {
  text: '',
  className: 'jj-flow-label-text',
  backgroundClassName: 'jj-flow-label-body',
  backgroundOutlineWidth: unit,
  backgroundPadding: { horizontal: labelPx, vertical: labelPy },
  fontSize: labelFontSize,
  backgroundShape: bevelRectPath(labelPx, labelPy, bevel),
};

const flowchartLinks: LinkRecord[] = [
  // start(50,40) → addToCart(200,40): horizontal right
  {
    id: 'flow1',
    type: 'LinkModel',
    ...LINK_OPTIONS,
    source: { id: 'start', magnet: 'body', anchor: RIGHT },
    target: { id: 'addToCart', magnet: 'body', anchor: LEFT },
  },
  // addToCart(200,40) → checkoutItems(350,40): horizontal right
  {
    id: 'flow2',
    type: 'LinkModel',
    ...LINK_OPTIONS,
    source: { id: 'addToCart', magnet: 'body', anchor: RIGHT },
    target: { id: 'checkoutItems', magnet: 'body', anchor: LEFT },
  },
  // checkoutItems(350,40) → addShippingInfo(500,40): horizontal right
  {
    id: 'flow3',
    type: 'LinkModel',
    ...LINK_OPTIONS,
    source: { id: 'checkoutItems', magnet: 'body', anchor: RIGHT },
    target: { id: 'addShippingInfo', magnet: 'body', anchor: LEFT },
  },
  // addShippingInfo(500,40) → addPaymentInfo(500,140): vertical down
  {
    id: 'flow4',
    type: 'LinkModel',
    ...LINK_OPTIONS,
    source: { id: 'addShippingInfo', magnet: 'body', anchor: BOTTOM },
    target: { id: 'addPaymentInfo', magnet: 'body', anchor: TOP },
  },
  // addPaymentInfo(500,140) → validPayment(500,250): vertical down
  {
    id: 'flow5',
    type: 'LinkModel',
    ...LINK_OPTIONS,
    source: { id: 'addPaymentInfo', magnet: 'body', anchor: BOTTOM },
    target: { id: 'validPayment', magnet: 'body', anchor: TOP },
  },
  // validPayment(500,250) → presentErrorMessage(750,350): down-right
  {
    id: 'flow6',
    type: 'LinkModel',
    ...LINK_OPTIONS,
    source: { id: 'validPayment', magnet: 'body', anchor: BOTTOM },
    target: { id: 'presentErrorMessage', magnet: 'body', anchor: LEFT },
    labelMap: { no: { ...LABEL, text: 'No' } },
  },
  // presentErrorMessage(750,350) → addPaymentInfo(500,140): up-left
  {
    id: 'flow7',
    type: 'LinkModel',
    ...LINK_OPTIONS,
    source: { id: 'presentErrorMessage', magnet: 'body', anchor: TOP },
    target: { id: 'addPaymentInfo', magnet: 'body', anchor: RIGHT },
  },
  // validPayment(500,250) → sendOrder(200,250): horizontal left
  {
    id: 'flow8',
    type: 'LinkModel',
    ...LINK_OPTIONS,
    source: { id: 'validPayment', magnet: 'body', anchor: LEFT },
    target: { id: 'sendOrder', magnet: 'body', anchor: RIGHT },
    labelMap: { yes: { ...LABEL, text: 'Yes' } },
  },
  // sendOrder(200,250) → packOrder(40,350): down-left
  {
    id: 'flow9',
    type: 'LinkModel',
    ...LINK_OPTIONS,
    source: { id: 'sendOrder', magnet: 'body', anchor: LEFT },
    target: { id: 'packOrder', magnet: 'body', anchor: TOP },
  },
  // packOrder(40,350) → qualityCheck(200,460): down-right
  {
    id: 'flow10',
    type: 'LinkModel',
    ...LINK_OPTIONS,
    source: { id: 'packOrder', magnet: 'body', anchor: BOTTOM },
    target: { id: 'qualityCheck', magnet: 'body', anchor: LEFT },
  },
  // qualityCheck(200,460) → shipItems(500,460): horizontal right
  {
    id: 'flow11',
    type: 'LinkModel',
    ...LINK_OPTIONS,
    source: { id: 'qualityCheck', magnet: 'body', anchor: RIGHT },
    target: { id: 'shipItems', magnet: 'body', anchor: LEFT },
    labelMap: { ok: { ...LABEL, text: 'Ok' } },
  },
  // qualityCheck(200,460) → sendOrder(200,250): vertical up
  {
    id: 'flow12',
    type: 'LinkModel',
    ...LINK_OPTIONS,
    source: { id: 'qualityCheck', magnet: 'body', anchor: TOP },
    target: { id: 'sendOrder', magnet: 'body', anchor: BOTTOM },
    labelMap: { notOk: { ...LABEL, text: 'Not Ok' } },
  },
];

const initialCells: Cells<NodeElementData> = [...flowchartNodes, ...flowchartLinks];

interface PropsWithClick {
  readonly onMouseEnter?: () => void;
  readonly onMouseLeave?: () => void;
  readonly isToolActive?: boolean;
}
type FlowchartNodeProps = NodeElementData & PropsWithClick;

function computeNodeBBox(options: TransformOptions & { padding: number; cx: number; cy: number }) {
  const { width: nodeWidth, height: nodeHeight, padding, cx, cy } = options;
  const modelWidth = nodeWidth + 2 * padding;
  const modelHeight = nodeHeight + 2 * padding;
  return {
    width: modelWidth,
    height: modelHeight,
    x: cx - modelWidth / 2,
    y: cy - modelHeight / 2,
  };
}
function DecisionNodeRaw(
  { label, cx, cy, onMouseEnter, onMouseLeave }: FlowchartNodeProps,
  ref: React.ForwardedRef<SVGPolygonElement>
) {
  // If we define custom size, not defined in initial nodes, we have to use measure node
  const padding = 30;

  const textRef = useRef<SVGTextElement>(null);
  const { width, height } = useMeasureNode(textRef, {
    transform: (options) => computeNodeBBox({ ...options, padding, cx, cy }),
  });

  return (
    <>
      <polygon
        className="jj-decision-body"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        ref={ref}
        points={`${width / 2},0 ${width},${height / 2} ${width / 2},${height} 0,${height / 2}`}
        strokeWidth="2"
        strokeLinejoin="round"
      />

      <text
        className="jj-decision-text"
        ref={textRef}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        x={width / 2}
        y={height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={nodeFontSize}
      >
        {label}
      </text>
    </>
  );
}

function StartNodeRaw(
  { label, cx, cy, onMouseEnter, onMouseLeave }: FlowchartNodeProps,
  ref: React.ForwardedRef<SVGRectElement>
) {
  const padding = 20;

  const textRef = useRef<SVGTextElement>(null);
  const { width, height } = useMeasureNode(textRef, {
    transform: (options) => computeNodeBBox({ ...options, padding, cx, cy }),
  });

  return (
    <>
      <rect
        className="jj-start-body"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        ref={ref}
        width={width}
        height={height}
        strokeWidth="2"
        rx={25}
        ry={25}
      />
      <text
        className="jj-start-text"
        ref={textRef}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        x={width / 2}
        y={height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={nodeFontSize}
      >
        {label}
      </text>
    </>
  );
}

function StepNodeRaw(
  { label, cx, cy, onMouseEnter, onMouseLeave }: FlowchartNodeProps,
  ref: React.ForwardedRef<SVGPolygonElement>
) {
  const padding = 20;

  const textRef = useRef<SVGTextElement>(null);
  const { width, height } = useMeasureNode(textRef, {
    transform: (options) => computeNodeBBox({ ...options, padding, cx, cy }),
  });

  return (
    <>
      <polygon
        className="jj-step-body"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        ref={ref}
        points={`0,${bevel} ${bevel},0 ${width - bevel},0 ${width},${bevel} ${width},${height - bevel} ${width - bevel},${height} ${bevel},${height} 0,${height - bevel}`}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <text
        className="jj-step-text"
        ref={textRef}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        x={width / 2}
        y={height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={nodeFontSize}
      >
        {label}
      </text>
    </>
  );
}
const DecisionNode = forwardRef<SVGPolygonElement, FlowchartNodeProps>(DecisionNodeRaw);
const StartNode = forwardRef<SVGRectElement, FlowchartNodeProps>(StartNodeRaw);
const StepNode = forwardRef<SVGPolygonElement, FlowchartNodeProps>(StepNodeRaw);

function RenderFlowchartNode(data: NodeElementData | undefined) {
  const { selectorRef } = useMarkup();

  const bodyRef = selectorRef('body');

  if (!data) return null;

  if (data.type === 'decision') {
    return <DecisionNode ref={bodyRef as React.ForwardedRef<SVGPolygonElement>} {...data} />;
  }
  if (data.type === 'start') {
    return <StartNode ref={bodyRef as React.ForwardedRef<SVGRectElement>} {...data} />;
  }
  return <StepNode ref={bodyRef as React.ForwardedRef<SVGPolygonElement>} {...data} />;
}

// Create link tools

function Main() {
  const paperId = useId();
  const paperRef = useRef<dia.Paper | null>(null);

  usePaperEvents(
    paperId,
    ({ paper }) => ({
      'link:pointerclick': (linkView) => {
        if (!paper) return;

        paper.removeTools();
        dia.HighlighterView.removeAll(paper);
        const snapAnchor: linkTools.AnchorCallback<dia.Point> = (
          coords: dia.Point,
          endView: dia.CellView
        ) => {
          const bbox = endView.model.getBBox().inflate(linkOffset);
          const point = bbox.pointNearestToPoint(coords);
          const center = bbox.center();
          const snapRadius = 10;
          if (Math.abs(point.x - center.x) < snapRadius) {
            point.x = center.x;
          }
          if (Math.abs(point.y - center.y) < snapRadius) {
            point.y = center.y;
          }
          return point;
        };
        const toolsView = new dia.ToolsView({
          tools: [
            new linkTools.TargetAnchor({
              snap: snapAnchor,
              restrictArea: false,
              resetAnchor: true,
            }),
            new linkTools.SourceAnchor({
              snap: snapAnchor,
              restrictArea: false,
              resetAnchor: true,
            }),
          ],
        });
        toolsView.el.classList.add('jj-flow-tools');
        linkView.addTools(toolsView);
        const strokeHighlighter = highlighters.stroke.add(linkView, 'line', 'selection', {
          layer: dia.Paper.Layers.BACK,
          nonScalingStroke: true,
        });
        strokeHighlighter.el.classList.add('jj-flow-selection');
      },
      'element:mouseenter': (elementView) => {
        const hl = highlighters.mask.add(elementView, 'body', 'frame', {
          padding: unit * 1.5,
          attrs: {
            strokeWidth: 1.5,
            strokeLinejoin: 'round',
          },
        });
        hl.el.classList.add('jj-frame');
      },
      'element:mouseleave': (elementView) => {
        highlighters.mask.remove(elementView, 'frame');
      },
      'link:mouseenter': (linkView) => {
        if (highlighters.stroke.get(linkView, 'selection')) return;
        const frame = highlighters.mask.add(
          linkView,
          { label: 0, selector: 'labelBody' },
          'frame',
          {
            padding: unit / 2,
            layer: dia.Paper.Layers.FRONT,
            attrs: {
              strokeWidth: 1.5,
              strokeLinejoin: 'round',
            },
          }
        );
        frame.el.classList.add('jj-frame');
      },
      'link:mouseleave': () => {
        if (!paper) return;

        highlighters.mask.removeAll(paper, 'frame');
      },
      'blank:pointerdown': () => {
        paper.removeTools();
        dia.HighlighterView.removeAll(paper);
      },
    }),
    []
  );

  useNodesMeasuredEffect(paperId, ({ isInitial, paper }) => {
    if (!isInitial) return;
    paper.transformToFitContent({
      padding: 40,
      useModelGeometry: true,
      verticalAlign: 'middle',
      horizontalAlign: 'middle',
    });
  });

  return (
    <Paper
      ref={paperRef}
      id={paperId}
      gridSize={5}
      height={600}
      overflow
      snapLabels
      className={`${PAPER_CLASSNAME} flowchart-paper w-[200px]`}
      renderElement={RenderFlowchartNode}
      interactive={{ linkMove: false }}
      drawGrid={false}
      {...ORTHOGONAL_LINKS}
    />
  );
}

function ThemeSwitch({ onClick }: Readonly<{ onClick: () => void }>) {
  return (
    <div className="theme-switch" title="Switch between light and dark mode" onClick={onClick}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20px"
        height="20px"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#dde6ed"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="light-icon"
      >
        <path
          d="M12 18.5C15.5899 18.5 18.5 15.5899 18.5 12C18.5 8.41015 15.5899 5.5 12 5.5C8.41015 5.5 5.5 8.41015 5.5 12C5.5 15.5899 8.41015 18.5 12 18.5Z"
          strokeWidth="1.5"
        />
        <path
          d="M19.14 19.14L19.01 19.01M19.01 4.99L19.14 4.86L19.01 4.99ZM4.86 19.14L4.99 19.01L4.86 19.14ZM12 2.08V2V2.08ZM12 22V21.92V22ZM2.08 12H2H2.08ZM22 12H21.92H22ZM4.99 4.99L4.86 4.86L4.99 4.99Z"
          strokeWidth="2"
        />
      </svg>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20px"
        height="20px"
        viewBox="0 0 24 24"
        fill="#131e29"
        className="dark-icon"
      >
        <path d="M12.0557 3.59974C12.2752 3.2813 12.2913 2.86484 12.0972 2.53033C11.9031 2.19582 11.5335 2.00324 11.1481 2.03579C6.02351 2.46868 2 6.76392 2 12C2 17.5228 6.47715 22 12 22C17.236 22 21.5313 17.9764 21.9642 12.8518C21.9967 12.4664 21.8041 12.0968 21.4696 11.9027C21.1351 11.7086 20.7187 11.7248 20.4002 11.9443C19.4341 12.6102 18.2641 13 17 13C13.6863 13 11 10.3137 11 6.99996C11 5.73589 11.3898 4.56587 12.0557 3.59974Z" />
      </svg>
      <div className="switch" />
    </div>
  );
}

export default function App() {
  const [isLight, setIsLight] = useState(false);
  return (
    <div className={`flowchart-wrapper${isLight ? ' light-theme' : ''}`}>
      <GraphProvider initialCells={initialCells}>
        <Main />
      </GraphProvider>
      <ThemeSwitch onClick={() => setIsLight((v) => !v)} />
    </div>
  );
}
