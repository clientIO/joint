import { useRef } from 'react';
import {
  GraphProvider,
  Paper,
  SVGText,
  useMeasureElement,
  type CellRecord,
  type RenderElement,
} from '@joint/react';

const PRIMARY = '#ED2637';
const PADDING = 12;

type NodeData = { label: string; ellipsis?: boolean };

const initialCells: ReadonlyArray<CellRecord<NodeData>> = [
  { id: '1', type: 'element', data: { label: 'Auto-measured SVG text that wraps onto multiple lines.' }, position: { x: 40, y: 40 } },
  { id: '2', type: 'element', data: { label: 'This label is clamped to a single line with an ellipsis.', ellipsis: true }, position: { x: 40, y: 170 } },
];

const WRAP_WIDTH = 180;
const ELLIPSIS_WRAP = { ellipsis: true, maxLineCount: 1 } as const;

function TextNode({ label, ellipsis }: Readonly<NodeData>) {
  const groupRef = useRef<SVGGElement>(null);
  const { width, height } = useMeasureElement(groupRef, {
    transform: ({ x, y, width: measuredWidth, height: measuredHeight }) => ({
      x: x - PADDING,
      y: y - PADDING,
      width: measuredWidth + PADDING * 2,
      height: measuredHeight + PADDING * 2,
    }),
  });

  return (
    <>
      <rect width={width} height={height} rx={10} fill={PRIMARY} />
      <g ref={groupRef} transform={`translate(${PADDING}, ${PADDING})`}>
        <SVGText
          fill="#fff"
          width={WRAP_WIDTH}
          textWrap={ellipsis ? ELLIPSIS_WRAP : true}
        >
          {label}
        </SVGText>
      </g>
    </>
  );
}

const renderElement: RenderElement<NodeData> = (data) => <TextNode {...data} />;

export default function App() {
  return (
    <GraphProvider initialCells={initialCells}>
      <Paper className="size-full" renderElement={renderElement} />
    </GraphProvider>
  );
}
