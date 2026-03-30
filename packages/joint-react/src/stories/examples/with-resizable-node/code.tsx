/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import {
  GraphProvider,
  Paper,
  useMeasureNode,
  type ElementRecord,
  type LinkRecord,
} from '@joint/react';
import '../index.css';
import { useCallback, useRef } from 'react';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';

interface NodeData {
  readonly [key: string]: unknown;
  readonly label: string;
}

const initialElements: Record<string, ElementRecord<NodeData>> = {
  '1': { data: { label: 'Node 1' }, position: { x: 100, y: 15 } },
  '2': { data: { label: 'Node 2' }, position: { x: 100, y: 200 } },
};

const initialEdges: Record<string, LinkRecord> = {
  'e1-2': {
    source: { id: '1' },
    target: { id: '2' },
    style: { color: PRIMARY },
  },
};

function ResizableNode({ label }: Readonly<NodeData>) {
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

  const { width, height } = useMeasureNode(nodeRef);
  return (
    <foreignObject width={width} height={height} overflow="visible">
      <div
        ref={nodeRef}
        className="resizable-node"
        onMouseDown={handleMouseDown} // prevent drag events from propagating
        style={{
          backgroundColor: '#fff',
          borderRadius: 8,
          border: '1px solid #ed2637',
          minWidth: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 10,
          fontFamily: 'Ppfraktionsans, sans-serif',
          cursor: 'move',
          color: '#131e29',
          resize: 'both',
          overflow: 'auto',
        }}
      >
        {label}
      </div>
    </foreignObject>
  );
}

function Main() {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', position: 'relative' }}>
      <Paper className={PAPER_CLASSNAME} height={280} renderElement={ResizableNode} />
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
