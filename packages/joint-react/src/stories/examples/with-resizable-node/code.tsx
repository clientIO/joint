/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import {
  createElements,
  createLinks,
  GraphProvider,
  HTMLNode,
  Paper,
  useElements,
  type InferElement,
} from '@joint/react';
import '../index.css';
import { useCallback, useRef } from 'react';

const initialElements = createElements([
  { id: '1', data: { label: 'Node 1' }, x: 100, y: 0 },
  { id: '2', data: { label: 'Node 2' }, x: 100, y: 200 },
]);

const initialEdges = createLinks([{ id: 'e1-2', source: '1', target: '2' }]);

type BaseElementWithData = InferElement<typeof initialElements>;

function ResizableNode({ data }: Readonly<BaseElementWithData>) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    const node = nodeRef.current;
    if (!node) return;

    // Get the node’s bounding rectangle
    const rect = node.getBoundingClientRect();
    const threshold = 20; // pixels from the bottom-right corner considered as resize area

    // Calculate how far from the left/top the click was
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;

    // If the click is within the bottom-right "resize" zone,
    // stop propagation so that JointJS doesn't start dragging the node.
    if (rect.width - offsetX < threshold && rect.height - offsetY < threshold) {
      event.stopPropagation();
    }
  }, []);

  return (
    <HTMLNode
      ref={nodeRef}
      className="resizable-node"
      onMouseDown={handleMouseDown} // prevent drag events from propagating
    >
      {data.label}
    </HTMLNode>
  );
}

function Main() {
  const elementsSize = useElements((items) =>
    items.map(({ width, height }) => `${width},${height}`)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'row', position: 'relative' }}>
      <Paper width={400} height={280} renderElement={ResizableNode} />
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
        }}
      >
        NodeID,Width, Height:
        {elementsSize.map((position, index) => (
          // eslint-disable-next-line @eslint-react/no-array-index-key
          <div key={`${index}-${position}`} style={{ marginLeft: 10 }}>
            {index}, {position}
          </div>
        ))}
      </div>
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
