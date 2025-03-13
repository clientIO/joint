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

const initialElements = createElements([
  {
    id: '1',
    data: { label: 'Node 1' },
    x: 100,
    y: 50,
    width: 100,
    height: 50,
  },
  { id: '2', data: { label: 'Node 1' }, x: 100, y: 200, width: 100, height: 50 },
]);

const initialEdges = createLinks([{ id: 'e1-2', source: '1', target: '2' }]);

type BaseElementWithData = InferElement<typeof initialElements>;

function RenderItemWithChildren({ height, width }: BaseElementWithData) {
  const [isHighlighted, setIsHighlighted] = useState(false);
  return (
    <g
      width={width}
      height={height}
      onMouseEnter={() => setIsHighlighted(true)}
      onMouseLeave={() => setIsHighlighted(false)}
      joint-selector={'body'}
      className="node"
    >
      <Highlighter.Mask isDisabled={!isHighlighted} padding={5} strokeWidth={2} stroke={'orange'}>
        <rect width={width / 2} height={height / 2} x={width / 4} y={height / 4} fill="cyan" />
      </Highlighter.Mask>
    </g>
  );
}
function Main() {
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper width={400} height={280} renderElement={RenderItemWithChildren} />
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
