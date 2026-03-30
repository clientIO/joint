/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import { useState } from 'react';
import {
  GraphProvider,
  Paper,
  useGraph,
  HTMLHost,
  type ElementRecord,
  type LinkRecord,
  useElements,
  useLinks,
} from '@joint/react';
import '../index.css';
import { PAPER_CLASSNAME, PRIMARY, LIGHT } from 'storybook-config/theme';

const SECONDARY = '#6366f1';
const DARK = '#111827';

type NodeData = {
  readonly label: string;
  readonly color: string;
  readonly [key: string]: unknown;
};

const initialElements: Record<string, ElementRecord<NodeData>> = {
  '1': {
    data: { label: 'Node A', color: PRIMARY },
    position: { x: 50, y: 50 },
    size: { width: 120, height: 60 },
  },
  '2': {
    data: { label: 'Node B', color: SECONDARY },
    position: { x: 250, y: 50 },
    size: { width: 120, height: 60 },
  },
  '3': {
    data: { label: 'Node C', color: PRIMARY },
    position: { x: 150, y: 180 },
    size: { width: 120, height: 60 },
  },
};

const initialLinks: Record<string, LinkRecord> = {
  'link-1-2': {
    source: { id: '1' },
    target: { id: '2' },
    color: DARK,
  },
  'link-1-3': {
    source: { id: '1' },
    target: { id: '3' },
    color: DARK,
  },
};

// --- Node Component ---

function RenderElement({ label, color }: Readonly<NodeData>) {
  return (
    <HTMLHost
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
    </HTMLHost>
  );
}

// --- Control Panel Components ---

interface ElementControlsProps {
  readonly id: string;
  readonly element?: NodeData;
  readonly position?: { x?: number; y?: number };
  readonly size?: { width?: number; height?: number };
  readonly angle?: number;
}

function ElementControls({
  id,
  element,
  position,
  size: layout,
  angle,
}: Readonly<ElementControlsProps>) {
  const { setElement, removeElement } = useGraph<NodeData>();
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
  if (!element) {
    return null;
  }

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
        <span style={{ fontWeight: 400, color: '#9ca3af', marginLeft: 6, fontSize: 11 }}>
          #{id}
        </span>
      </div>

      {/* Label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <label style={{ width: 45, fontSize: 11, color: '#6b7280', fontWeight: 500 }}>Label</label>
        <input
          type="text"
          value={element.label}
          onChange={(event) =>
            setElement(id, (previous) => ({
              ...previous,
              data: { ...previous.data!, label: event.target.value },
            } as ElementRecord<NodeData>))
          }
          style={{ ...inputStyle, flex: 1 }}
        />
      </div>

      {/* Color */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <label style={{ width: 45, fontSize: 11, color: '#6b7280', fontWeight: 500 }}>Color</label>
        <input
          type="color"
          value={element.color}
          onChange={(event) =>
            setElement(id, (previous) => ({
              ...previous,
              data: { ...previous.data!, color: event.target.value },
            } as ElementRecord<NodeData>))
          }
          style={{
            width: 36,
            height: 28,
            border: 'none',
            cursor: 'pointer',
            borderRadius: 6,
            padding: 0,
          }}
        />
      </div>

      {/* Position */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <label style={{ width: 45, fontSize: 11, color: '#6b7280', fontWeight: 500 }}>Pos</label>
        <input
          type="number"
          value={position?.x ?? 0}
          onChange={(event) =>
            setElement(id, (previous) => ({
              ...previous,
              position: { x: Number(event.target.value), y: previous.position?.y ?? 0 },
            }))
          }
          style={{ ...inputStyle, width: 65 }}
          placeholder="X"
        />
        <input
          type="number"
          value={position?.y ?? 0}
          onChange={(event) =>
            setElement(id, (previous) => ({
              ...previous,
              position: { x: previous.position?.x ?? 0, y: Number(event.target.value) },
            }))
          }
          style={{ ...inputStyle, width: 65 }}
          placeholder="Y"
        />
      </div>

      {/* Size */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <label style={{ width: 45, fontSize: 11, color: '#6b7280', fontWeight: 500 }}>Size</label>
        <input
          type="number"
          value={layout?.width ?? 0}
          onChange={(event) =>
            setElement(id, (previous) => ({
              ...previous,
              size: { width: Number(event.target.value), height: previous.size?.height ?? 0 },
            }))
          }
          style={{ ...inputStyle, width: 65 }}
          placeholder="W"
        />
        <input
          type="number"
          value={layout?.height ?? 0}
          onChange={(event) =>
            setElement(id, (previous) => ({
              ...previous,
              size: { width: previous.size?.width ?? 0, height: Number(event.target.value) },
            }))
          }
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
          value={angle ?? 0}
          onChange={(event) =>
            setElement(id, (previous) => ({ ...previous, angle: Number(event.target.value) }))
          }
          style={{ flex: 1, accentColor: PRIMARY }}
        />
        <span style={{ fontSize: 11, width: 32, color: '#6b7280' }}>{angle ?? 0}°</span>
      </div>

      {/* Remove */}
      <button
        onClick={() => removeElement(id)}
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

function getLinkEndpointId(endpoint: LinkRecord['source']): string {
  return String(endpoint?.id ?? 'unknown');
}

interface LinkControlsProps {
  readonly id: string;
  readonly link: LinkRecord;
}

function LinkControls({ id, link }: Readonly<LinkControlsProps>) {
  const { setLink, removeLink } = useGraph();
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
            setLink(id, (previous) => ({
              ...previous,
              color: event.target.value,
            }))
          }
          style={{
            width: 36,
            height: 28,
            border: 'none',
            cursor: 'pointer',
            borderRadius: 6,
            padding: 0,
          }}
        />
      </div>

      {/* Remove */}
      <button
        onClick={() => removeLink(id)}
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
  const { setElement } = useGraph<NodeData>();
  const elements = useElements();
  const [label, setLabel] = useState('');

  const handleAdd = () => {
    if (!label.trim()) return;

    const existingIds = [...elements.keys()]
      .map(Number)
      .filter((numberValue) => !Number.isNaN(numberValue));
    const newId = String(Math.max(0, ...existingIds) + 1);

    // eslint-disable-next-line sonarjs/pseudo-random -- Random position for demo purposes
    const randomX = 50 + Math.random() * 200;
    // eslint-disable-next-line sonarjs/pseudo-random -- Random position for demo purposes
    const randomY = 50 + Math.random() * 150;

    setElement(newId, {
      data: { label: label.trim(), color: PRIMARY },
      position: { x: randomX, y: randomY },
      size: { width: 120, height: 60 },
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
  const { setLink } = useGraph();
  const elements = useElements();
  const [source, setSource] = useState('');
  const [target, setTarget] = useState('');

  const elementIds = [...elements.keys()];

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
    setLink(newId, {
      source: { id: source },
      target: { id: target },
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
        <select
          value={source}
          onChange={(event) => setSource(event.target.value)}
          style={selectStyle}
        >
          <option value="">From...</option>
          {elementIds.map((id) => (
            <option key={id} value={id}>
              {(elements.get(id)?.data as NodeData | undefined)?.label}
            </option>
          ))}
        </select>
        <select
          value={target}
          onChange={(event) => setTarget(event.target.value)}
          style={selectStyle}
        >
          <option value="">To...</option>
          {elementIds.map((id) => (
            <option key={id} value={id}>
              {(elements.get(id)?.data as NodeData | undefined)?.label}
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
const DEFAULT_ROUTER = { name: 'normal' };
const DEFAULT_CONNECTOR = { name: 'rounded', args: { radius: 10 } };
function Main() {
  const elements = useElements<NodeData>();
  const links = useLinks();
  return (
    <div style={{ display: 'flex', flexDirection: 'row', height: 500, position: 'relative' }}>
      {/* Canvas */}
      <Paper
        className={PAPER_CLASSNAME}
        height={500}
        renderElement={RenderElement}
        defaultRouter={DEFAULT_ROUTER}
        defaultConnector={DEFAULT_CONNECTOR}
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
          Nodes ({elements.size})
        </div>
        {[...elements.entries()].map(([id, element]) => (
          <ElementControls
            key={id}
            id={id}
            element={element.data}
            position={element.position}
            size={element.size}
            angle={element.angle}
          />
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
          Links ({links.size})
        </div>
        {[...links.entries()].map(([id, link]) => (
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
