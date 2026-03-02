/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import { PAPER_CLASSNAME, PRIMARY, SECONDARY } from 'storybook-config/theme';
import { type dia } from '@joint/core';
import '../index.css';
import {
  GraphProvider,
  Paper,
  useElement,
  useElements,
  useGraph,
  type GraphElement,
  type RenderElement,
} from '@joint/react';
import { useCallback, useEffect, useState } from 'react';

// ============================================================================
// Types
// ============================================================================

interface EmbeddingElement extends GraphElement {
  readonly label: string;
  readonly color: string;
}

// ============================================================================
// Data
// ============================================================================

const initialElements: Record<string, EmbeddingElement> = {
  container: {
    x: 50,
    y: 50,
    width: 300,
    height: 200,
    label: 'Container',
    color: PRIMARY,
    z: 1,
  },
  child: {
    x: 100,
    y: 100,
    width: 120,
    height: 60,
    label: 'Drag me',
    color: SECONDARY,
    z: 2,
    parent: 'container',
  },
};

// ============================================================================
// Element Shape
// ============================================================================

function ElementShape({ label, color }: Readonly<EmbeddingElement>) {
  const { width = 120, height = 60 } = useElement<EmbeddingElement>();
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
  const graph = useGraph();
  const [attributes, setAttributes] = useState(() => snapshot(graph));
  useEffect(() => {
    const update = () => setAttributes(snapshot(graph));
    graph.on('change', update);
    return () => {
      graph.off('change', update);
    };
  }, [graph]);
  return attributes;
}

// ============================================================================
// Tabbed Inspector Panel
// ============================================================================

type Tab = 'data' | 'cell';

function InspectorPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('data');
  const elements = useElements<EmbeddingElement>();
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

function ElementDataView({
  elements,
}: Readonly<{ elements: Record<string, EmbeddingElement> }>) {
  return (
    <>
      <h3 className="text-base font-bold mb-3">useElements() Data</h3>
      {Object.entries(elements).map(([id, element]) => (
        <div key={id} className="mb-3 p-2 rounded bg-gray-800">
          <div className="font-bold mb-1">{id}</div>
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

function Main() {
  const renderElement: RenderElement<EmbeddingElement> = useCallback(
    (props) => <ElementShape {...props} />,
    []
  );
  return (
    <div className="flex w-full h-full">
      <Paper
        className={PAPER_CLASSNAME}
        height={400}
        renderElement={renderElement}
        style={PAPER_STYLE}
        embeddingMode
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
    <GraphProvider elements={initialElements}>
      <Main />
    </GraphProvider>
  );
}
