import type { dia } from '@joint/core';
import {
  type CellRecord,
  type Computed,
  type ElementRecord,
  GraphProvider,
  HTMLBox,
  Paper,
  useCells,
  useGraph,
  useOnGraphEvents,
} from '@joint/react';
import { useCallback, useState } from 'react';

type Data = { readonly label: string };

const initialCells: ReadonlyArray<CellRecord<Data>> = [
  {
    id: 'container',
    type: 'element',
    data: { label: 'Container' },
    position: { x: 50, y: 50 },
    size: { width: 300, height: 200 },
    z: 1,
  },
  {
    id: 'child',
    type: 'element',
    data: { label: 'Drag me' },
    position: { x: 100, y: 180 },
    size: { width: 120, height: 60 },
    z: 2,
    parent: 'container',
  },
];

const EXCLUDED_KEYS = new Set(['attrs', 'markup']);

/** Read every element's raw JointJS attributes, skipping bulky render data. */
function snapshot(graph: dia.Graph): Record<string, Record<string, unknown>> {
  const result: Record<string, Record<string, unknown>> = {};
  for (const cell of graph.getElements()) {
    const filtered: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(cell.attributes)) {
      if (!EXCLUDED_KEYS.has(key)) filtered[key] = value;
    }
    result[cell.id] = filtered;
  }
  return result;
}

/** Keep a live view of the raw cell attributes, refreshed on every graph change. */
function useRawAttributes(): Record<string, Record<string, unknown>> {
  const { graph } = useGraph();
  const [attributes, setAttributes] = useState(() => snapshot(graph));
  useOnGraphEvents(graph, { change: () => setAttributes(snapshot(graph)) });
  return attributes;
}

function ElementDataView({
  elements,
}: Readonly<{ elements: ReadonlyArray<Computed<ElementRecord<Data>>> }>) {
  return (
    <>
      <h3 className="mb-3 text-base font-bold">useCells() elements</h3>
      {elements.map((element) => (
        <div key={String(element.id)} className="mb-3 rounded bg-gray-800/70 p-2">
          <div className="mb-1 font-bold">{String(element.id)}</div>
          <pre className="whitespace-pre-wrap text-xs text-gray-300">
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
      <h3 className="mb-3 text-base font-bold">cell.attributes</h3>
      {Object.entries(rawAttributes).map(([id, attributes]) => (
        <div key={id} className="mb-3 rounded bg-gray-800/70 p-2">
          <div className="mb-1 font-bold">{id}</div>
          <pre className="whitespace-pre-wrap text-xs text-gray-300">
            {JSON.stringify(attributes, null, 2)}
          </pre>
        </div>
      ))}
    </>
  );
}

type Tab = 'data' | 'cell';

function InspectorPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('data');
  const cells = useCells();
  const elements = cells.filter(
    (cell): cell is Computed<ElementRecord<Data>> => cell.type === 'element'
  );
  const rawAttributes = useRawAttributes();

  const showData = useCallback(() => setActiveTab('data'), []);
  const showCell = useCallback(() => setActiveTab('cell'), []);

  return (
    <div className="flex h-full w-72 shrink-0 flex-col overflow-hidden border-l border-white/10 bg-gray-900 text-sm text-white">
      <div className="jj-controls m-3">
        <button
          type="button"
          className={`jj-btn jj-btn--sm ${activeTab === 'data' ? 'jj-btn--primary' : ''}`}
          onClick={showData}
        >
          Data
        </button>
        <button
          type="button"
          className={`jj-btn jj-btn--sm ${activeTab === 'cell' ? 'jj-btn--primary' : ''}`}
          onClick={showCell}
        >
          Cell attributes
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-3 pb-3 font-mono">
        {activeTab === 'data' ? (
          <ElementDataView elements={elements} />
        ) : (
          <CellAttributesView rawAttributes={rawAttributes} />
        )}
      </div>
    </div>
  );
}

function RenderElement({ label }: Readonly<Data>) {
  return (
    <HTMLBox className="jj-node" useModelGeometry>
      {label}
    </HTMLBox>
  );
}

function Main() {
  return (
    <div className="flex size-full">
      <Paper className="min-w-0 flex-1" embeddingMode renderElement={RenderElement} />
      <InspectorPanel />
    </div>
  );
}

export default function App() {
  return (
    <GraphProvider initialCells={initialCells}>
      <Main />
    </GraphProvider>
  );
}
