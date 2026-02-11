/* eslint-disable react-perf/jsx-no-new-function-as-prop */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import './index.css';
import type { GraphLink, RenderElement, TransformOptions } from '@joint/react';
import { GraphProvider, Highlighter, Paper, useNodeSize } from '@joint/react';
import { PAPER_CLASSNAME, PRIMARY, SECONDARY } from 'storybook-config/theme';
import { dia, linkTools } from '@joint/core';
import { forwardRef, useRef, useState, type FC } from 'react';

const unit = 4;

type NodeElement = {
  label: string;
  type: 'start' | 'step' | 'decision';
  cx: number;
  cy: number;
};

const flowchartNodes: Record<string, NodeElement> = {
  start: { label: 'Start', type: 'start', cx: 50, cy: 40 },
  addToCart: {
    label: 'Add to Cart',
    type: 'step',
    cx: 200,
    cy: 40,
  },
  checkoutItems: {
    label: 'Checkout Items',
    type: 'step',
    cx: 350,
    cy: 40,
  },
  addShippingInfo: {
    label: 'Add Shipping Info',
    type: 'step',
    cx: 500,
    cy: 40,
  },
  addPaymentInfo: {
    label: 'Add Payment Info',
    type: 'step',
    cx: 500,
    cy: 140,
  },
  validPayment: {
    label: 'Valid Payment?',
    type: 'decision',
    cx: 500,
    cy: 250,
  },
  presentErrorMessage: {
    label: 'Present Error Message',
    type: 'step',
    cx: 750,
    cy: 350,
  },
  sendOrder: {
    label: 'Send Order to Warehouse',
    type: 'step',
    cx: 200,
    cy: 250,
  },
  packOrder: {
    label: 'Pack Order',
    type: 'step',
    cx: 40,
    cy: 350,
  },
  qualityCheck: {
    label: 'Quality Check?',
    type: 'decision',
    cx: 200,
    cy: 460,
  },
  shipItems: {
    label: 'Ship Items to Customer',
    type: 'step',
    cx: 500,
    cy: 460,
  },
};
interface FlowchartLinkOptions extends GraphLink {
  readonly label?: string;
}

const LINK_OPTIONS: Partial<FlowchartLinkOptions> = {
  z: 2,
  color: PRIMARY,
  width: 2,
  className: 'link',
  targetMarker: {
    d: 'M 0 0 L 8 4 L 8 -4 Z', // Larger arrowhead
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

type FlowchartLink = FlowchartLinkOptions;

const flowchartLinks: Record<string, FlowchartLink> = {
  flow1: { ...LINK_OPTIONS, source: 'start', target: 'addToCart' },
  flow2: { ...LINK_OPTIONS, source: 'addToCart', target: 'checkoutItems' },
  flow3: { ...LINK_OPTIONS, source: 'checkoutItems', target: 'addShippingInfo' },
  flow4: { ...LINK_OPTIONS, source: 'addShippingInfo', target: 'addPaymentInfo' },
  flow5: { ...LINK_OPTIONS, source: 'addPaymentInfo', target: 'validPayment' },
  flow6: {
    ...LINK_OPTIONS,
    source: 'validPayment',
    target: 'presentErrorMessage',
    label: 'No',
  },
  flow7: {
    ...LINK_OPTIONS,
    source: 'presentErrorMessage',
    target: 'addPaymentInfo',
  },
  flow8: {
    ...LINK_OPTIONS,
    source: 'validPayment',
    target: 'sendOrder',
    label: 'Yes',
  },
  flow9: { ...LINK_OPTIONS, source: 'sendOrder', target: 'packOrder' },
  flow10: { ...LINK_OPTIONS, source: 'packOrder', target: 'qualityCheck' },
  flow11: {
    ...LINK_OPTIONS,
    source: 'qualityCheck',
    target: 'shipItems',
    label: 'Ok',
  },
  flow12: {
    ...LINK_OPTIONS,
    source: 'qualityCheck',
    target: 'sendOrder',
    label: 'Not Ok',
  },
};

interface PropsWithClick {
  readonly onMouseEnter?: () => void;
  readonly onMouseLeave?: () => void;
  readonly isToolActive?: boolean;
}
type FlowchartNodeProps = (typeof flowchartNodes)[string] & PropsWithClick;

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
  const { type } = props;

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
      className={PAPER_CLASSNAME}
      renderElement={RenderFlowchartNode as unknown as RenderElement}
      interactive={{ linkMove: false }}
      defaultConnectionPoint={{
        name: 'anchor',
        args: {
          offset: unit * 2,
          extrapolate: true,
          useModelGeometry: true,
        },
      }}
      defaultAnchor={{
        name: 'midSide',
        args: {
          useModelGeometry: true,
        },
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
    <GraphProvider elements={flowchartNodes} links={flowchartLinks}>
      <Main />
    </GraphProvider>
  );
}
