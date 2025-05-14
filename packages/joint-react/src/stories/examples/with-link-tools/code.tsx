/* eslint-disable react-perf/jsx-no-new-function-as-prop */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { dia, linkTools } from '@joint/core';
import '../index.css';
import {
  createElements,
  createLinks,
  GraphProvider,
  Paper,
  jsx,
  type InferElement,
  type RenderElement,
} from '@joint/react';
import { useCallback } from 'react';
import { PRIMARY, BG, SECONDARY, PAPER_CLASSNAME } from 'storybook-config/theme';

const initialEdges = createLinks([
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    attrs: {
      line: {
        stroke: PRIMARY,
        strokeDasharray: '5 5',
      },
    },
  },
]);

const initialElements = createElements([
  { id: '1', label: 'Node 1', x: 100, y: 10, width: 120, height: 30 },
  { id: '2', label: 'Node 2', x: 100, y: 200, width: 120, height: 30 },
]);

// 1) creating link tools
const verticesTool = new linkTools.Vertices({
  handleClass: linkTools.Vertices.VertexHandle.extend({
    style: {
      fill: BG,
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
      <circle r="8" fill={BG} stroke={PRIMARY} strokeWidth="2" cursor="pointer" />
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

type BaseElementWithData = InferElement<typeof initialElements>;

function RectElement({ width, height }: BaseElementWithData) {
  return (
    <rect
      rx={5}
      ry={5}
      width={width}
      height={height}
      stroke={PRIMARY}
      strokeWidth="2"
      fill="transparent"
    />
  );
}

function Main() {
  const renderElement: RenderElement<BaseElementWithData> = useCallback(
    (props) => <RectElement {...props} />,
    []
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'row', position: 'relative' }}>
      <Paper
        width="100%"
        className={PAPER_CLASSNAME}
        height={280}
        renderElement={renderElement}
        // add listeners when show and hide tools
        onLinkMouseEnter={({ linkView }) => linkView.addTools(toolsView)}
        onLinkMouseLeave={({ linkView }) => linkView.removeTools()}
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
    <GraphProvider initialElements={initialElements} initialLinks={initialEdges}>
      <Main />
    </GraphProvider>
  );
}
