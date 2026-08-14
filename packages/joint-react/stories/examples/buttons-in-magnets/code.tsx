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
const MAGNET_COUNT = 3;

interface NodeData {
  readonly kind: 'body' | 'magnets';
  readonly name: string;
}

const initialCells: Array<CellRecord<NodeData>> = [
  {
    id: 'body',
    type: 'element',
    data: { kind: 'body', name: 'controls in the body' },
    position: { x: 40, y: 40 },
    size: { width: 235, height: 224 },
  },
  {
    id: 'magnets',
    type: 'element',
    data: { kind: 'magnets', name: 'a control in each magnet' },
    position: { x: 340, y: 34 },
    size: { width: 250, height: 250 },
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

const selectStyle: React.CSSProperties = {
  font: 'inherit',
  fontSize: 11,
  color: 'inherit',
  background: 'rgba(0, 0, 0, 0.25)',
  border: '1px solid rgba(128, 128, 128, 0.35)',
  borderRadius: 4,
  padding: '3px 6px',
  width: '100%',
  boxSizing: 'border-box',
};

const rowSelectStyle: React.CSSProperties = { ...selectStyle, width: 108 };

const rowLabelStyle: React.CSSProperties = { whiteSpace: 'nowrap' };

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

const inputStyle: React.CSSProperties = {
  font: 'inherit',
  fontSize: 11,
  color: 'inherit',
  background: 'rgba(0, 0, 0, 0.25)',
  border: '1px solid rgba(128, 128, 128, 0.35)',
  borderRadius: 4,
  padding: '3px 8px',
  boxSizing: 'border-box',
  minWidth: 0,
};

const bodyInputStyle: React.CSSProperties = { ...inputStyle, width: '100%' };

const rowInputStyle: React.CSSProperties = { ...inputStyle, width: 108 };

const hintStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 10,
  lineHeight: 1.45,
  color: MUTED_TEXT_COLOR,
};

/**
 * Button label that makes it obvious the native click still lands. The count sits in a
 * `<span>`, so this also covers the case where the press target is inside the control
 * rather than the control itself.
 */
function ClickCounter() {
  const [count, setCount] = useState(0);
  const handleClick = useCallback(() => setCount((value) => value + 1), []);
  return (
    <button type="button" style={buttonStyle} onClick={handleClick}>
      <span>clicked {count}×</span>
    </button>
  );
}

const SELECT_OPTIONS = ['idle', 'running', 'done'];

/** Dropdown: `SELECT` is in GUARDED_TAG_NAMES, so the paper ignores it outright. */
function StatusSelect({ style }: Readonly<{ style: React.CSSProperties }>) {
  const [value, setValue] = useState(SELECT_OPTIONS[0]);
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => setValue(event.target.value),
    []
  );
  return (
    <select style={style} value={value} onChange={handleChange}>
      {SELECT_OPTIONS.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

interface TextFieldProps {
  readonly style: React.CSSProperties;
}

/** Text field: typeable and selectable, and never a drag handle. */
function TextField({ style }: Readonly<TextFieldProps>) {
  const [value, setValue] = useState('type here');
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => setValue(event.target.value),
    []
  );
  return <input style={style} value={value} onChange={handleChange} />;
}

/** Card whose body holds a plain button — no magnet involved. */
function BodyButtonNode({ name }: Readonly<Partial<NodeData>>) {
  return (
    <HTMLBox className="jj-node" useModelGeometry style={cardStyle}>
      <div style={headerStyle}>{name}</div>
      <div style={bodyStyle}>
        <ClickCounter />
        <TextField style={bodyInputStyle} />
        <StatusSelect style={selectStyle} />
        <p style={hintStyle}>
          Click the button to count; drag it to move the element without counting. The text
          field selects text instead, and the paper ignores the dropdown outright.
        </p>
      </div>
    </HTMLBox>
  );
}

interface MagnetRowProps {
  readonly index: number;
}

/** One magnet row, each holding a different kind of control. */
function MagnetRow({ index }: Readonly<MagnetRowProps>) {
  const { magnetRef } = useMarkup();
  return (
    <div ref={magnetRef(`port-${index}`)} style={rowStyle}>
      <span style={rowLabelStyle}>port-{index}</span>
      {index === 0 && <ClickCounter />}
      {index === 1 && <TextField style={rowInputStyle} />}
      {index === 2 && <StatusSelect style={rowSelectStyle} />}
    </div>
  );
}

/** Card with three magnet rows, each holding a different control: a button, a text field, a select. */
function MagnetButtonsNode({ name }: Readonly<Partial<NodeData>>) {
  return (
    <HTMLBox className="jj-node" useModelGeometry style={cardStyle}>
      <div style={headerStyle}>{name}</div>
      {Array.from({ length: MAGNET_COUNT }, (_, index) => (
        <MagnetRow key={`port-${index}`} index={index} />
      ))}
      <div style={bodyStyle}>
        <p style={hintStyle}>
          Drag off a row, or off its button, to start a link. The text field starts none, and
          the dropdown never reaches the paper at all.
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
