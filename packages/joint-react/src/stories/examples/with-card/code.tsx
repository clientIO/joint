import '../index.css';
import { useCallback, useRef } from 'react';
import {
  createElements,
  createLinks,
  GraphProvider,
  Paper,
  useNodeSize,
  type InferElement,
  type RenderElement,
} from '@joint/react';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';

const initialElements = createElements([
  { id: '1', label: 'Node 1', x: 100, y: 0 },
  { id: '2', label: 'Node 2 with longer text', x: 250, y: 150 },
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

function Card() {
  const frameRef = useRef<SVGRectElement>(null);
  const { width, height } = useNodeSize(frameRef);
  const gap = 10;
  // avoid negative width and height
  const imageWidth = Math.max(width - gap * 2, 0);
  const imageHeight = Math.max(height - gap * 2, 0);
  const iconURL = `https://placehold.co/${imageWidth}x${imageHeight}`;
  const frameWidth = 80;
  const frameHeight = 120;

  return (
    <>
      <rect
        ref={frameRef}
        width={frameWidth}
        height={frameHeight}
        fill="#333"
        stroke="#eee"
        strokeWidth="2"
      />
      <image href={iconURL} x={gap} y={gap} width={imageWidth} height={imageHeight} />
    </>
  );
}
function Main() {
  const renderElement: RenderElement<BaseElementWithData> = useCallback(() => {
    return <Card />;
  }, []);
  return (
    <Paper width="100%" className={PAPER_CLASSNAME} height={280} renderElement={renderElement} />
  );
}

export default function App() {
  return (
    <GraphProvider elements={initialElements} links={initialEdges}>
      <Main />
    </GraphProvider>
  );
}
