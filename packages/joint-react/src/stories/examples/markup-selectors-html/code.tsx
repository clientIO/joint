/* eslint-disable react-perf/jsx-no-new-object-as-prop */

import { useCallback } from 'react';
import {
  GraphProvider,
  Paper,
  HTMLBox,
  useMarkup,
  type LinkRecord,
  type RenderElement,
  type ElementRecord,
} from '@joint/react';
import '../index.css';
import './styles.css';
import { linkRoutingSmooth } from '@joint/react/presets';

const SMOOTH_LINKS = linkRoutingSmooth({ mode: 'horizontal', straightWhenDisconnected: false });

interface TableElement {
  readonly name: string;
  readonly rows: ReadonlyArray<{ readonly field: string; readonly type: string }>;
}

const initialElements: Record<string, ElementRecord<TableElement>> = {
  '1': {
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
  '2': {
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
};

const initialLinks: Record<string, LinkRecord> = {
  'l1': {
    source: { id: '1', magnet: 'row-0' },
    target: { id: '2', magnet: 'row-1' },
  },
};

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

function TableNode({ name, rows }: Readonly<Partial<TableElement>>) {
  const { selectorRef } = useMarkup();

  return (
    <HTMLBox useModelGeometry style={cardStyle}>
      <div style={headerStyle}>{name}</div>
      {rows?.map((row, index) => (
        <div
          key={row.field}
          className="table-row"
          ref={(node) => {
            if (node) node.setAttribute('magnet', 'active');
            selectorRef(`row-${index}`)(node);
          }}
          style={{
            ...rowStyle,
            borderBottom: '1px solid rgba(128, 128, 128, 0.15)',
          }}
        >
          <span style={fieldStyle}>{row.field}</span>
          <span style={typeStyle}>{row.type}</span>
        </div>
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
    <GraphProvider elements={initialElements} links={initialLinks}>
      <Main />
    </GraphProvider>
  );
}
