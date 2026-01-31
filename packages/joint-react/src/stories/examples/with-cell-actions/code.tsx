/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import { useRef, useState } from 'react';
import {
  GraphProvider,
  Paper,
  useCellActions,
  useElements,
  useLinks,
  useNodeLayout,
  useNodeSize,
  type GraphElement,
  type GraphLink,
} from '@joint/react';
import '../index.css';
import { PAPER_CLASSNAME, PRIMARY, LIGHT } from 'storybook-config/theme';

const SECONDARY = '#6366f1';

interface NodeData extends GraphElement {
  readonly label: string;
  readonly color: string;
}

const initialElements: Record<string, NodeData> = {
  '1': { label: 'Node A', color: PRIMARY, x: 50, y: 50, width: 120, height: 60 },
  '2': { label: 'Node B', color: SECONDARY, x: 250, y: 50, width: 120, height: 60 },
  '3': { label: 'Node C', color: PRIMARY, x: 150, y: 180, width: 120, height: 60 },
};

const initialLinks: Record<string, GraphLink> = {
  'link-1-2': {
    source: '1',
    target: '2',
    color: LIGHT,
  },
  'link-1-3': {
    source: '1',
    target: '3',
    color: LIGHT,
  },
};

// --- Node Component ---

function RenderElement({ label, color }: Readonly<NodeData>) {
  const elementRef = useRef<HTMLDivElement>(null);
  const { width, height } = useNodeSize(elementRef);

  return (
    <foreignObject width={width} height={height}>
      <div
        ref={elementRef}
        style={{
          backgroundColor: color,
          borderRadius: 8,
          padding: '12px 16px',
          color: 'white',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          minWidth: 80,
          minHeight: 40,
        }}
      >
        {label}
      </div>
    </foreignObject>
  );
}

// --- Control Panel Components ---

interface ElementControlsProps {
  readonly id: string;
  readonly element: NodeData;
}

function ElementControls({ id, element }: Readonly<ElementControlsProps>) {
  const { set, remove } = useCellActions<NodeData>();
  const layout = useNodeLayout(id);

  const inputStyle = {
    padding: '6px 10px',
    border: '1px solid rgba(0, 0, 0, 0.15)',
    borderRadius: 8,
    fontSize: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    color: '#1f2937',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  };

  return (
    <div
      style={{
        padding: '12px 16px',
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ fontWeight: 600, color: '#1f2937', fontSize: 13 }}>
        {element.label}
        <span style={{ fontWeight: 400, color: '#9ca3af', marginLeft: 6, fontSize: 11 }}>#{id}</span>
      </div>

      {/* Label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <label style={{ width: 45, fontSize: 11, color: '#6b7280', fontWeight: 500 }}>Label</label>
        <input
          type="text"
          value={element.label}
          onChange={(event) => set(id, (previous) => ({ ...previous, label: event.target.value }))}
          style={{ ...inputStyle, flex: 1 }}
        />
      </div>

      {/* Color */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <label style={{ width: 45, fontSize: 11, color: '#6b7280', fontWeight: 500 }}>Color</label>
        <input
          type="color"
          value={element.color}
          onChange={(event) => set(id, (previous) => ({ ...previous, color: event.target.value }))}
          style={{ width: 36, height: 28, border: 'none', cursor: 'pointer', borderRadius: 6, padding: 0 }}
        />
      </div>

      {/* Position */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <label style={{ width: 45, fontSize: 11, color: '#6b7280', fontWeight: 500 }}>Pos</label>
        <input
          type="number"
          value={layout?.x ?? element.x}
          onChange={(event) => set(id, (previous) => ({ ...previous, x: Number(event.target.value) }))}
          style={{ ...inputStyle, width: 65 }}
          placeholder="X"
        />
        <input
          type="number"
          value={layout?.y ?? element.y}
          onChange={(event) => set(id, (previous) => ({ ...previous, y: Number(event.target.value) }))}
          style={{ ...inputStyle, width: 65 }}
          placeholder="Y"
        />
      </div>

      {/* Size */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <label style={{ width: 45, fontSize: 11, color: '#6b7280', fontWeight: 500 }}>Size</label>
        <input
          type="number"
          value={layout?.width ?? element.width}
          onChange={(event) => set(id, (previous) => ({ ...previous, width: Number(event.target.value) }))}
          style={{ ...inputStyle, width: 65 }}
          placeholder="W"
        />
        <input
          type="number"
          value={layout?.height ?? element.height}
          onChange={(event) => set(id, (previous) => ({ ...previous, height: Number(event.target.value) }))}
          style={{ ...inputStyle, width: 65 }}
          placeholder="H"
        />
      </div>

      {/* Angle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <label style={{ width: 45, fontSize: 11, color: '#6b7280', fontWeight: 500 }}>Angle</label>
        <input
          type="range"
          min="0"
          max="360"
          value={layout?.angle ?? 0}
          onChange={(event) => set(id, (previous) => ({ ...previous, angle: Number(event.target.value) }))}
          style={{ flex: 1, accentColor: PRIMARY }}
        />
        <span style={{ fontSize: 11, width: 32, color: '#6b7280' }}>{layout?.angle ?? 0}°</span>
      </div>

      {/* Remove */}
      <button
        onClick={() => remove(id)}
        style={{
          marginTop: 4,
          padding: '8px 12px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          color: '#dc2626',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: 8,
          cursor: 'pointer',
          fontSize: 11,
          fontWeight: 500,
          transition: 'background-color 0.15s',
        }}
      >
        Remove
      </button>
    </div>
  );
}

function getLinkEndpointId(endpoint: GraphLink['source']): string {
  if (typeof endpoint === 'string') return endpoint;
  if (typeof endpoint === 'object' && 'id' in endpoint) {
    return String(endpoint.id);
  }
  return 'unknown';
}

interface LinkControlsProps {
  readonly id: string;
  readonly link: GraphLink;
}

function LinkControls({ id, link }: Readonly<LinkControlsProps>) {
  const { set, remove } = useCellActions<GraphLink>();
  const sourceId = getLinkEndpointId(link.source);
  const targetId = getLinkEndpointId(link.target);

  return (
    <div
      style={{
        padding: '12px 16px',
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ fontWeight: 600, color: '#1f2937', fontSize: 13 }}>
        {sourceId} <span style={{ color: '#9ca3af', margin: '0 4px' }}>→</span> {targetId}
      </div>

      {/* Stroke Color */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <label style={{ width: 45, fontSize: 11, color: '#6b7280', fontWeight: 500 }}>Color</label>
        <input
          type="color"
          value={(link.color as string) ?? '#000000'}
          onChange={(event) =>
            set(id, (previous) => ({
              ...previous,
              color: event.target.value,
            }))
          }
          style={{ width: 36, height: 28, border: 'none', cursor: 'pointer', borderRadius: 6, padding: 0 }}
        />
      </div>

      {/* Remove */}
      <button
        onClick={() => remove(id)}
        style={{
          marginTop: 4,
          padding: '8px 12px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          color: '#dc2626',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: 8,
          cursor: 'pointer',
          fontSize: 11,
          fontWeight: 500,
          transition: 'background-color 0.15s',
        }}
      >
        Remove
      </button>
    </div>
  );
}

function AddElementForm() {
  const { set } = useCellActions<NodeData>();
  const elements = useElements<NodeData>();
  const [label, setLabel] = useState('');

  const handleAdd = () => {
    if (!label.trim()) return;

    const existingIds = Object.keys(elements).map(Number).filter((numberValue) => !Number.isNaN(numberValue));
    const newId = String(Math.max(0, ...existingIds) + 1);

    // eslint-disable-next-line sonarjs/pseudo-random -- Random position for demo purposes
    const randomX = 50 + Math.random() * 200;
    // eslint-disable-next-line sonarjs/pseudo-random -- Random position for demo purposes
    const randomY = 50 + Math.random() * 150;

    set(newId, {
      label: label.trim(),
      color: PRIMARY,
      x: randomX,
      y: randomY,
      width: 120,
      height: 60,
    });
    setLabel('');
  };

  return (
    <div
      style={{
        padding: '12px 16px',
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ fontWeight: 600, color: '#1f2937', fontSize: 12 }}>Add Node</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="Label..."
          style={{
            flex: 1,
            padding: '8px 12px',
            border: '1px solid rgba(0, 0, 0, 0.15)',
            borderRadius: 8,
            fontSize: 12,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            color: '#1f2937',
            outline: 'none',
          }}
          onKeyDown={(event) => event.key === 'Enter' && handleAdd()}
        />
        <button
          onClick={handleAdd}
          style={{
            padding: '8px 14px',
            backgroundColor: PRIMARY,
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}

function AddLinkForm() {
  const { set } = useCellActions<GraphLink>();
  const elements = useElements<NodeData>();
  const [source, setSource] = useState('');
  const [target, setTarget] = useState('');

  const elementIds = Object.keys(elements);

  const selectStyle = {
    flex: 1,
    padding: '8px 10px',
    border: '1px solid rgba(0, 0, 0, 0.15)',
    borderRadius: 8,
    fontSize: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    color: '#1f2937',
    outline: 'none',
    cursor: 'pointer',
  };

  const handleAdd = () => {
    if (!source || !target || source === target) return;

    const newId = `link-${source}-${target}-${Date.now()}`;
    set(newId, {
      source,
      target,
      color: LIGHT,
    });
    setSource('');
    setTarget('');
  };

  return (
    <div
      style={{
        padding: '12px 16px',
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ fontWeight: 600, color: '#1f2937', fontSize: 12 }}>Add Link</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <select value={source} onChange={(event) => setSource(event.target.value)} style={selectStyle}>
          <option value="">From...</option>
          {elementIds.map((id) => (
            <option key={id} value={id}>
              {elements[id].label}
            </option>
          ))}
        </select>
        <select value={target} onChange={(event) => setTarget(event.target.value)} style={selectStyle}>
          <option value="">To...</option>
          {elementIds.map((id) => (
            <option key={id} value={id}>
              {elements[id].label}
            </option>
          ))}
        </select>
        <button
          onClick={handleAdd}
          style={{
            padding: '8px 14px',
            backgroundColor: PRIMARY,
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}

// --- Main Component ---

function Main() {
  const elements = useElements<NodeData>();
  const links = useLinks();

  return (
    <div style={{ display: 'flex', flexDirection: 'row', height: 500, position: 'relative' }}>
      {/* Canvas */}
      <Paper
        width="100%"
        className={PAPER_CLASSNAME}
        height={500}
        renderElement={RenderElement}
        defaultRouter={{ name: 'normal' }}
        defaultConnector={{ name: 'rounded', args: { radius: 10 } }}
      />

      {/* Control Panel - Glassmorphism Style */}
      <div
        style={{
          position: 'absolute',
          right: 16,
          top: 16,
          bottom: 16,
          width: 260,
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        <div
          style={{
            padding: '16px 16px 12px',
            borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
            fontSize: 13,
            fontWeight: 700,
            color: '#1f2937',
            letterSpacing: '-0.01em',
          }}
        >
          Cell Actions
        </div>

        {/* Add forms */}
        <AddElementForm />
        <AddLinkForm />

        {/* Element Controls */}
        <div
          style={{
            padding: '10px 16px',
            backgroundColor: 'rgba(0, 0, 0, 0.03)',
            fontSize: 11,
            fontWeight: 600,
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Nodes ({Object.keys(elements).length})
        </div>
        {Object.entries(elements).map(([id, element]) => (
          <ElementControls key={id} id={id} element={element} />
        ))}

        {/* Link Controls */}
        <div
          style={{
            padding: '10px 16px',
            backgroundColor: 'rgba(0, 0, 0, 0.03)',
            fontSize: 11,
            fontWeight: 600,
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Links ({Object.keys(links).length})
        </div>
        {Object.entries(links).map(([id, link]) => (
          <LinkControls key={id} id={id} link={link} />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <GraphProvider elements={initialElements} links={initialLinks}>
      <Main />
    </GraphProvider>
  );
}
