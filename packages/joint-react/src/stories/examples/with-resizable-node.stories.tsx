/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import type { PropsWithChildren } from 'react';
import { useCallback, useRef } from 'react';
import type { InferElement } from '../../utils/create';
import { createElements, createLinks } from '../../utils/create';
import './index.css';
import { useElements } from '../../hooks/use-elements';
import type { Meta, StoryObj } from '@storybook/react/*';
import { GraphProvider } from '../../components/graph-provider/graph-provider';
import { HTMLNode } from '../../components/html-node/html-node';
import { Paper, type RenderElement } from '../../components/paper/paper';

export type Story = StoryObj<typeof GraphProvider>;
const meta: Meta<typeof GraphProvider> = {
  title: 'Examples/With Resizable node',
  component: GraphProvider,
};
export default meta;

const initialElements = createElements([
  { id: '1', data: { label: 'Node 1' }, x: 100, y: 0 },
  { id: '2', data: { label: 'Node 2' }, x: 100, y: 200 },
]);

const initialEdges = createLinks([{ id: 'e1-2', source: '1', target: '2' }]);

type BaseElementWithData = InferElement<typeof initialElements>;

function ResizableNode({ children }: Readonly<PropsWithChildren>) {
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
      {children}
    </HTMLNode>
  );
}

function Main() {
  const renderElement: RenderElement<BaseElementWithData> = useCallback(
    (element) => <ResizableNode>{element.data.label}</ResizableNode>,
    []
  );
  const elementsSize = useElements((items) =>
    items.map((item) => `${item.attributes.size?.width},${item.attributes.size?.height}`)
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'row', position: 'relative' }}>
      <Paper width={400} renderElement={renderElement} />
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
        }}
      >
        Sizes:
        {elementsSize.map((position, index) => (
          <div key={`${index}-${position}`} style={{ marginLeft: 10 }}>
            Node {index}: {position}
          </div>
        ))}
      </div>
    </div>
  );
}

export const Basic: Story = {
  args: {
    defaultElements: initialElements,
    defaultLinks: initialEdges,
  },
  render: (props) => {
    return (
      <GraphProvider {...props}>
        <Main />
      </GraphProvider>
    );
  },
};
