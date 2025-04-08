/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import '../index.css';
import { useCallback } from 'react';
import {
  createElements,
  createLinks,
  GraphProvider,
  HTMLNode,
  Paper,
  type InferElement,
  type RenderElement,
} from '@joint/react';
import { PRIMARY } from 'storybook/theme';

const initialElements = createElements([
  { id: '1', data: { label: 'Node 1' }, x: 100, y: 0, width: 100, height: 50 },
  { id: '2', data: { label: 'Node 2' }, x: 100, y: 200, width: 100, height: 50 },
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

function MiniMap() {
  const renderElement: RenderElement<BaseElementWithData> = useCallback(
    (element) => (
      <rect width={element.width} height={element.height} className="minimap-node" radius={10} />
    ),
    []
  );
  return (
    <div className="minimap">
      <Paper
        interactive={false}
        scale={0.4}
        width={'100%'}
        height={'100%'}
        renderElement={renderElement}
      />
    </div>
  );
}
function Main() {
  const renderElement: RenderElement<BaseElementWithData> = useCallback((element) => {
    return <HTMLNode className="node">{element.data.label}</HTMLNode>;
  }, []);
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper width={400} height={280} renderElement={renderElement} />
      <MiniMap />
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
