// Flowchart.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import type { InferElement } from '../../utils/create';
import { createElements, createLinks } from '../../utils/create';
import './flowchart.css';
import { GraphProvider } from '../../components/graph-provider/graph-provider';
import { Paper } from '../../components/paper/paper';
import { MeasuredNode } from 'src/components/measured-node/measured-node';
import { useCallback } from 'react';
import type { OnSetSize } from 'src/hooks/use-measure-node-size';
import { PRIMARY } from '.storybook/theme';

export type Story = StoryObj<typeof GraphProvider>;
const meta: Meta<typeof GraphProvider> = {
  title: 'Demos/Flowchart',
  component: GraphProvider,
};
export default meta;

const unit = 10;

// Define flowchart nodes with position, dimensions, and type
const flowchartNodes = createElements([
  { id: 'start', data: { label: 'Start', type: 'start' }, x: 50, y: 40 },
  {
    id: 'addToCart',
    data: { label: 'Add to Cart', type: 'step' },
    x: 200,
    y: 40,
  },
  {
    id: 'checkoutItems',
    data: { label: 'Checkout Items', type: 'step' },
    x: 350,
    y: 40,
  },
  {
    id: 'addShippingInfo',
    data: { label: 'Add Shipping Info', type: 'step' },
    x: 500,
    y: 40,
  },
  {
    id: 'addPaymentInfo',
    data: { label: 'Add Payment Info', type: 'step' },
    x: 500,
    y: 140,
  },
  {
    id: 'validPayment',
    data: { label: 'Valid Payment?', type: 'decision' },
    x: 500,
    y: 250,
  },
  {
    id: 'presentErrorMessage',
    data: { label: 'Present Error Message', type: 'step' },
    x: 750,
    y: 250,
  },
  {
    id: 'sendOrder',
    data: { label: 'Send Order to Warehouse', type: 'step' },
    x: 200,
    y: 250,
  },
  {
    id: 'packOrder',
    data: { label: 'Pack Order', type: 'step' },
    x: 50,
    y: 350,
  },
  {
    id: 'qualityCheck',
    data: { label: 'Quality Check?', type: 'decision' },
    x: 200,
    y: 460,
  },
  {
    id: 'shipItems',
    data: { label: 'Ship Items to Customer', type: 'step' },
    x: 500,
    y: 460,
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
    router: { name: 'manhattan' }, // Use right-angle routing
  },
  {
    ...LINK_OPTIONS,
    id: 'flow7',
    source: 'presentErrorMessage',
    target: 'addPaymentInfo',
    router: { name: 'manhattan' },
  },
  {
    ...LINK_OPTIONS,
    id: 'flow8',
    source: 'validPayment',
    target: 'sendOrder',
    label: 'Yes',
    router: { name: 'manhattan' },
  },
  { ...LINK_OPTIONS, id: 'flow9', source: 'sendOrder', target: 'packOrder' },
  { ...LINK_OPTIONS, id: 'flow10', source: 'packOrder', target: 'qualityCheck' },
  {
    ...LINK_OPTIONS,
    id: 'flow11',
    source: 'qualityCheck',
    target: 'shipItems',
    label: 'Ok',
    router: { name: 'manhattan' },
  },
  {
    ...LINK_OPTIONS,
    id: 'flow12',
    source: 'qualityCheck',
    target: 'sendOrder',
    label: 'Not Ok',
    router: { name: 'manhattan' },
  },
]);

type FlowchartNode = InferElement<typeof flowchartNodes>;

// Custom render function that maps the node type to a CSS class for styling
function RenderFlowchartNode({ data: { label, type }, width, height, x, y }: FlowchartNode) {
  let className = 'flowchart-node';
  switch (type) {
    case 'start': {
      className += ' flowchart-start';
      break;
    }
    case 'step': {
      className += ' flowchart-step';
      break;
    }
    case 'decision': {
      className += ' flowchart-decision';
      break;
    }
    // No default
  }

  const setSize: OnSetSize = useCallback(
    ({ element, size }) => {
      element.set({
        size,
        position: { x: size.width / 2 + x, y: size.height / 2 + y },
      });
    },
    [x, y]
  );

  const NORMAL_SIZE = { width: 120, height: 50 };
  const START_SIZE = { width: 50, height: 50 };
  const sizeStyle = type === 'start' ? START_SIZE : NORMAL_SIZE;
  return (
    // eslint-disable-next-line react-perf/jsx-no-new-object-as-prop
    <foreignObject style={{ overflow: 'visible' }} width={width} height={height}>
      <MeasuredNode setSize={setSize}>
        <div style={sizeStyle} className={className}>
          {label}
        </div>
      </MeasuredNode>
    </foreignObject>
  );
}

function FlowchartMain() {
  return (
    <Paper
      gridSize={1}
      isTransformToFitContentEnabled
      height={600}
      width={900}
      renderElement={RenderFlowchartNode}
    />
  );
}

export const Flowchart: Story = {
  args: {
    defaultElements: flowchartNodes,
    defaultLinks: flowchartLinks,
  },
  render: (props) => (
    <GraphProvider {...props}>
      <FlowchartMain />
    </GraphProvider>
  ),
};
