/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { GraphProvider, Paper, useElements, useNodeSize } from '@joint/react';
import '../index.css';
import { useCallback, useRef } from 'react';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';

const initialElements: Record<string, { label: string; x: number; y: number }> = {
  '1': { label: 'Node 1', x: 100, y: 0 },
  '2': { label: 'Node 2', x: 100, y: 200 },
};

const initialEdges: Record<string, { source: string; target: string; color: string }> = {
  'e1-2': {
    source: '1',
    target: '2',
    color: PRIMARY,
  },
};

type BaseElementWithData = (typeof initialElements)[string];

function ResizableNode({ label }: Readonly<BaseElementWithData>) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    const node = nodeRef.current;
    if (!node) return;

    // Get the node's bounding rectangle
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

  const { width, height } = useNodeSize(nodeRef);
  return (
    <foreignObject width={width} height={height} overflow="visible">
      <div
        ref={nodeRef}
        className="resizable-node"
        onMouseDown={handleMouseDown} // prevent drag events from propagating
      >
        {label}
      </div>
    </foreignObject>
  );
}

function Main() {
  const elementsSize = useElements((items) =>
    Object.values(items).map(({ width, height }) => `${width} x ${height}`)
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
    <GraphProvider elements={initialElements} links={initialEdges}>
      <Main />
    </GraphProvider>
  );
}
