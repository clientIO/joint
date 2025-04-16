/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable no-shadow */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import './index.css';
import type { OnSetSize } from '@joint/react';
import {
  createElements,
  createLinks,
  GraphProvider,
  Highlighter,
  MeasuredNode,
  Paper,
  type InferElement,
} from '@joint/react';
import { PRIMARY, SECONDARY } from 'storybook/theme';
import { dia, linkTools } from '@joint/core';
import { forwardRef, useState, type FC } from 'react';

const unit = 4;

interface NodeData {
  label: string;
  type: 'start' | 'step' | 'decision';
}

const flowchartNodes = createElements<NodeData>([
  { id: 'start', data: { label: 'Start', type: 'start' }, cx: 50, cy: 40 },
  {
    id: 'addToCart',
    data: { label: 'Add to Cart', type: 'step' },
    cx: 200,
    cy: 40,
  },
  {
    id: 'checkoutItems',
    data: { label: 'Checkout Items', type: 'step' },
    cx: 350,
    cy: 40,
  },
  {
    id: 'addShippingInfo',
    data: { label: 'Add Shipping Info', type: 'step' },
    cx: 500,
    cy: 40,
  },
  {
    id: 'addPaymentInfo',
    data: { label: 'Add Payment Info', type: 'step' },
    cx: 500,
    cy: 140,
  },
  {
    id: 'validPayment',
    data: { label: 'Valid Payment?', type: 'decision' },
    cx: 500,
    cy: 250,
  },
  {
    id: 'presentErrorMessage',
    data: { label: 'Present Error Message', type: 'step' },
    cx: 750,
    cy: 350,
  },
  {
    id: 'sendOrder',
    data: { label: 'Send Order to Warehouse', type: 'step' },
    cx: 200,
    cy: 250,
  },
  {
    id: 'packOrder',
    data: { label: 'Pack Order', type: 'step' },
    cx: 40,
    cy: 350,
  },
  {
    id: 'qualityCheck',
    data: { label: 'Quality Check?', type: 'decision' },
    cx: 200,
    cy: 460,
  },
  {
    id: 'shipItems',
    data: { label: 'Ship Items to Customer', type: 'step' },
    cx: 500,
    cy: 460,
  },
]);
const LINK_OPTIONS = {
  z: 2,
  attrs: {
    line: {
      class: 'jj-flow-line',
      stroke: PRIMARY,
      strokeWidth: 2,
      targetMarker: {
        class: 'jj-flow-arrowhead',
        d: `M 0 0 L 8 4 L 8 -4 Z`, // Larger arrowhead
      },
    },
    outline: {
      class: 'jj-flow-outline',
      strokeWidth: 10, // Adds clickable area
      stroke: 'transparent',
      connection: true,
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
    // router: { name: 'manhattan' }, // Use right-angle routing
  },
  {
    ...LINK_OPTIONS,
    id: 'flow7',
    source: 'presentErrorMessage',
    target: 'addPaymentInfo',
    // router: { name: 'manhattan' },
  },
  {
    ...LINK_OPTIONS,
    id: 'flow8',
    source: 'validPayment',
    target: 'sendOrder',
    label: 'Yes',
    // router: { name: 'manhattan' },
  },
  { ...LINK_OPTIONS, id: 'flow9', source: 'sendOrder', target: 'packOrder' },
  { ...LINK_OPTIONS, id: 'flow10', source: 'packOrder', target: 'qualityCheck' },
  {
    ...LINK_OPTIONS,
    id: 'flow11',
    source: 'qualityCheck',
    target: 'shipItems',
    label: 'Ok',
    // router: { name: 'manhattan' },
  },
  {
    ...LINK_OPTIONS,
    id: 'flow12',
    source: 'qualityCheck',
    target: 'sendOrder',
    label: 'Not Ok',
    // router: { name: 'manhattan' },
  },
]);

interface PropsWithClick {
  readonly onMouseEnter?: () => void;
  readonly onMouseLeave?: () => void;
  readonly isToolActive?: boolean;
}
type FlowchartNodeProps = InferElement<typeof flowchartNodes> & PropsWithClick;

function DecisionNodeRaw(
  { data: { label }, width, cx, cy, onMouseEnter, onMouseLeave }: FlowchartNodeProps,
  ref: React.ForwardedRef<SVGPolygonElement>
) {
  // If we define custom size, not defined in initial nodes, we have to use measure node
  const size = width;
  const half = size / 2;
  const padding = 20;

  const setSize: OnSetSize = ({ element, size }) => {
    const dimension = Math.max(size.width, size.height) + 2 * padding;
    element.set({
      size: { width: dimension, height: dimension },
      position: { x: cx - dimension / 2, y: cy - dimension / 2 },
    });
  };

  return (
    <>
      <polygon
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        ref={ref}
        points={`${half},0 ${size},${half} ${half},${size} 0,${half}`}
        fill="transparent"
        stroke={PRIMARY}
        strokeWidth="2"
      />
      <MeasuredNode setSize={setSize}>
        <text
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          x={half}
          y={half}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="10"
          fill={'white'}
        >
          {label}
        </text>
      </MeasuredNode>
    </>
  );
}

function StepNodeRaw(
  { data: { label }, width, height, cx, cy, onMouseEnter, onMouseLeave }: FlowchartNodeProps,
  ref: React.ForwardedRef<SVGRectElement>
) {
  const padding = 20;

  const setSize: OnSetSize = ({ element, size }) => {
    const w = size.width + 2 * padding;
    const h = size.height + 2 * padding;
    element.set({
      size: { width: w, height: h },
      position: { x: cx - w / 2, y: cy - h / 2 },
    });
  };

  // discuss
  if (!width || !height) {
    return null;
  }

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
      <MeasuredNode setSize={setSize}>
        <text
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
      </MeasuredNode>
    </>
  );
}
// We need to forward ref, so highlighter can access the element
const DecisionNode: FC<FlowchartNodeProps> = forwardRef(DecisionNodeRaw as never);
const StepNode: FC<FlowchartNodeProps> = forwardRef(StepNodeRaw as never);

// Custom render function that maps the node type to a CSS class for styling
function RenderFlowchartNode(props: FlowchartNodeProps) {
  const {
    data: { type },
  } = props;

  const [isHighlighted, setIsHighlighted] = useState(false);
  const content =
    type === 'decision' ? (
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
        const snapAnchor = function (coords: dia.Point, endView: dia.LinkView): dia.Point {
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
              snap: snapAnchor as never,
              resetAnchor: linkView.model.prop(['target', 'anchor']),
            }),
            new linkTools.SourceAnchor({
              snap: snapAnchor as never,
              resetAnchor: linkView.model.prop(['source', 'anchor']),
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
      onElementsMeasured={({ paper }) => {
        paper.transformToFitContent({
          padding: 40,
          useModelGeometry: true,
          verticalAlign: 'middle',
          horizontalAlign: 'middle',
        });
      }}
      width={900}
      renderElement={RenderFlowchartNode}
      scrollWhileDragging
      sorting={dia.Paper.sorting.APPROX}
      snapLabels
      interactive={{ linkMove: false }}
      defaultConnectionPoint={{
        name: 'anchor',
        args: {
          offset: 6,
          extrapolate: true,
        },
      }}
      defaultAnchor={{
        name: 'midSide',
        args: { useModelGeometry: true },
      }}
      defaultRouter={{
        name: 'rightAngle',
        args: {
          margin: unit * 7,
        },
      }}
      defaultConnector={{
        name: 'straight',
        args: { cornerType: 'line', cornerPreserveAspectRatio: true },
      }}
    />
  );
}

export default function App() {
  return (
    <GraphProvider defaultElements={flowchartNodes} defaultLinks={flowchartLinks}>
      <Main />
    </GraphProvider>
  );
}
