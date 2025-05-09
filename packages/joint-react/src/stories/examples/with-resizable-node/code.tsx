/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import {
  createElements,
  createLinks,
  GraphProvider,
  MeasuredNode,
  Paper,
  useElements,
  type InferElement,
} from '@joint/react';
import '../index.css';
import { useCallback, useRef } from 'react';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';

const initialElements = createElements([
  { id: '1', label: 'Node 1', x: 100, y: 0 },
  { id: '2', label: 'Node 2', x: 100, y: 200 },
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

function ResizableNode({ width, height, label }: Readonly<BaseElementWithData>) {
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
    <foreignObject width={width} height={height} overflow="visible">
      <MeasuredNode ref={nodeRef}>
        <div
          className="resizable-node"
          onMouseDown={handleMouseDown} // prevent drag events from propagating
        >
          {label}
        </div>
      </MeasuredNode>
    </foreignObject>
  );
}

function Main() {
  const elementsSize = useElements((items) =>
    items.map(({ width, height }) => `${width} x ${height}`)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'row', position: 'relative' }}>
      <Paper width="100%" className={PAPER_CLASSNAME} height={280} renderElement={ResizableNode} />
      <div>
        <u>width & height</u>
        {elementsSize.map((size, index) => (
          // eslint-disable-next-line @eslint-react/no-array-index-key
          <div className="text" key={`${index}-${size}`} style={{ marginLeft: 10 }}>
            {index + 1}. {size}
          </div>
        ))}
      </div>
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
