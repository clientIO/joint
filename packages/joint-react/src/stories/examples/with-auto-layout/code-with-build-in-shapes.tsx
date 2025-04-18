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
import { PRIMARY } from 'storybook-config/theme';
const shape = {
  type: 'standard.Rectangle',
  width: 100,
  height: 50,
  attrs: {
    body: {
      fill: PRIMARY,
    },
    label: {
      text: 'Rectangle1',
      fill: 'white',
    },
  },
};
const initialElements = createElements([
  {
    id: '1',
    data: { label: 'Node 1' },
    ...shape,
  },
  {
    id: '2',
    data: { label: 'Node 2' },
    ...shape,
  },
  {
    id: '3',
    data: { label: 'Node 1' },
    ...shape,
  },
  {
    id: '4',
    data: { label: 'Node 2' },
    ...shape,
  },
  {
    id: '5',
    data: { label: 'Node 1' },
    ...shape,
  },
  {
    id: '6',
    data: { label: 'Node 2' },
    ...shape,
  },
  {
    id: '7',
    data: { label: 'Node 1' },
    ...shape,
  },
  {
    id: '8',
    data: { label: 'Node 2' },
    ...shape,
  },
  {
    id: '9',
    data: { label: 'Node 2' },
    ...shape,
  },
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
