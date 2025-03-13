/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import {
  createElements,
  GraphProvider,
  HTMLNode,
  Paper,
  useElements,
  type InferElement,
} from '@joint/react';
import '../index.css';
import { useRef } from 'react';

const initialElements = createElements([
  { id: '1', data: { label: 'Node 1' }, x: 100, y: 0 },
  { id: '2', data: { label: 'Node 2' }, x: 100, y: 200 },
  { id: '3', data: { label: 'Node 3' }, x: 200, y: 100 },
  { id: '4', data: { label: 'Node 4' }, x: 0, y: 100 },
]);

type BaseElementWithData = InferElement<typeof initialElements>;

function areTwoElementIntersected(element1: BaseElementWithData, element2: BaseElementWithData) {
  const x1 = element1.x;
  const y1 = element1.y;
  const x2 = element2.x;
  const y2 = element2.y;
  const width1 = element1.width ?? 0;
  const height1 = element1.height ?? 0;
  const width2 = element2.width ?? 0;
  const height2 = element2.height ?? 0;

  return x1 < x2 + width2 && x1 + width1 > x2 && y1 < y2 + height2 && y1 + height1 > y2;
}
function ResizableNode({ id, data: { label } }: Readonly<BaseElementWithData>) {
  const nodeRef = useRef<HTMLDivElement>(null);

  const isIntersected = useElements<BaseElementWithData, boolean>((elements) => {
    const element = elements.get(id);
    if (!element) {
      return false;
    }
    for (const [, value] of elements) {
      if (value.id !== id && areTwoElementIntersected(element, value)) {
        return true;
      }
    }
    return false;
  });

  return (
    <HTMLNode ref={nodeRef} className={`node ${isIntersected ? 'intersected' : ''}`}>
      {label}
    </HTMLNode>
  );
}

function Main() {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', position: 'relative' }}>
      <Paper width={400} height={280} renderElement={ResizableNode} />
    </div>
  );
}

export default function App() {
  return (
    <GraphProvider defaultElements={initialElements}>
      <Main />
    </GraphProvider>
  );
}
