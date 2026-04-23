/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import { useState } from 'react';
import {
  GraphProvider,
  Paper,
  useGraph,
  HTMLHost,
  useCells,
  type Cells,
  type ElementRecord,
  type LinkRecord,
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

const initialCells: Cells<NodeData> = [
  {
    id: '1',
    type: 'ElementModel',
    data: { label: 'Node A', color: PRIMARY },
    position: { x: 50, y: 50 },
    size: { width: 120, height: 60 },
  },
  {
    id: '2',
    type: 'ElementModel',
    data: { label: 'Node B', color: SECONDARY },
    position: { x: 250, y: 50 },
    size: { width: 120, height: 60 },
  },
  {
    id: '3',
    type: 'ElementModel',
    data: { label: 'Node C', color: PRIMARY },
    position: { x: 150, y: 180 },
    size: { width: 120, height: 60 },
  },
  {
    id: 'link-1-2',
    type: 'LinkModel',
    source: { id: '1' },
    target: { id: '2' },
    color: DARK,
  },
  {
    id: 'link-1-3',
    type: 'LinkModel',
    source: { id: '1' },
    target: { id: '3' },
    color: DARK,
  },
];

// --- Node Component ---

function RenderElement(element: Readonly<ElementRecord<NodeData>>) {
  const { label = '', color = PRIMARY } = element.data ?? {};
  return (
    <HTMLHost
      useModelGeometry
      style={{
        overflow: 'auto',
        backgroundColor: color,
        borderRadius: 8,
        color: 'white',
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
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
  const { setCell, removeCell } = useGraph<NodeData>();
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
            setCell((previous) => {
              const previousElement = previous as ElementRecord<NodeData>;
              const data = previousElement.data as NodeData | undefined;
              if (!data) {
                return { ...previousElement, id } as ElementRecord<NodeData>;
              }
              return {
                ...previousElement,
                id,
                data: { ...data, label: event.target.value },
              } as ElementRecord<NodeData>;
            })
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
            setCell((previous) => {
              const previousElement = previous as ElementRecord<NodeData>;
              const data = previousElement.data as NodeData | undefined;
              if (!data) {
                return { ...previousElement, id } as ElementRecord<NodeData>;
              }
              return {
                ...previousElement,
                id,
                data: { ...data, color: event.target.value },
              } as ElementRecord<NodeData>;
            })
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
            setCell((previous) => {
              const previousElement = previous as ElementRecord<NodeData>;
              return {
                ...previousElement,
                id,
                position: { x: Number(event.target.value), y: previousElement.position?.y ?? 0 },
              } as ElementRecord<NodeData>;
            })
          }
          style={{ ...inputStyle, width: 65 }}
          placeholder="X"
        />
        <input
          type="number"
          value={position?.y ?? 0}
          onChange={(event) =>
            setCell((previous) => {
              const previousElement = previous as ElementRecord<NodeData>;
              return {
                ...previousElement,
                id,
                position: { x: previousElement.position?.x ?? 0, y: Number(event.target.value) },
              } as ElementRecord<NodeData>;
            })
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
            setCell((previous) => {
              const previousElement = previous as ElementRecord<NodeData>;
              return {
                ...previousElement,
                id,
                size: { width: Number(event.target.value), height: previousElement.size?.height ?? 0 },
              } as ElementRecord<NodeData>;
            })
          }
          style={{ ...inputStyle, width: 65 }}
          placeholder="W"
        />
        <input
          type="number"
          value={layout?.height ?? 0}
          onChange={(event) =>
            setCell((previous) => {
              const previousElement = previous as ElementRecord<NodeData>;
              return {
                ...previousElement,
                id,
                size: { width: previousElement.size?.width ?? 0, height: Number(event.target.value) },
              } as ElementRecord<NodeData>;
            })
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
            setCell({ id, angle: Number(event.target.value) } as ElementRecord<NodeData>)
          }
          style={{ flex: 1, accentColor: PRIMARY }}
        />
        <span style={{ fontSize: 11, width: 32, color: '#6b7280' }}>{angle ?? 0}°</span>
      </div>

      {/* Remove */}
      <button
        onClick={() => removeCell(id)}
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
  const { setCell, removeCell } = useGraph();
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
            setCell({ id, type: 'LinkModel', color: event.target.value } as LinkRecord)
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
        onClick={() => removeCell(id)}
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
  const { addCell } = useGraph<NodeData>();
  const elementIds = useCells<NodeData, unknown, string[]>((cells) =>
    cells.filter((c) => c.type === 'ElementModel').map((c) => String(c.id))
  );
  const [label, setLabel] = useState('');

  const handleAdd = () => {
    if (!label.trim()) return;

    const existingIds = elementIds
      .map(Number)
      .filter((numberValue) => !Number.isNaN(numberValue));
    const newId = String(Math.max(0, ...existingIds) + 1);

    // eslint-disable-next-line sonarjs/pseudo-random -- Random position for demo purposes
    const randomX = 50 + Math.random() * 200;
    // eslint-disable-next-line sonarjs/pseudo-random -- Random position for demo purposes
    const randomY = 50 + Math.random() * 150;

    addCell({
      id: newId,
      type: 'ElementModel',
      data: { label: label.trim(), color: PRIMARY },
      position: { x: randomX, y: randomY },
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
  const { addCell } = useGraph<NodeData>();
  const elements = useCells<NodeData, unknown, Array<[string, ElementRecord<NodeData>]>>((cells) => {
    const result: Array<[string, ElementRecord<NodeData>]> = [];
    for (const cell of cells) {
      if (cell.type === 'ElementModel') {
        result.push([String(cell.id), cell as ElementRecord<NodeData>]);
      }
    }
    return result;
  });
  const [source, setSource] = useState('');
  const [target, setTarget] = useState('');

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
    addCell({
      id: newId,
      type: 'LinkModel',
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
          {elements.map(([id, element]) => (
            <option key={id} value={id}>
              {element.data?.label}
            </option>
          ))}
        </select>
        <select
          value={target}
          onChange={(event) => setTarget(event.target.value)}
          style={selectStyle}
        >
          <option value="">To...</option>
          {elements.map(([id, element]) => (
            <option key={id} value={id}>
              {element.data?.label}
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
  const cells = useCells<NodeData>();
  const elements: Array<[string, ElementRecord<NodeData>]> = [];
  const links: Array<[string, LinkRecord]> = [];
  for (const cell of cells) {
    if (cell.type === 'ElementModel') {
      elements.push([String(cell.id), cell as ElementRecord<NodeData>]);
    } else if (cell.type === 'LinkModel') {
      links.push([String(cell.id), cell as LinkRecord]);
    }
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'row', height: 500, position: 'relative' }}>
      {/* Canvas */}
      <Paper
        className={PAPER_CLASSNAME}
        height={500}
        renderElement={RenderElement}
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
          Nodes ({elements.length})
        </div>
        {elements.map(([id, element]) => (
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
          Links ({links.length})
        </div>
        {links.map(([id, link]) => (
          <LinkControls key={id} id={id} link={link} />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <GraphProvider<NodeData> initialCells={initialCells}>
      <Main />
    </GraphProvider>
  );
}
