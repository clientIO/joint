import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import '../index.css';
import {
  GraphProvider,
  Paper,
  useElements,
  flatElementDataToAttributes,
  flatAttributesToElementData,
  type CellAttributes,
  type FlatElementData,
  type FlatLinkData,
  type ToElementAttributesOptions,
  type ToElementDataOptions,
  type RenderElement,
} from '@joint/react';
import { useCallback } from 'react';

// ============================================================================
// Types
// ============================================================================

const SECONDARY = '#6366f1';

/**
 * Element user data uses center position (cx, cy) instead of
 * JointJS's top-left position (x, y).
 */
interface CenterElement {
  readonly [key: string]: unknown;
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

const initialElements: Record<string, FlatElementData<CenterElement>> = {
  'node-1': {
    data: { cx: 150, cy: 130, width: 160, height: 60, label: 'Node 1', color: PRIMARY },
    width: 160,
    height: 60,
  },
  'node-2': {
    data: { cx: 450, cy: 100, width: 160, height: 60, label: 'Node 2', color: SECONDARY },
    width: 160,
    height: 60,
  },
  'node-3': {
    data: { cx: 300, cy: 280, width: 160, height: 60, label: 'Node 3', color: '#10b981' },
    width: 160,
    height: 60,
  },
};

const initialLinks: Record<string, FlatLinkData> = {
  'link-1': {
    source: 'node-1',
    target: 'node-2',
    color: PRIMARY,
  },
  'link-2': {
    source: 'node-1',
    target: 'node-3',
    color: PRIMARY,
  },
};

// ============================================================================
// Custom Mapper: center position (cx, cy) ↔ top-left position (x, y)
// ============================================================================

/**
 * Forward mapper: converts center-based data to JointJS top-left position.
 */
const mapDataToElementAttributes = ({
  data,
}: ToElementAttributesOptions<FlatElementData<CenterElement>>): CellAttributes => {
  const input = data as FlatElementData<CenterElement>;
  const userData = (input.data ?? {}) as CenterElement;
  const { cx = 0, cy = 0, width = 100, height = 60 } = userData;
  return flatElementDataToAttributes({
    data: userData,
    x: cx - width / 2,
    y: cy - height / 2,
    width,
    height,
  });
};

/**
 * Reverse mapper: converts JointJS top-left position back to center-based data.
 */
const mapElementAttributesToData = ({
  attributes,
}: ToElementDataOptions<FlatElementData<CenterElement>>): FlatElementData<CenterElement> => {
  const result = flatAttributesToElementData(attributes);
  const userData = (result.data ?? {}) as Record<string, unknown>;
  const x = (attributes.position?.x ?? 0) as number;
  const y = (attributes.position?.y ?? 0) as number;
  const width = (attributes.size?.width ?? 100) as number;
  const height = (attributes.size?.height ?? 60) as number;
  // Wrap center-based coords + user data in `data` field for useElementData()
  return {
    data: { ...userData, cx: x + width / 2, cy: y + height / 2, width, height },
    width,
    height,
  } as FlatElementData<CenterElement>;
};

// ============================================================================
// Element Shape
// ============================================================================

function ElementShape({ label, color, width = 160, height = 60 }: Readonly<CenterElement>) {
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
      {[...elements.entries()].map(([id, element]) => (
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
