import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import { shapes, dia } from '@joint/core';
import '../index.css';
import {
  type CellJSONInit,
  GraphProvider,
  useCell,
  Paper,
  type ElementRecord,
  type RenderElement,
  useCells,
  ElementModel,
  selectElementSize,
  useGraph,
} from '@joint/react';
import { useCallback, useMemo } from 'react';

// ============================================================================
// Types
// ============================================================================

const SECONDARY = '#6366f1';

/**
 * Element user data: raw JointJS cell JSON — nested `position`/`size`,
 * with custom properties (`label`, `color`) at the top level.
 * The mapper is near-identity.
 */
interface ElementData {
  readonly [key: string]: unknown;
  readonly label: string;
  readonly color: string;
}

// ============================================================================
// Data
// ============================================================================

const initialCells: readonly CellJSONInit[] = [
  {
    id: 'node-1',
    position: { x: 70, y: 100 },
    size: { width: 160, height: 60 },
    type: 'MyElementModel',
    data: {
      label: 'Node 1',
      color: PRIMARY,
    },
  },
  {
    id: 'node-2',
    position: { x: 370, y: 70 },
    size: { width: 160, height: 60 },
    type: 'MyElementModel',
    data: {
      label: 'Node 2',
      color: SECONDARY,
    },
  },
  {
    id: 'node-3',
    position: { x: 220, y: 250 },
    size: { width: 160, height: 60 },
    type: 'MyElementModel',
    data: {
      label: 'Node 3',
      color: '#10b981',
    },
  },
  {
    id: 'link-1',
    type: 'standard.Link',
    source: { id: 'node-1' },
    target: { id: 'node-2' },
    labels: [{ attrs: { text: { text: 'Link 1' } } }],
  },
  {
    id: 'link-2',
    type: 'standard.Link',
    source: { id: 'node-1' },
    target: { id: 'node-3' },
    labels: [{ attrs: { text: { text: 'Link 1' } } }],
  },
];

// ============================================================================
// Element Shape
// ============================================================================

function ElementShape({ label, color }: Readonly<ElementData>) {
  const { width, height } = useCell(selectElementSize);
  return (
    <>
      <rect
        rx={8}
        ry={8}
        width={width}
        height={height}
        fill={color}
        stroke="#333"
        strokeWidth={2}
      />
      <text
        x={width / 2}
        y={height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontSize={14}
        fontWeight="bold"
      >
        {label}
      </text>
    </>
  );
}

// ============================================================================
// Data Panel — shows live raw cell JSON
// ============================================================================

function DataPanel() {
  const { isElement } = useGraph<ElementRecord<ElementData>>();
  const elements = useCells((cells): Array<[string, ElementRecord<ElementData>]> => {
    const result: Array<[string, ElementRecord<ElementData>]> = [];
    for (const cell of cells) {
      if (isElement(cell)) {
        result.push([String(cell.id), cell as ElementRecord<ElementData>]);
      }
    }
    return result;
  });
  return (
    <div className="p-4 min-w-[200px] text-sm font-mono">
      <h3 className="text-base font-bold mb-3">Cell JSON Data</h3>
      {elements.map(([id, element]) => (
        <div key={id} className="mb-3 p-2 rounded bg-gray-800">
          <div className="font-bold mb-1">{element.data.label}</div>
          <div>
            position: {'{'}x: {Math.round(element.position?.x ?? 0)}, y:{' '}
            {Math.round(element.position?.y ?? 0)}
            {'}'}
          </div>
          <div className="text-gray-400 text-xs mt-1">
            size: {element.size?.width ?? 0} &times; {element.size?.height ?? 0}
          </div>
          <div className="text-gray-400 text-xs">type: {element.type}</div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Main
// ============================================================================

const PAPER_STYLE = { flex: 1 };

function Main() {
  const renderElement: RenderElement<ElementData> = useCallback(
    (data) => (data ? <ElementShape {...data} /> : null),
    []
  );
  return (
    <div className="flex w-full h-full">
      <Paper
        className={PAPER_CLASSNAME}
        height={400}
        renderElement={renderElement}
        style={PAPER_STYLE}
      />
      <DataPanel />
    </div>
  );
}

// ============================================================================
// App
// ============================================================================

export default function App() {
  const graph = useMemo(() => {
    return new dia.Graph(
      {},
      {
        cellNamespace: {
          ...shapes,
          MyElementModel: ElementModel,
        },
      }
    );
  }, []);
  return (
    <GraphProvider graph={graph} initialCells={initialCells}>
      <Main />
    </GraphProvider>
  );
}
