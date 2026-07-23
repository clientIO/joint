import { useCallback } from 'react';
import {
  type CellRecord,
  type CanConnectOptions,
  GraphProvider,
  Paper,
  HTMLBox,
  useMarkup,
  linkRoutingSmooth,
  type RenderElement,
} from '@joint/react';

const SMOOTH_LINKS = linkRoutingSmooth({ mode: 'horizontal', straightWhenDisconnected: false });
const VALIDATE_CONNECTION: CanConnectOptions = { allowRootConnection: false };

// Colors — unified dark diagram palette. The card body, border and primary text
// come from the shared `jj-node` class; only the table chrome is styled here.
const HEADER_COLOR = '#243445';
const MUTED_TEXT_COLOR = '#93A4B3';

interface TableData {
  readonly name: string;
  readonly rows: ReadonlyArray<{ readonly field: string; readonly type: string }>;
}

const initialCells: Array<CellRecord<TableData>> = [
  {
    id: '1',
    type: 'element',
    data: {
      name: 'users',
      rows: [
        { field: 'id', type: 'uuid' },
        { field: 'name', type: 'text' },
        { field: 'email', type: 'text' },
      ],
    },
    position: { x: 50, y: 40 },
    size: { width: 200, height: 152 },
  },
  {
    id: '2',
    type: 'element',
    data: {
      name: 'orders',
      rows: [
        { field: 'id', type: 'uuid' },
        { field: 'user_id', type: 'uuid' },
        { field: 'total', type: 'decimal' },
      ],
    },
    position: { x: 340, y: 40 },
    size: { width: 200, height: 152 },
  },
  {
    id: 'l1',
    type: 'link',
    source: { id: '1', magnet: 'row-0' },
    target: { id: '2', magnet: 'row-1' },
  },
];

const cardStyle: React.CSSProperties = {
  flexDirection: 'column',
  alignItems: 'stretch',
  justifyContent: 'flex-start',
  textAlign: 'left',
  padding: 0,
  overflow: 'hidden',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
};

const headerStyle: React.CSSProperties = {
  padding: '10px 14px',
  fontWeight: 600,
  fontSize: 13,
  letterSpacing: '0.01em',
  background: HEADER_COLOR,
  borderBottom: '1px solid rgba(128, 128, 128, 0.2)',
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '7px 14px',
  fontSize: 12,
  cursor: 'crosshair',
  userSelect: 'none',
  borderBottom: '1px solid rgba(128, 128, 128, 0.15)',
};

const fieldStyle: React.CSSProperties = {
  fontWeight: 500,
};

const typeStyle: React.CSSProperties = {
  color: MUTED_TEXT_COLOR,
  fontSize: 11,
};

interface TableRowProps {
  readonly field: string;
  readonly type: string;
  readonly index: number;
}

function TableRow({ field, type, index }: Readonly<TableRowProps>) {
  const { magnetRef } = useMarkup();
  return (
    <div ref={magnetRef(`row-${index}`)} style={rowStyle}>
      <span style={fieldStyle}>{field}</span>
      <span style={typeStyle}>{type}</span>
    </div>
  );
}

function TableNode({ name, rows }: Readonly<Partial<TableData>>) {
  return (
    <HTMLBox className="jj-node" useModelGeometry style={cardStyle}>
      <div style={headerStyle}>{name}</div>
      {rows?.map((row, index) => (
        <TableRow key={row.field} field={row.field} type={row.type} index={index} />
      ))}
    </HTMLBox>
  );
}

function Main() {
  const renderElement: RenderElement<TableData> = useCallback((data) => {
    return <TableNode name={data.name} rows={data.rows} />;
  }, []);

  return (
    <Paper
      className="size-full"
      renderElement={renderElement}
      magnetThreshold="onleave"
      linkPinning={false}
      linkRouting={SMOOTH_LINKS}
      validateConnection={VALIDATE_CONNECTION}
      drawGrid={false}
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
