/* eslint-disable react-perf/jsx-no-new-object-as-prop */

import { useCallback } from 'react';
import {
  GraphProvider,
  Paper,
  HTMLBox,
  useMarkup,
  type Cells,
  type RenderElement,
} from '@joint/react';
import '../index.css';
import './styles.css';
import { linkRoutingSmooth } from '@joint/react/presets';

const SMOOTH_LINKS = linkRoutingSmooth({ mode: 'horizontal', straightWhenDisconnected: false });

interface TableElement {
  readonly name: string;
  readonly rows: ReadonlyArray<{ readonly field: string; readonly type: string }>;
}

const initialCells: Cells<TableElement> = [
  {
    id: '1',
    type: 'ElementModel',
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
    type: 'ElementModel',
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
    type: 'LinkModel',
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
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
};

const headerStyle: React.CSSProperties = {
  padding: '10px 14px',
  fontWeight: 600,
  fontSize: 13,
  letterSpacing: '0.01em',
  borderBottom: '1px solid',
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '7px 14px',
  fontSize: 12,
  cursor: 'crosshair',
  userSelect: 'none',
};

const fieldStyle: React.CSSProperties = {
  fontWeight: 500,
};

const typeStyle: React.CSSProperties = {
  color: '#999',
  fontSize: 11,
};

interface TableRowProps {
  readonly field: string;
  readonly type: string;
  readonly index: number;
}

function TableRow({ field, type, index }: Readonly<TableRowProps>) {
  const { selectorRef } = useMarkup();
  const selectorRefForRow = selectorRef(`row-${index}`);
  const setRowRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (node) node.setAttribute('magnet', 'active');
      selectorRefForRow(node);
    },
    [selectorRefForRow]
  );

  return (
    <div
      className="table-row"
      ref={setRowRef}
      style={{
        ...rowStyle,
        borderBottom: '1px solid rgba(128, 128, 128, 0.15)',
      }}
    >
      <span style={fieldStyle}>{field}</span>
      <span style={typeStyle}>{type}</span>
    </div>
  );
}

function TableNode({ name, rows }: Readonly<Partial<TableElement>>) {
  return (
    <HTMLBox useModelGeometry style={cardStyle}>
      <div style={headerStyle}>{name}</div>
      {rows?.map((row, index) => (
        <TableRow key={row.field} field={row.field} type={row.type} index={index} />
      ))}
    </HTMLBox>
  );
}

function Main() {
  const renderElement: RenderElement<TableElement> = useCallback((data) => {
    return <TableNode name={data.name} rows={data.rows} />;
  }, []);

  return (
    <Paper
      width="100%"
      height={280}
      renderElement={renderElement}
      magnetThreshold="onleave"
      linkPinning={false}
      {...SMOOTH_LINKS}
      validateConnection={{ allowRootConnection: false }}
      drawGrid={false}
    />
  );
}

export default function App() {
  return (
    <GraphProvider<TableElement> initialCells={initialCells}>
      <Main />
    </GraphProvider>
  );
}
