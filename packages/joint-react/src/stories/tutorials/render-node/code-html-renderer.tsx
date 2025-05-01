/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { useRef } from 'react';
import {
  createElements,
  createLinks,
  GraphProvider,
  MeasuredNode,
  Paper,
  usePaper,
  type GraphProps,
  type InferElement,
} from '@joint/react';
import '../../examples/index.css';
const BUTTON_CLASS =
  'text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800';
// Define initial elements
const initialElements = createElements([
  { id: '1', data: { label: 'Hello' }, x: 100, y: 0, width: 100, height: 25 },
  { id: '2', data: { label: 'World' }, x: 100, y: 200, width: 100, height: 25 },
]);

// Define initial edges
const initialEdges = createLinks([
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    type: 'standard.Link', // If you define type, it provides intellisense support
    attrs: {
      line: {
        stroke: '#3498db', // Primary color
        strokeWidth: 2,
      },
    },
  },
]);

// Infer element type from the initial elements
type CustomElement = InferElement<typeof initialElements>;

const RenderItem = ({ data: { label } }: CustomElement) => {
  const htmlElementRef = useRef<HTMLDivElement | null>(null);
  return (
    <MeasuredNode>
      <div ref={htmlElementRef} className="node">
        <div>{label}</div>
      </div>
    </MeasuredNode>
  );
};

let zoomLevel = 1;

function Controls() {
  const paper = usePaper();
  return (
    <div className="flex flex-row">
      <button
        type="button"
        // eslint-disable-next-line react-perf/jsx-no-new-function-as-prop
        onClick={() => {
          const center = paper.getArea().center();
          zoomLevel = Math.min(3, zoomLevel + 0.2);
          paper.scaleUniformAtPoint(zoomLevel, center);
        }}
        className={BUTTON_CLASS}
      >
        Zoom in
      </button>
      <button
        type="button"
        // eslint-disable-next-line react-perf/jsx-no-new-function-as-prop
        onClick={() => {
          const center = paper.getArea().center();
          zoomLevel = Math.max(0.2, zoomLevel - 0.2);
          paper.scaleUniformAtPoint(zoomLevel, center);
        }}
        className={`${BUTTON_CLASS} ml-2`}
      >
        Zoom out
      </button>
    </div>
  );
}
function Main() {
  return (
    <Paper isHTMLRendererEnabled width={400} height={400} renderElement={RenderItem}>
      <Controls />
    </Paper>
  );
}

export default function App(props: Readonly<GraphProps>) {
  return (
    <GraphProvider {...props} defaultLinks={initialEdges} defaultElements={initialElements}>
      <Main />
    </GraphProvider>
  );
}
