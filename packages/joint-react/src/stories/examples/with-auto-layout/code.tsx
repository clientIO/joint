import '../index.css';
import {
  createElements,
  GraphProvider,
  MeasuredNode,
  Paper,
  type InferElement,
  type OnLoadOptions,
  type RenderElement,
} from '@joint/react';
import { useCallback } from 'react';

const initialElements = createElements([
  { id: '1', data: { label: 'Node 1' } },
  { id: '2', data: { label: 'Node 2' } },
  { id: '3', data: { label: 'Node 1' } },
  { id: '4', data: { label: 'Node 2' } },
  { id: '5', data: { label: 'Node 1' } },
  { id: '6', data: { label: 'Node 2' } },
  { id: '7', data: { label: 'Node 1' } },
  { id: '8', data: { label: 'Node 2' } },
  { id: '9', data: { label: 'Node 2' } },
]);

type BaseElementWithData = InferElement<typeof initialElements>;

function RenderedRect({ width, height, data: { label } }: BaseElementWithData) {
  return (
    <foreignObject width={width} height={height}>
      <MeasuredNode>
        <div className="node">{label}</div>
      </MeasuredNode>
    </foreignObject>
  );
}

const PAPER_WIDTH = 400;
function Main() {
  const renderElement: RenderElement<BaseElementWithData> = useCallback(
    (props) => <RenderedRect {...props} />,
    []
  );

  function makeLayout({ graph }: OnLoadOptions) {
    const gap = 20;
    let currentX = 0;
    let currentY = 0;
    const elements = graph.getElements();
    for (const element of elements) {
      const { width, height } = element.size();
      if (currentX + width > PAPER_WIDTH) {
        currentX = 0;
        currentY += height + gap;
      }
      element.position(currentX, currentY);
      currentX += width + gap;
    }
  }
  return (
    <Paper
      width={PAPER_WIDTH}
      height={280}
      renderElement={renderElement}
      onElementsMeasured={makeLayout}
    />
  );
}

export default function App() {
  return (
    <GraphProvider defaultElements={initialElements}>
      <Main />
    </GraphProvider>
  );
}
