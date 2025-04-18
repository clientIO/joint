/* eslint-disable react-perf/jsx-no-new-function-as-prop */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import '../index.css';
import { useCallback, type PropsWithChildren } from 'react';
import {
  createElements,
  createLinks,
  GraphProvider,
  MeasuredNode,
  Paper,
  type InferElement,
  type OnSetSize,
  type RenderElement,
} from '@joint/react';
import { PRIMARY } from 'storybook-config/theme';

const initialElements = createElements([
  { id: '1', data: { label: 'Node 1' }, x: 100, y: 0 },
  { id: '2', data: { label: 'Node 2 with longer text' }, x: 250, y: 150 },
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

function Card({ children, width, height }: PropsWithChildren<BaseElementWithData>) {
  const gap = 10;
  const imageWidth = 50;
  const imageHeight = height - 2 * gap;
  const iconURL = `https://placehold.co/${imageWidth}x${imageHeight}`;
  const foWidth = width - 2 * gap - imageWidth - gap;
  const foHeight = height - 2 * gap;

  const setCardSize: OnSetSize = ({ element, size }) => {
    const w = gap + imageWidth + gap + size.width + gap;
    const h = gap + Math.max(size.height, imageWidth) + gap;
    element.size(w, h);
  };

  return (
    <>
      <rect width={width} height={height} fill="#333" stroke="#eee" strokeWidth="2"></rect>
      <image href={iconURL} x={gap} y={gap} width={imageWidth} height={imageHeight} />
      <foreignObject x={gap + imageWidth + gap} y={gap} width={foWidth} height={foHeight}>
        <MeasuredNode setSize={setCardSize}>
          <div
            style={{
              position: 'absolute',
              color: '#eee',
              maxWidth: '100px',
              overflow: 'hidden',
              overflowWrap: 'break-word',
            }}
          >
            {children}
          </div>
        </MeasuredNode>
      </foreignObject>
    </>
  );
}
function Main() {
  const renderElement: RenderElement<BaseElementWithData> = useCallback((element) => {
    return <Card {...element}>{element.data.label}</Card>;
  }, []);
  return <Paper width={400} height={280} renderElement={renderElement} />;
}

export default function App() {
  return (
    <GraphProvider defaultElements={initialElements} defaultLinks={initialEdges}>
      <Main />
    </GraphProvider>
  );
}
