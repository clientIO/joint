import { forwardRef, useCallback, useRef } from 'react';
import {
  GraphProvider,
  Paper,
  linkRoutingSmooth,
  useMarkup,
  useMeasureElement,
  type CellRecord,
  type RenderElement,
  type TransformElementLayout,
} from '@joint/react';
import '../index.css';

const ROW_HEIGHT = 30;
const HEADER_HEIGHT = 32;
const ELEMENT_WIDTH = 160;

// Colors — unified dark diagram palette.
const NODE_BODY_COLOR = '#1c2836';
const NODE_BORDER_COLOR = '#ED2637';
const HEADER_COLOR = '#243445';
const TEXT_COLOR = '#DDE6ED';
const LINK_COLOR = '#8697A6';
const HIGHLIGHT_COLOR = '#DDE6ED';

const SMOOTH_LINKS = linkRoutingSmooth({ mode: 'horizontal', straightWhenDisconnected: false });

const HIGHLIGHTING = {
  connecting: {
    name: 'stroke',
    options: {
      padding: 0,
      attrs: { stroke: HIGHLIGHT_COLOR, strokeWidth: 3 },
    },
  },
};

const DEFAULT_LINK = { style: { color: LINK_COLOR } };
const VALIDATE_CONNECTION = { allowRootConnection: false };

interface StackedData {
  readonly name: string;
  readonly labels: readonly string[];
}

const initialCells: ReadonlyArray<CellRecord<StackedData>> = [
  {
    id: '1',
    type: 'element',
    data: { name: 'Component A', labels: ['Header', 'Body', 'Footer'] },
    position: { x: 50, y: 50 },
  },
  {
    id: '2',
    type: 'element',
    data: { name: 'Component B', labels: ['Input', 'Process', 'Output'] },
    position: { x: 300, y: 50 },
  },
  {
    id: 'e1-2',
    type: 'link',
    source: { id: '1', magnet: 'item-2' },
    target: { id: '2', magnet: 'item-2' },
    style: { color: LINK_COLOR },
  },
];

interface ItemProps {
  readonly label: string;
  readonly index: number;
  readonly width: number;
  readonly rowY: number;
}

const Item = forwardRef<SVGGElement, ItemProps>(function Item({ label, index, width, rowY }, ref) {
  return (
    <g ref={ref} className="item">
      {index > 0 && (
        <line x1={0} y1={rowY} x2={width} y2={rowY} stroke={NODE_BORDER_COLOR} strokeOpacity={0.3} />
      )}
      <rect
        className="item__bg"
        x={0}
        y={rowY}
        width={width}
        height={ROW_HEIGHT}
        fill={NODE_BODY_COLOR}
      />
      <text
        x={width / 2}
        y={rowY + ROW_HEIGHT / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill={TEXT_COLOR}
        fontSize={13}
        fontFamily="sans-serif"
      >
        {label}
      </text>
    </g>
  );
});

function StackedNode({ name, labels }: Readonly<Partial<StackedData>>) {
  const contentRef = useRef<SVGGElement>(null);
  const { magnetRef } = useMarkup();

  const transform: TransformElementLayout = useCallback(
    ({ height }) => ({ width: ELEMENT_WIDTH, height: HEADER_HEIGHT + height }),
    []
  );

  const { width = 0, height = 0 } = useMeasureElement(contentRef, { transform });

  return (
    <>
      <rect
        width={width}
        height={height}
        fill={NODE_BODY_COLOR}
        stroke={NODE_BORDER_COLOR}
        strokeWidth={2}
        rx={4}
        ry={4}
      />
      <g className="header">
        <rect width={width} height={HEADER_HEIGHT} fill={HEADER_COLOR} rx={4} ry={4} />
        <rect x={0} y={HEADER_HEIGHT - 4} width={width} height={4} fill={HEADER_COLOR} />
        <text
          x={width / 2}
          y={HEADER_HEIGHT / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill={TEXT_COLOR}
          fontSize={14}
          fontFamily="sans-serif"
          fontWeight="bold"
        >
          {name}
        </text>
      </g>
      <g ref={contentRef}>
        {labels?.map((label, index) => (
          <Item
            key={label}
            ref={magnetRef(`item-${index}`)}
            label={label}
            index={index}
            width={width}
            rowY={HEADER_HEIGHT + index * ROW_HEIGHT}
          />
        ))}
      </g>
      {/* Redraw the border on top of the rows so the rounded corners stay clean. */}
      <rect
        width={width}
        height={height}
        fill="none"
        stroke={NODE_BORDER_COLOR}
        strokeWidth={2}
        rx={4}
        ry={4}
      />
    </>
  );
}

function Main() {
  const renderElement: RenderElement<StackedData> = useCallback(
    (data) => <StackedNode name={data.name} labels={data.labels} />,
    []
  );

  return (
    <Paper
      className="size-full"
      renderElement={renderElement}
      magnetThreshold="onleave"
      linkPinning={false}
      linkRouting={SMOOTH_LINKS}
      highlighting={HIGHLIGHTING}
      defaultLink={DEFAULT_LINK}
      validateConnection={VALIDATE_CONNECTION}
    />
  );
}

export default function App() {
  return (
    <GraphProvider initialCells={initialCells}>
      <Main />
    </GraphProvider>
  );
}
