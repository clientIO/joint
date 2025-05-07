/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { useCallback, useState } from 'react';
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
import { BUTTON_CLASSNAME } from 'storybook-config/theme';
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
        className={BUTTON_CLASSNAME}
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
        className={`${BUTTON_CLASSNAME} ml-2`}
      >
        Zoom out
      </button>
    </div>
  );
}
function Main() {
  const [isHTMLEnabled, setHTMLEnabled] = useState(true);

  // Infer element type from the initial elements
  type CustomElement = InferElement<typeof initialElements>;

  const renderItem = useCallback(
    ({ data: { label }, width, height }: CustomElement) => {
      if (isHTMLEnabled) {
        return (
          <MeasuredNode>
            <div className="node">
              <div>{label}</div>
            </div>
          </MeasuredNode>
        );
      }
      return <rect rx={10} ry={10} width={width} height={height} fill="blue" />;
    },
    [isHTMLEnabled]
  );

  return (
    <Paper useHTMLOverlay={isHTMLEnabled} width={400} height={400} renderElement={renderItem}>
      <Controls />
      <button
        type="button"
        // eslint-disable-next-line react-perf/jsx-no-new-function-as-prop
        onClick={() => {
          setHTMLEnabled((previous) => !previous);
        }}
        className={`${BUTTON_CLASSNAME} mt-2`}
      >
        is HTML Overlay enabled: {isHTMLEnabled ? 'true' : 'false'}
      </button>
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
