/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { dia, linkTools } from '@joint/core';
import '../index.css';
import {
  GraphProvider,
  jsx,
  Paper,
  usePaperEvents,
  type Cells,
} from '@joint/react';
import { useId } from 'react';
import { PRIMARY, SECONDARY, PAPER_CLASSNAME } from 'storybook-config/theme';
import { linkRoutingOrthogonal } from '@joint/react/presets';

const WHITE = '#fff';
const ORTHOGONAL_LINKS = linkRoutingOrthogonal();

interface NodeData {
  readonly [key: string]: unknown;
  readonly label: string;
}

const initialCells: Cells<NodeData> = [
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

// 1) creating link tools
const verticesTool = new linkTools.Vertices({
  handleClass: linkTools.Vertices.VertexHandle.extend({
    style: {
      fill: WHITE,
      stroke: SECONDARY,
      strokeWidth: 2,
    },
  }),
});

const boundaryTool = new linkTools.Boundary({
  style: { stroke: '#999' },
});
// 2) create custom link tool

const infoButton = new linkTools.Button({
  // using jsx utility by joint-jsx, convert jsx to markup
  markup: jsx(
    <>
      <circle r="8" fill={WHITE} stroke={PRIMARY} strokeWidth="2" cursor="pointer" />
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

const targetArrowhead = new linkTools.TargetArrowhead({
  attributes: {
    fill: 'transparent',
    d: 'M -10 -10 V 10 H 10 V -10 Z',
    cursor: 'grab',
  }
});

// 3) creating a tools view
const toolsView = new dia.ToolsView({
  tools: [boundaryTool, verticesTool, infoButton, targetArrowhead],
});

function Main() {
  const paperId = useId();

  usePaperEvents(paperId, {
    'link:mouseenter': (linkView) => linkView.addTools(toolsView),
    'link:mouseleave': (linkView) => linkView.removeTools(),
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'row', position: 'relative' }}>
      <Paper
        id={paperId}
        className={PAPER_CLASSNAME}
        height={280}
        {...ORTHOGONAL_LINKS}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
        }}
      ></div>
    </div>
  );
}

export default function App() {
  return (
    <GraphProvider initialCells={initialCells}>
      <Main />
    </GraphProvider>
  );
}
