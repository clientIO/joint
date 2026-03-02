import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import type { dia } from '@joint/core';
import '../index.css';
import {
  GraphProvider,
  Paper,
  useElement,
  useElements,
  type GraphElement,
  type GraphLink,
  type ElementToGraphOptions,
  type GraphToElementOptions,
  type RenderElement,
} from '@joint/react';
import { useCallback } from 'react';

// ============================================================================
// Types
// ============================================================================

const SECONDARY = '#6366f1';

/**
 * Element data uses center position (cx, cy) instead of
 * JointJS's top-left position (x, y).
 */
interface CenterElement extends GraphElement {
  readonly cx: number;
  readonly cy: number;
  readonly width: number;
  readonly height: number;
  readonly label: string;
  readonly color: string;
}

// ============================================================================
// Data
// ============================================================================

const initialElements: Record<string, CenterElement> = {
  'node-1': {
    cx: 150,
    cy: 130,
    width: 160,
    height: 60,
    label: 'Node 1',
    color: PRIMARY,
  },
  'node-2': {
    cx: 450,
    cy: 100,
    width: 160,
    height: 60,
    label: 'Node 2',
    color: SECONDARY,
  },
  'node-3': {
    cx: 300,
    cy: 280,
    width: 160,
    height: 60,
    label: 'Node 3',
    color: '#10b981',
  },
};

const initialLinks: Record<string, GraphLink> = {
  'link-1': {
    source: 'node-1',
    target: 'node-2',
  },
  'link-2': {
    source: 'node-1',
    target: 'node-3',
  },
};

// ============================================================================
// Custom Mapper: center position (cx, cy) ↔ top-left position (x, y)
// ============================================================================

/**
 * Forward mapper: converts center-based data to JointJS top-left position.
 */
const mapDataToElementAttributes = ({
  data, toAttributes,
}: ElementToGraphOptions<GraphElement>): dia.Cell.JSON => {
  const { cx, cy, width = 100, height = 60, ...rest } = data as CenterElement;
  return toAttributes({ ...rest, x: cx - width / 2, y: cy - height / 2, width, height });
};

/**
 * Reverse mapper: converts JointJS top-left position back to center-based data.
 */
const mapElementAttributesToData = ({
  toData,
}: GraphToElementOptions<GraphElement>): GraphElement => {
  const { x = 0, y = 0, width = 100, height = 60, ...rest } = toData();
  return { ...rest, cx: x + width / 2, cy: y + height / 2, width, height };
};

// ============================================================================
// Element Shape
// ============================================================================

function ElementShape({ label, color }: Readonly<CenterElement>) {
  const { width = 160, height = 60 } = useElement<CenterElement>();
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
// Data Panel — shows live cx/cy values
// ============================================================================

function DataPanel() {
  const elements = useElements<CenterElement>();
  return (
    <div className="p-4 min-w-[200px] text-sm font-mono">
      <h3 className="text-base font-bold mb-3">Element Data (cx, cy)</h3>
      {Object.entries(elements).map(([id, element]) => (
        <div key={id} className="mb-3 p-2 rounded bg-gray-800">
          <div className="font-bold mb-1">{element.label}</div>
          <div>cx: {Math.round(element.cx)}</div>
          <div>cy: {Math.round(element.cy)}</div>
          <div className="text-gray-400 text-xs mt-1">
            {element.width} &times; {element.height}
          </div>
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
  const renderElement: RenderElement<CenterElement> = useCallback(
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
      />
      <DataPanel />
    </div>
  );
}

// ============================================================================
// App
// ============================================================================

export default function App() {
  return (
    <GraphProvider
      elements={initialElements}
      links={initialLinks}
      mapDataToElementAttributes={mapDataToElementAttributes}
      mapElementAttributesToData={mapElementAttributesToData}
    >
      <Main />
    </GraphProvider>
  );
}
