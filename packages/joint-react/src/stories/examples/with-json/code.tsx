/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import '../index.css';

import {
  createElements,
  GraphProvider,
  Paper,
  useGraph,
  useNodeSize,
  type InferElement,
  type RenderElement,
} from '@joint/react';
import { useEffect, useRef } from 'react';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const initialElements = createElements([
  { id: '1', label: 'hello', color: PRIMARY, x: 100, y: 10, width: 100, height: 50 },
]);

type BaseElementWithData = InferElement<typeof initialElements>;

function RenderElement(props: Readonly<BaseElementWithData>) {
  const { width, height, label, color } = props;
  const elementRef = useRef<HTMLDivElement>(null);
  useNodeSize(elementRef);
  return (
    <foreignObject width={width} height={height}>
      <div
        ref={elementRef}
        className="flex flex-col items-center rounded-sm"
        style={{ background: color }}
      >
        Example
        <div>{label}</div>
      </div>
    </foreignObject>
  );
}
function Main() {
  const graph = useGraph();
  useEffect(() => {
    graph.fromJSON({
      cells: [
        {
          id: 1,
          type: 'standard.Rectangle',
          position: {
            x: 100,
            y: 100,
          },
          size: {
            width: 100,
            height: 100,
          },
        },
      ],
    });
  }, [graph]);
  return (
    <Paper width="100%" className={PAPER_CLASSNAME} height={280} renderElement={RenderElement} />
  );
}

export default function App() {
  return (
    <GraphProvider>
      <Main />
    </GraphProvider>
  );
}
