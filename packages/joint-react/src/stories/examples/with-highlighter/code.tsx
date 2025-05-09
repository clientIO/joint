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
import { PAPER_CLASSNAME, PRIMARY, SECONDARY } from 'storybook-config/theme';

const initialElements = createElements([
  {
    id: '1',
    label: 'Node 1',
    x: 100,
    y: 50,
    width: 125,
    height: 25,
  },
  {
    id: '2',
    label: 'Node 2',
    x: 100,
    y: 200,
    width: 120,
    height: 25,
  },
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

function RenderItemWithChildren({ height, width, label }: BaseElementWithData) {
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
        <rect rx={10} ry={10} width={width} height={height} fill={PRIMARY} />
      </Highlighter.Mask>
      <text x={width / 2} y={height / 2} textAnchor="middle" dominantBaseline="middle" fill="#fff">
        {label}
      </text>
    </g>
  );
}
function Main() {
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper
        width="100%"
        className={PAPER_CLASSNAME}
        height={280}
        renderElement={RenderItemWithChildren}
      />
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
