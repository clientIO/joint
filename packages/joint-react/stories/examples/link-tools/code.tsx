import { dia, linkTools } from '@joint/core';
import {
  type CellRecord,
  GraphProvider,
  HTMLBox,
  jsx,
  linkRoutingOrthogonal,
  Paper,
} from '@joint/react';

const PRIMARY = '#ED2637';
const SECONDARY = '#FF9505';
const HANDLE_FILL = '#1c2836';
const BOUNDARY_STROKE = '#8697A6';

const ORTHOGONAL_LINKS = linkRoutingOrthogonal();

interface NodeData {
  readonly label: string;
}

const initialCells: ReadonlyArray<CellRecord<NodeData>> = [
  {
    id: '1',
    type: 'element',
    data: { label: 'Node 1' },
    position: { x: 100, y: 10 },
    size: { width: 120, height: 30 },
  },
  {
    id: '2',
    type: 'element',
    data: { label: 'Node 2' },
    position: { x: 300, y: 200 },
    size: { width: 120, height: 30 },
  },
  {
    id: 'e1-2',
    type: 'link',
    source: { id: '1' },
    target: { id: '2' },
    vertices: [{ x: 340, y: 100 }],
    style: {
      targetMarker: 'arrow-sunken',
      color: PRIMARY,
      dasharray: '5 5',
    },
  },
];

// Built-in tool: draggable vertex handles with a custom look.
const verticesTool = new linkTools.Vertices({
  handleClass: linkTools.Vertices.VertexHandle.extend({
    style: {
      fill: HANDLE_FILL,
      stroke: SECONDARY,
      strokeWidth: 2,
    },
  }),
});

// Built-in tool: an outline drawn along the whole link.
const boundaryTool = new linkTools.Boundary({
  style: { stroke: BOUNDARY_STROKE },
});

// Custom tool: a button whose markup is authored in JSX via the `jsx` utility.
const infoButton = new linkTools.Button({
  markup: jsx(
    <>
      <circle r="8" fill={HANDLE_FILL} stroke={PRIMARY} strokeWidth="2" cursor="pointer" />
      <path
        d="M -5 0 L 5 0 M 0 -5 L 0 5"
        fill="none"
        stroke={SECONDARY}
        strokeWidth="2"
        pointerEvents="none"
      />
    </>
  ),
  distance: 20,
  action: () => {
    alert('Info button clicked');
  },
});

// Built-in tool: a draggable handle to reconnect the link's target end.
const targetArrowhead = new linkTools.TargetArrowhead({
  attributes: {
    fill: 'transparent',
    d: 'M -10 -10 V 10 H 10 V -10 Z',
    cursor: 'grab',
  },
});

const toolsView = new dia.ToolsView({
  tools: [boundaryTool, verticesTool, infoButton, targetArrowhead],
});

function renderElement(data: NodeData) {
  return <HTMLBox className="jj-node">{data.label}</HTMLBox>;
}

function showTools({ view }: { view: dia.LinkView }) {
  view.addTools(toolsView);
}

function hideTools({ view }: { view: dia.LinkView }) {
  view.removeTools();
}

export default function App() {
  return (
    <GraphProvider initialCells={initialCells}>
      <Paper
        className="size-full"
        renderElement={renderElement}
        linkRouting={ORTHOGONAL_LINKS}
        onLinkMouseEnter={showTools}
        onLinkMouseLeave={hideTools}
      />
    </GraphProvider>
  );
}
