/* eslint-disable react-perf/jsx-no-new-function-as-prop */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { dia, linkTools } from '@joint/core';
import '../index.css';
import {
  createElements,
  createLinks,
  GraphProvider,
  MeasuredNode,
  Paper,
  jsx,
  type InferElement,
  type RenderElement,
} from '@joint/react';
import { useCallback } from 'react';
import { PRIMARY } from '.storybook/theme';

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
  { id: '1', data: { label: 'Node 1' }, x: 100, y: 0 },
  { id: '2', data: { label: 'Node 2' }, x: 100, y: 200 },
]);

// 1) creating link tools
const verticesTool = new linkTools.Vertices();
const segmentsTool = new linkTools.Segments();
const boundaryTool = new linkTools.Boundary();
// 2) create custom link tool

const infoButton = new linkTools.Button({
  // using jsx utility by joint-jsx, convert jsx to markup
  markup: jsx(
    <>
      <circle joint-selector="button" r={7} fill="#001DFF" cursor="pointer" />
      <path
        joint-selector="icon"
        d="M -2 4 2 4 M 0 3 0 0 M -2 -1 1 -1 M -1 -4 1 -4"
        fill="none"
        stroke="#FFFFFF"
        stroke-width={2}
        pointer-events="none"
      />
    </>
  ),
  distance: 20,
  offset: 0,
});

// 3) creating a tools view
const toolsView = new dia.ToolsView({
  name: 'basic-tools',
  tools: [infoButton, verticesTool, segmentsTool, boundaryTool],
});

type BaseElementWithData = InferElement<typeof initialElements>;

function RenderedRect() {
  return (
    <MeasuredNode>
      <rect rx={10} ry={10} joint-selector="fo" width={150} height={35} fill={PRIMARY} />
    </MeasuredNode>
  );
}

function Main() {
  const renderElement: RenderElement<BaseElementWithData> = useCallback(() => <RenderedRect />, []);
  return (
    <div style={{ display: 'flex', flexDirection: 'row', position: 'relative' }}>
      <Paper
        width={400}
        height={280}
        renderElement={renderElement}
        // add listeners when show and hide tools
        onLinkMouseenter={(linkView) => linkView.addTools(toolsView)}
        onLinkMouseleave={(linkView) => linkView.removeTools()}
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
    <GraphProvider defaultElements={initialElements} defaultLinks={initialEdges}>
      <Main />
    </GraphProvider>
  );
}
