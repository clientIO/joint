import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import type { dia } from '@joint/core';
import '../index.css';
import {
  GraphProvider,
  Paper,
  useElements,
  elementToAttributes,
  attributesToElement,
  type CellAttributes,
  type FlatElementData,
  type FlatLinkData,
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
    data: { cx: 150, cy: 130, label: 'Node One' },
    width: 160,
    height: 60,
  },
  'node-2': {
    data: { cx: 450, cy: 100, label: 'Node Two' },
    width: 160,
    height: 60,
  },
  'node-3': {
    data: { cx: 300, cy: 280, label: 'Node Three' },
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
  const userData = (data.data ?? {}) as CenterElement;
  const { cx = 0, cy = 0 } = userData;
  const { width = 100, height = 60 } = data;
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
const mapAttributesToElement = (
  attributes: dia.Element.Attributes
): FlatElementData<CenterElement> => {
  const result = attributesToElement(attributes);
  const userData = (result.data ?? {}) as Record<string, unknown>;
  const x = attributes.position?.x ?? 0;
  const y = attributes.position?.y ?? 0;
  const width = attributes.size?.width ?? 100;
  const height = attributes.size?.height ?? 60;
  // Wrap center-based coords + user data in `data` field for useElementData()
  return {
    data: { ...userData, cx: x + width / 2, cy: y + height / 2 },
    width,
    height,
  } as FlatElementData<CenterElement>;
};

// ============================================================================
// Data Panel — shows live cx/cy values
// ============================================================================

function DataPanel() {
  const elements = useElements<CenterElement>();
  return (
    <div className="p-4 min-w-[200px] text-sm font-mono">
      <h3 className="text-base font-bold mb-3">Element Data (cx, cy)</h3>
      {[...elements.entries()].map(([id, { data, size }]) => (
        <div key={id} className="mb-3 p-2 rounded bg-gray-800">
          <div className="font-bold mb-1">{data.label}</div>
          <div>cx: {Math.round(data.cx)}</div>
          <div>cy: {Math.round(data.cy)}</div>
          <div className="text-gray-400 text-xs mt-1">
            {size.width} &times; {size.height}
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
      <Paper className={PAPER_CLASSNAME} height={400} style={PAPER_STYLE} />
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
      mapElementToAttributes={mapElementToAttributes}
      mapAttributesToElement={mapAttributesToElement}
    >
      <Main />
    </GraphProvider>
  );
}
