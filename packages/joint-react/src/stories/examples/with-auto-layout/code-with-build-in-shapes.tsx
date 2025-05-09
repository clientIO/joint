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
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
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
} as const;

const initialElements = createElements([
  {
    id: '1',
    label: 'Node 1',
    ...shape,
  },
  {
    id: '2',
    label: 'Node 2',
    ...shape,
  },
  {
    id: '3',
    label: 'Node 1',
    ...shape,
  },
  {
    id: '4',
    label: 'Node 2',
    ...shape,
  },
  {
    id: '5',
    label: 'Node 1',
    ...shape,
  },
  {
    id: '6',
    label: 'Node 2',
    ...shape,
  },
  {
    id: '7',
    label: 'Node 1',
    ...shape,
  },
  {
    id: '8',
    label: 'Node 2',
    ...shape,
  },
  {
    id: '9',
    label: 'Node 2',
    ...shape,
  },
]);

type BaseElementWithData = InferElement<typeof initialElements>;

function RenderedRect({ width, height, label }: BaseElementWithData) {
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

  // eslint-disable-next-line unicorn/consistent-function-scoping
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
      width="100%"
      className={PAPER_CLASSNAME}
      height={280}
      renderElement={renderElement}
      onElementsSizeReady={makeLayout}
    />
  );
}

export default function App() {
  return (
    <GraphProvider initialElements={initialElements}>
      <Main />
    </GraphProvider>
  );
}
