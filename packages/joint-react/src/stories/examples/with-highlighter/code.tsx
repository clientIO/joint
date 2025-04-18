/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import {
  createElements,
  createLinks,
  GraphProvider,
  Highlighter,
  Paper,
  type InferElement,
} from '@joint/react';
import '../index.css';
import { useState } from 'react';
import { PRIMARY, SECONDARY } from 'storybook-config/theme';

const initialElements = createElements([
  {
    id: '1',
    data: { label: 'Node 1' },
    x: 100,
    y: 50,
    width: 250,
    height: 50,
  },
  { id: '2', data: { label: 'Node 1' }, x: 100, y: 200, width: 250, height: 50 },
]);

const initialEdges = createLinks([
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    attrs: {
      line: {
        stroke: PRIMARY,
      },
    },
  },
]);

type BaseElementWithData = InferElement<typeof initialElements>;

function RenderItemWithChildren({ height, width }: BaseElementWithData) {
  const [isHighlighted, setIsHighlighted] = useState(false);
  return (
    <g
      width={width}
      height={height}
      onMouseEnter={() => setIsHighlighted(true)}
      onMouseLeave={() => setIsHighlighted(false)}
      className="node"
    >
      <Highlighter.Mask isHidden={!isHighlighted} padding={5} strokeWidth={2} stroke={SECONDARY}>
        <rect
          rx={10}
          ry={10}
          width={width / 2}
          height={height / 2}
          x={width / 4}
          y={height / 4}
          fill={PRIMARY}
        />
      </Highlighter.Mask>
    </g>
  );
}
function Main() {
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper
        // clickThreshold={10}
        // interactive={{ linkMove: false }}
        // defaultConnectionPoint={{
        //   name: 'anchor',
        // }}
        // defaultAnchor={{
        //   name: 'midSide',
        //   args: { useModelGeometry: true },
        // }}
        // defaultConnector={{
        //   name: 'straight',
        //   args: { cornerType: 'line', cornerPreserveAspectRatio: true },
        // }}
        width={400}
        height={280}
        renderElement={RenderItemWithChildren}
      />
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
