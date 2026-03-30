/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { dia, linkTools } from '@joint/core';
import '../index.css';
import {
  GraphProvider,
  jsx,
  Paper,
  usePaperEvents,
  type ElementRecord,
  type LinkRecord,
} from '@joint/react';
import { useId } from 'react';
import { PRIMARY, SECONDARY, PAPER_CLASSNAME } from 'storybook-config/theme';

const WHITE = '#fff';

const initialEdges: Record<string, LinkRecord> = {
  'e1-2': {
    source: { id: '1' },
    target: { id: '2' },
    style: {
      color: PRIMARY,
      dasharray: '5 5',
    }
  },
};

interface NodeData {
  readonly [key: string]: unknown;
  readonly label: string;
}

const initialElements: Record<string, ElementRecord<NodeData>> = {
  '1': { data: { label: 'Node 1' }, position: { x: 100, y: 10 }, size: { width: 120, height: 30 } },
  '2': {
    data: { label: 'Node 2' },
    position: { x: 100, y: 200 },
    size: { width: 120, height: 30 },
  },
};

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

// 3) creating a tools view
const toolsView = new dia.ToolsView({
  tools: [boundaryTool, verticesTool, infoButton],
});

function Main() {
  const paperId = useId();

  usePaperEvents(paperId, {
    'link:mouseenter': (linkView) => linkView.addTools(toolsView),
    'link:mouseleave': (linkView) => linkView.removeTools(),
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'row', position: 'relative' }}>
      <Paper id={paperId} className={PAPER_CLASSNAME} height={280} />
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
    <GraphProvider elements={initialElements} links={initialEdges}>
      <Main />
    </GraphProvider>
  );
}
