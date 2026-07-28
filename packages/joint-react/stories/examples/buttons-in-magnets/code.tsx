import { useCallback, useState } from 'react';
import {
  type CanConnectOptions,
  type CellRecord,
  GraphProvider,
  HTMLBox,
  Paper,
  type RenderElement,
  linkRoutingSmooth,
  useMarkup,
} from '@joint/react';

const SMOOTH_LINKS = linkRoutingSmooth({ mode: 'horizontal', straightWhenDisconnected: false });
// Links may land on an element body, so a port button can be connected to the other card.
const VALIDATE_CONNECTION: CanConnectOptions = { allowRootConnection: true };

// Colors — unified dark diagram palette. The card body and border come from the
// shared `jj-node` class; only the chrome below is styled here.
const HEADER_COLOR = '#243445';
const MUTED_TEXT_COLOR = '#93A4B3';
const BUTTON_COLOR = '#2F4459';
const MAGNET_COUNT = 2;

interface NodeData {
  readonly kind: 'body' | 'magnets';
  readonly name: string;
}

const initialCells: Array<CellRecord<NodeData>> = [
  {
    id: 'body',
    type: 'element',
    data: { kind: 'body', name: 'button in the body' },
    position: { x: 40, y: 56 },
    size: { width: 215, height: 142 },
  },
  {
    id: 'magnets',
    type: 'element',
    data: { kind: 'magnets', name: 'button in each magnet' },
    position: { x: 340, y: 34 },
    size: { width: 235, height: 200 },
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
  padding: '9px 12px',
  fontWeight: 600,
  fontSize: 12,
  background: HEADER_COLOR,
  borderBottom: '1px solid rgba(128, 128, 128, 0.2)',
};

const bodyStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  padding: '12px',
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 8,
  padding: '8px 12px',
  fontSize: 12,
  cursor: 'crosshair',
  userSelect: 'none',
  borderBottom: '1px solid rgba(128, 128, 128, 0.15)',
};

const buttonStyle: React.CSSProperties = {
  font: 'inherit',
  fontSize: 11,
  color: 'inherit',
  background: BUTTON_COLOR,
  border: '1px solid rgba(128, 128, 128, 0.35)',
  borderRadius: 4,
  padding: '3px 8px',
  cursor: 'pointer',
};

const hintStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 10,
  lineHeight: 1.45,
  color: MUTED_TEXT_COLOR,
};

/** Button label that makes it obvious the native click still lands. */
function ClickCounter() {
  const [count, setCount] = useState(0);
  const handleClick = useCallback(() => setCount((value) => value + 1), []);
  return (
    <button type="button" style={buttonStyle} onClick={handleClick}>
      clicked {count}×
    </button>
  );
}

/** Card whose body holds a plain button — no magnet involved. */
function BodyButtonNode({ name }: Readonly<Partial<NodeData>>) {
  return (
    <HTMLBox className="jj-node" useModelGeometry style={cardStyle}>
      <div style={headerStyle}>{name}</div>
      <div style={bodyStyle}>
        <ClickCounter />
        <p style={hintStyle}>
          Click the button to count. Drag it to move the element — the drag does not also count,
          so one gesture is never both.
        </p>
      </div>
    </HTMLBox>
  );
}

interface MagnetRowProps {
  readonly index: number;
}

/** One magnet row with a button inside it. */
function MagnetRow({ index }: Readonly<MagnetRowProps>) {
  const { magnetRef } = useMarkup();
  return (
    <div ref={magnetRef(`port-${index}`)} style={rowStyle}>
      <span>port-{index}</span>
      <ClickCounter />
    </div>
  );
}

/** Card with two magnets, each containing a button. */
function MagnetButtonsNode({ name }: Readonly<Partial<NodeData>>) {
  return (
    <HTMLBox className="jj-node" useModelGeometry style={cardStyle}>
      <div style={headerStyle}>{name}</div>
      {Array.from({ length: MAGNET_COUNT }, (_, index) => (
        <MagnetRow key={`port-${index}`} index={index} />
      ))}
      <div style={bodyStyle}>
        <p style={hintStyle}>
          Drag off a row — or off its button — to start a link. Releasing a button in place
          clicks it instead.
        </p>
      </div>
    </HTMLBox>
  );
}

function Main() {
  const renderElement: RenderElement<NodeData> = useCallback((data) => {
    return data.kind === 'body' ? (
      <BodyButtonNode name={data.name} />
    ) : (
      <MagnetButtonsNode name={data.name} />
    );
  }, []);

  return (
    <Paper
      className="size-full"
      renderElement={renderElement}
      // Without `onleave` a press on a magnet starts the link immediately, so a plain
      // click on a magnet would already create one.
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
