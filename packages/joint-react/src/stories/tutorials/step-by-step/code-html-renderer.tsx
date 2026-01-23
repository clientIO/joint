import { useCallback, useRef, useState } from 'react';
import {
  GraphProvider,
  Paper,
  usePaper,
  useNodeSize,
  type GraphProps,
  type GraphElement,
  type GraphLink,
} from '@joint/react';
import '../../examples/index.css';
import { BUTTON_CLASSNAME } from 'storybook-config/theme';

// Define element type with custom properties
type CustomElement = GraphElement & { data: { label: string } };

// Define initial elements
const initialElements: CustomElement[] = [
  { id: '1', data: { label: 'Hello' }, x: 100, y: 0, width: 100, height: 25 },
  { id: '2', data: { label: 'World' }, x: 100, y: 200, width: 100, height: 25 },
];

// Define initial edges
const initialEdges: GraphLink[] = [
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
];

let zoomLevel = 1;

function Controls() {
  const paper = usePaper();
  return (
    <div className="flex flex-row">
      <button
        type="button"
        // eslint-disable-next-line react-perf/jsx-no-new-function-as-prop
        onClick={() => {
          const center = paper?.getArea().center();
          if (!center) return;
          zoomLevel = Math.min(3, zoomLevel + 0.2);
          paper?.scaleUniformAtPoint(zoomLevel, center);
        }}
        className={BUTTON_CLASSNAME}
      >
        Zoom in
      </button>
      <button
        type="button"
        // eslint-disable-next-line react-perf/jsx-no-new-function-as-prop
        onClick={() => {
          const center = paper?.getArea().center();
          if (!center) return;
          zoomLevel = Math.max(0.2, zoomLevel - 0.2);
          paper?.scaleUniformAtPoint(zoomLevel, center);
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

  const renderItem = useCallback(
    ({ data: { label }, width, height }: CustomElement) => {
      if (isHTMLEnabled) {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const elementRef = useRef<HTMLDivElement>(null);
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useNodeSize(elementRef);
        return (
          <div ref={elementRef} className="node">
            <div>{label}</div>
          </div>
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
    <GraphProvider
      areBatchUpdatesDisabled
      {...props}
      links={initialEdges}
      elements={initialElements}
    >
      <Main />
    </GraphProvider>
  );
}
