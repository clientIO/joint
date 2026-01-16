/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable no-shadow */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import './index.css';
import type { GraphLink, TransformOptions } from '@joint/react';
import {
  createElements,
  createLinks,
  GraphProvider,
  Highlighter,
  Paper,
  type InferElement,
  useNodeSize,
} from '@joint/react';
import { PAPER_CLASSNAME, PRIMARY, SECONDARY } from 'storybook-config/theme';
import { dia, linkTools } from '@joint/core';
import { forwardRef, useRef, useState, type FC } from 'react';

const unit = 4;

type NodeElement = {
  id: string;
  label: string;
  nodeType: 'start' | 'step' | 'decision';
  cx: number;
  cy: number;
};

const flowchartNodes = createElements<NodeElement>([
  { id: 'start', label: 'Start', nodeType: 'start', cx: 50, cy: 40 },
  {
    id: 'addToCart',
    label: 'Add to Cart',
    nodeType: 'step',
    cx: 200,
    cy: 40,
  },
  {
    id: 'checkoutItems',
    label: 'Checkout Items',
    nodeType: 'step',
    cx: 350,
    cy: 40,
  },
  {
    id: 'addShippingInfo',
    label: 'Add Shipping Info',
    nodeType: 'step',
    cx: 500,
    cy: 40,
  },
  {
    id: 'addPaymentInfo',
    label: 'Add Payment Info',
    nodeType: 'step',
    cx: 500,
    cy: 140,
  },
  {
    id: 'validPayment',
    label: 'Valid Payment?',
    nodeType: 'decision',
    cx: 500,
    cy: 250,
  },
  {
    id: 'presentErrorMessage',
    label: 'Present Error Message',
    nodeType: 'step',
    cx: 750,
    cy: 350,
  },
  {
    id: 'sendOrder',
    label: 'Send Order to Warehouse',
    nodeType: 'step',
    cx: 200,
    cy: 250,
  },
  {
    id: 'packOrder',
    label: 'Pack Order',
    nodeType: 'step',
    cx: 40,
    cy: 350,
  },
  {
    id: 'qualityCheck',
    label: 'Quality Check?',
    nodeType: 'decision',
    cx: 200,
    cy: 460,
  },
  {
    id: 'shipItems',
    label: 'Ship Items to Customer',
    nodeType: 'step',
    cx: 500,
    cy: 460,
  },
]);
const LINK_OPTIONS: Partial<GraphLink> = {
  z: 2,
  attrs: {
    line: {
      class: 'link',
      stroke: PRIMARY,
      strokeWidth: 2,
      targetMarker: {
        d: `M 0 0 L 8 4 L 8 -4 Z`, // Larger arrowhead
      },
    },
  },

  defaultLabel: {
    attrs: {
      line: {
        class: 'jj-flow-line',
        targetMarker: {
          class: 'jj-flow-arrowhead',
          d: `M 0 0 L ${2 * unit} ${unit} L ${2 * unit} -${unit} Z`,
        },
      },
      // The `outline` path is added to the `standard.Link` below in `markup``
      // We want to keep the `wrapper` path to do its original job,
      // which is the hit testing
      outline: {
        class: 'jj-flow-outline',
        connection: true,
      },
    },
    markup: [
      {
        tagName: 'path',
        selector: 'labelBody',
      },
      {
        tagName: 'text',
        selector: 'labelText',
      },
    ],
  },
};
const flowchartLinks = createLinks([
  { ...LINK_OPTIONS, id: 'flow1', source: 'start', target: 'addToCart' },
  { ...LINK_OPTIONS, id: 'flow2', source: 'addToCart', target: 'checkoutItems' },
  { ...LINK_OPTIONS, id: 'flow3', source: 'checkoutItems', target: 'addShippingInfo' },
  { ...LINK_OPTIONS, id: 'flow4', source: 'addShippingInfo', target: 'addPaymentInfo' },
  { ...LINK_OPTIONS, id: 'flow5', source: 'addPaymentInfo', target: 'validPayment' },
  {
    ...LINK_OPTIONS,
    id: 'flow6',
    source: 'validPayment',
    target: 'presentErrorMessage',
    label: 'No',
  },
  {
    ...LINK_OPTIONS,
    id: 'flow7',
    source: 'presentErrorMessage',
    target: 'addPaymentInfo',
  },
  {
    ...LINK_OPTIONS,
    id: 'flow8',
    source: 'validPayment',
    target: 'sendOrder',
    label: 'Yes',
  },
  { ...LINK_OPTIONS, id: 'flow9', source: 'sendOrder', target: 'packOrder' },
  { ...LINK_OPTIONS, id: 'flow10', source: 'packOrder', target: 'qualityCheck' },
  {
    ...LINK_OPTIONS,
    id: 'flow11',
    source: 'qualityCheck',
    target: 'shipItems',
    label: 'Ok',
  },
  {
    ...LINK_OPTIONS,
    id: 'flow12',
    source: 'qualityCheck',
    target: 'sendOrder',
    label: 'Not Ok',
  },
]);

interface PropsWithClick {
  readonly onMouseEnter?: () => void;
  readonly onMouseLeave?: () => void;
  readonly isToolActive?: boolean;
}
type FlowchartNodeProps = InferElement<typeof flowchartNodes> & PropsWithClick;

function transform(options: TransformOptions & { padding: number; cx: number; cy: number }) {
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
  const { width, height } = useNodeSize(textRef, {
    transform: (options) => transform({ ...options, padding, cx, cy }),
  });

  return (
    <>
      <polygon
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        ref={ref}
        points={`${width / 2},0 ${width},${height / 2} ${width / 2},${height} 0,${height / 2}`}
        fill="transparent"
        stroke={PRIMARY}
        strokeWidth="2"
      />

      <text
        ref={textRef}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        x={width / 2}
        y={height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="10"
        fill={'white'}
      >
        {label}
      </text>
    </>
  );
}

function StepNodeRaw(
  { label, cx, cy, onMouseEnter, onMouseLeave }: FlowchartNodeProps,
  ref: React.ForwardedRef<SVGRectElement>
) {
  const padding = 20;

  const textRef = useRef<SVGTextElement>(null);
  const { width, height } = useNodeSize(textRef, {
    transform: (options) => transform({ ...options, padding, cx, cy }),
  });

  return (
    <>
      <rect
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        ref={ref}
        width={width}
        height={height}
        fill="transparent"
        stroke="red"
        strokeWidth="2"
        strokeLinejoin="bevel"
        rx={unit}
        ry={unit}
      />
      <text
        ref={textRef}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        x={width / 2}
        y={height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="10"
        fill={'white'}
      >
        {label}
      </text>
    </>
  );
}
// We need to forward ref, so highlighter can access the element
const DecisionNode: FC<FlowchartNodeProps> = forwardRef(DecisionNodeRaw as never);
const StepNode: FC<FlowchartNodeProps> = forwardRef(StepNodeRaw as never);

// Custom render function that maps the node type to a CSS class for styling
function RenderFlowchartNode(props: FlowchartNodeProps) {
  const { nodeType } = props;

  const [isHighlighted, setIsHighlighted] = useState(false);
  const content =
    nodeType === 'decision' ? (
      <DecisionNode
        {...props}
        onMouseEnter={() => setIsHighlighted(true)}
        onMouseLeave={() => setIsHighlighted(false)}
      />
    ) : (
      <StepNode
        {...props}
        onMouseEnter={() => setIsHighlighted(true)}
        onMouseLeave={() => setIsHighlighted(false)}
      />
    );
  return (
    <Highlighter.Mask isHidden={!isHighlighted} stroke={SECONDARY} padding={2} strokeWidth={2}>
      {content}
    </Highlighter.Mask>
  );
}

// Create link tools

function Main() {
  return (
    <Paper
      onLinkMouseEnter={({ linkView, paper }) => {
        paper.removeTools();
        dia.HighlighterView.removeAll(paper);
        const snapAnchor: linkTools.AnchorCallback<dia.Point> = (
          coords: dia.Point,
          endView: dia.CellView
        ) => {
          const bbox = endView.model.getBBox();
          // Find the closest point on the bbox border.
          const point = bbox.pointNearestToPoint(coords);
          const center = bbox.center();
          // Snap the point to the center of the bbox if it's close enough.
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
              resetAnchor: true,
            }),
            new linkTools.SourceAnchor({
              snap: snapAnchor,
              resetAnchor: true,
            }),
          ],
        });
        toolsView.el.classList.add('jj-flow-tools');
        linkView.addTools(toolsView);
      }}
      onLinkMouseLeave={({ linkView }) => {
        linkView.removeTools();
      }}
      gridSize={5}
      height={600}
      onElementsSizeReady={({ paper }) => {
        paper.transformToFitContent({
          padding: 40,
          useModelGeometry: true,
          verticalAlign: 'middle',
          horizontalAlign: 'middle',
        });
      }}
      width="100%"
      className={PAPER_CLASSNAME}
      renderElement={RenderFlowchartNode}
      interactive={{ linkMove: false }}
      // defaultConnectionPoint={{
      //   name: 'anchor',
      //   args: {
      //     offset: unit * 2,
      //     extrapolate: true,
      //     useModelGeometry: true,
      //   },
      // }}
      // defaultAnchor={{
      //   name: 'midSide',
      //   args: {
      //     useModelGeometry: true,
      //   },
      // }}
      // defaultRouter={{
      //   name: 'rightAngle',
      //   args: {
      //     margin: unit * 7,
      //   },
      // }}
      // defaultConnector={{
      //   name: 'straight',
      //   args: { cornerType: 'line', cornerPreserveAspectRatio: true },
      // }}
    />
  );
}

export default function App() {
  return (
    <GraphProvider elements={flowchartNodes} links={flowchartLinks}>
      <Main />
    </GraphProvider>
  );
}
