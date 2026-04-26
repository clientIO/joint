
/* eslint-disable react-perf/jsx-no-new-object-as-prop */

import { forwardRef, useCallback, useRef } from 'react';
import {
  GraphProvider,
  Paper,
  useMeasureNode,
  useMarkup,
  type Cells,
  type RenderElement,
  type OnTransformElement,
} from '@joint/react';
import { PAPER_CLASSNAME, PAPER_STYLE, PRIMARY, BG, TEXT, LIGHT } from 'storybook-config/theme';
import '../index.css';
import { linkRoutingSmooth } from '@joint/react/presets';

const ROW_HEIGHT = 30;
const HEADER_HEIGHT = 32;
const ELEMENT_WIDTH = 160;
const HEADER_COLOR = '#f6c744';
const SMOOTH_LINKS = linkRoutingSmooth({ mode: 'horizontal', straightWhenDisconnected: false });

interface StackedData {
  readonly name: string;
  readonly labels: readonly string[];
}

const initialCells: Cells<StackedData> = [
  {
    id: '1',
    type: 'element',
    data: {
      name: 'Component A',
      labels: ['Header', 'Body', 'Footer'],
    },
    position: { x: 50, y: 50 },
  },
  {
    id: '2',
    type: 'element',
    data: {
      name: 'Component B',
      labels: ['Input', 'Process', 'Output'],
    },
    position: { x: 300, y: 50 },
  },
  {
    id: 'e1-2',
    type: 'link',
    source: { id: '1', magnet: 'item-2' },
    target: { id: '2', magnet: 'item-2' },
    style: { color: LIGHT },
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
        <line x1={0} y1={rowY} x2={width} y2={rowY} stroke={PRIMARY} strokeOpacity={0.3} />
      )}
      <rect className="item__bg" x={0} y={rowY} width={width} height={ROW_HEIGHT} fill={BG} />
      <text
        x={width / 2}
        y={rowY + ROW_HEIGHT / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill={TEXT}
        fontSize={13}
        fontFamily="sans-serif"
      >
        {label}
      </text>
    </g>
  );
});

function StackedNode({ name, labels }: Readonly<Partial<StackedData>>) {
  const contentRef = useRef(null);
  const { magnetRef } = useMarkup();

  const transform: OnTransformElement = useCallback(({ height }) => {
    return {
      width: ELEMENT_WIDTH,
      height: HEADER_HEIGHT + height,
    };
  }, []);

  const { width = 0, height = 0 } = useMeasureNode(contentRef, { transform });

  return (
    <>
      <rect
        width={width}
        height={height}
        fill={BG}
        stroke={PRIMARY}
        strokeWidth={2}
        rx={4}
        ry={4}
      />
      {/* Header */}
      <g className="header">
        <rect width={width} height={HEADER_HEIGHT} fill={HEADER_COLOR} rx={4} ry={4} />
        <rect x={0} y={HEADER_HEIGHT - 4} width={width} height={4} fill={HEADER_COLOR} />
        <text
          x={width / 2}
          y={HEADER_HEIGHT / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#1a1a1a"
          fontSize={14}
          fontFamily="sans-serif"
          fontWeight="bold"
        >
          {name}
        </text>
      </g>
      {/* Attribute rows */}
      <g ref={contentRef}>
        {labels?.map((label, index) => {
          const rowY = HEADER_HEIGHT + index * ROW_HEIGHT;
          return (
            <Item
              key={label}
              ref={magnetRef(`item-${index}`)}
              label={label}
              index={index}
              width={width}
              rowY={rowY}
            />
          );
        })}
      </g>
      {/* Border on top for clean rounded corners */}
      <rect
        width={width}
        height={height}
        fill="none"
        stroke={PRIMARY}
        strokeWidth={2}
        rx={4}
        ry={4}
      />
    </>
  );
}

function Main() {
  const renderElement: RenderElement<StackedData> = useCallback((data) => {
    return <StackedNode name={data.name} labels={data.labels} />;
  }, []);

  return (
    <Paper
      width="100%"
      className={PAPER_CLASSNAME}
      height={250}
      renderElement={renderElement}
      magnetThreshold={'onleave'}
      linkPinning={false}
      {...SMOOTH_LINKS}
      highlighting={{
        connecting: {
          name: 'stroke',
          options: {
            padding: 0,
            attrs: {
              stroke: LIGHT,
              strokeWidth: 3,
            },
          },
        },
      }}
      defaultLink={{
        style: { color: LIGHT },
      }}
      validateConnection={{
        allowRootConnection: false
      }}
      style={PAPER_STYLE}
      drawGrid={false}
    />
  );
}

export default function App() {
  return (
    <GraphProvider<StackedData> initialCells={initialCells}>
      <Main />
    </GraphProvider>
  );
}
