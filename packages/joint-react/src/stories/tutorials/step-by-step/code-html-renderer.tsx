import { useCallback, useRef, useState } from 'react';
import {
  type CellRecord,
  GraphProvider,
  Paper,
  useCell,
  useMeasureNode,
  usePaper,
  selectElementSize,
} from '@joint/react';
import '../../examples/index.css';
import { BUTTON_CLASSNAME, PAPER_CLASSNAME } from 'storybook-config/theme';

// Define element type with custom properties
type ElementData = { label: string };

// Unified cells (elements + links in one array; each requires id + type)
const initialCells: ReadonlyArray<CellRecord<ElementData>> = [
  {
    id: '1',
    type: 'element',
    data: { label: 'Hello' },
    position: { x: 100, y: 15 },
    size: { width: 100, height: 25 },
  },
  {
    id: '2',
    type: 'element',
    data: { label: 'World' },
    position: { x: 100, y: 200 },
    size: { width: 100, height: 25 },
  },
  {
    id: 'e1-2',
    type: 'link',
    source: { id: '1' },
    target: { id: '2' },
    style: { color: '#3498db', width: 2 }, // Primary color
  },
];

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

function HTMLItem({ label }: Readonly<ElementData>) {
  const elementRef = useRef<HTMLDivElement>(null);
  useMeasureNode(elementRef);
  return (
    <div ref={elementRef} className="node">
      <div>{label}</div>
    </div>
  );
}

function SVGItem() {
  const { width, height } = useCell(selectElementSize);
  return <rect rx={10} ry={10} width={width} height={height} fill="blue" />;
}

function Main() {
  const [isHTMLEnabled, setIsHTMLEnabled] = useState(true);

  const renderItem = useCallback(
    (data: ElementData) => (isHTMLEnabled ? <HTMLItem {...data} /> : <SVGItem />),
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
    <GraphProvider initialCells={initialCells}>
      <Main />
    </GraphProvider>
  );
}
