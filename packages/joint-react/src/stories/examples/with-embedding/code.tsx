/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import { PAPER_CLASSNAME } from 'storybook-config/theme';
import { type dia } from '@joint/core';
import '../index.css';
import {
  HTMLBox,
  GraphProvider,
  Paper,
  useCells,
  useGraph,
  useGraphEvents,
  type Cells,
  type ElementRecord,
} from '@joint/react';
import { useState } from 'react';

// ============================================================================
// Data
// ============================================================================
type Data = { label: string };
const initialCells: Cells<Data> = [
  {
    id: 'container',
    type: 'element',
    data: {
      label: 'Container',
    },
    position: { x: 50, y: 50 },
    size: { width: 300, height: 200 },
    z: 1,
  },
  {
    id: 'child',
    type: 'element',
    data: {
      label: 'Drag me',
    },
    position: { x: 100, y: 180 },
    size: { width: 120, height: 60 },
    z: 2,
    parent: 'container',
  },
];

// ============================================================================
// Raw Cell Attributes Hook
// ============================================================================

const EXCLUDED_KEYS = new Set(['attrs', 'markup']);

function snapshot(graph: dia.Graph) {
  const result: Record<string, Record<string, unknown>> = {};
  for (const cell of graph.getElements()) {
    const filtered: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(cell.attributes)) {
      if (!EXCLUDED_KEYS.has(key)) {
        filtered[key] = value;
      }
    }
    result[cell.id] = filtered;
  }
  return result;
}

function useRawAttributes() {
  const { graph } = useGraph();
  const [attributes, setAttributes] = useState(() => snapshot(graph));
  useGraphEvents(graph, { change: () => setAttributes(snapshot(graph)) });
  return attributes;
}

// ============================================================================
// Tabbed Inspector Panel
// ============================================================================

type Tab = 'data' | 'cell';

function InspectorPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('data');
  const cells = useCells<Data>();
  const elements = cells.filter(
    (cell): cell is ElementRecord<Data> => cell.type === 'element'
  );
  const rawAttributes = useRawAttributes();

  return (
    <div className="p-4 min-w-[260px] text-sm font-mono">
      {/* Tabs */}
      <div className="flex mb-3 gap-1">
        <button
          className={`px-3 py-1 rounded text-xs font-bold cursor-pointer ${
            activeTab === 'data'
              ? 'bg-gray-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
          onClick={() => setActiveTab('data')}
        >
          Data
        </button>
        <button
          className={`px-3 py-1 rounded text-xs font-bold cursor-pointer ${
            activeTab === 'cell'
              ? 'bg-gray-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
          onClick={() => setActiveTab('cell')}
        >
          Cell Attributes
        </button>
      </div>

      {/* Content */}
      {activeTab === 'data' ? (
        <ElementDataView elements={elements} />
      ) : (
        <CellAttributesView rawAttributes={rawAttributes} />
      )}
    </div>
  );
}

function ElementDataView({ elements }: Readonly<{ elements: ReadonlyArray<ElementRecord<Data>> }>) {
  return (
    <>
      <h3 className="text-base font-bold mb-3">useCells() Elements</h3>
      {elements.map((element) => (
        <div key={String(element.id)} className="mb-3 p-2 rounded bg-gray-800">
          <div className="font-bold mb-1">{String(element.id)}</div>
          <pre className="text-xs text-gray-300 whitespace-pre-wrap">
            {JSON.stringify(element, null, 2)}
          </pre>
        </div>
      ))}
    </>
  );
}

function CellAttributesView({
  rawAttributes,
}: Readonly<{ rawAttributes: Record<string, Record<string, unknown>> }>) {
  return (
    <>
      <h3 className="text-base font-bold mb-3">cell.attributes</h3>
      {Object.entries(rawAttributes).map(([id, attributes]) => (
        <div key={id} className="mb-3 p-2 rounded bg-gray-800">
          <div className="font-bold mb-1">{id as string}</div>
          <pre className="text-xs text-gray-300 whitespace-pre-wrap">
            {JSON.stringify(attributes, null, 2)}
          </pre>
        </div>
      ))}
    </>
  );
}

// ============================================================================
// Main
// ============================================================================

const PAPER_STYLE = { flex: 1 };

function RenderElement(data: Data) {
  return <HTMLBox useModelGeometry>{data.label}</HTMLBox>;
}

function Main() {
  return (
    <div className="flex w-full h-full">
      <Paper className={PAPER_CLASSNAME} style={PAPER_STYLE} embeddingMode
        renderElement={RenderElement}
      />
      <InspectorPanel />
    </div>
  );
}

// ============================================================================
// App
// ============================================================================

export default function App() {
  return (
    <GraphProvider initialCells={initialCells}>
      <Main />
    </GraphProvider>
  );
}
