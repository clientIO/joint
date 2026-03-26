import { useCallback, useRef, useState } from 'react';
import {
  GraphProvider,
  Paper,
  usePaper,
  useElementSize,
  useMeasureNode,
  type FlatElementData,
  type FlatLinkData,
} from '@joint/react';
import '../../examples/index.css';
import { BUTTON_CLASSNAME, PAPER_CLASSNAME } from 'storybook-config/theme';

// Define element type with custom properties
type ElementData = { label: string };

// Define initial elements as Record
const initialElements: Record<string, FlatElementData<ElementData>> = {
  '1': { data: { label: 'Hello' }, x: 100, y: 15, width: 100, height: 25 },
  '2': { data: { label: 'World' }, x: 100, y: 200, width: 100, height: 25 },
};

// Define initial edges as Record
const initialEdges: Record<string, FlatLinkData> = {
  'e1-2': {
    source: '1',
    target: '2',
    color: '#3498db', // Primary color
    width: 2,
  },
};

let zoomLevel = 1;

function Controls() {
  const { paper } = usePaper();
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
  const [isHTMLEnabled, setIsHTMLEnabled] = useState(true);

  // Infer element type from the initial elements

  const renderItem = useCallback(
    ({ label }: ElementData) => {
      if (isHTMLEnabled) {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const elementRef = useRef<HTMLDivElement>(null);
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useMeasureNode(elementRef);
        return (
          <div ref={elementRef} className="node">
            <div>{label}</div>
          </div>
        );
      }
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const { width, height } = useElementSize();
      return <rect rx={10} ry={10} width={width} height={height} fill="blue" />;
    },
    [isHTMLEnabled]
  );

  return (
    <Paper
      useHTMLOverlay={isHTMLEnabled}
      height={400}
      renderElement={renderItem}
      className={PAPER_CLASSNAME}
    >
      <Controls />
      <button
        type="button"
        // eslint-disable-next-line react-perf/jsx-no-new-function-as-prop
        onClick={() => {
          setIsHTMLEnabled((previous) => !previous);
        }}
        className={`${BUTTON_CLASSNAME} mt-2`}
      >
        is HTML Overlay enabled: {isHTMLEnabled ? 'true' : 'false'}
      </button>
    </Paper>
  );
}

export default function App() {
  return (
    <GraphProvider links={initialEdges} elements={initialElements}>
      <Main />
    </GraphProvider>
  );
}
