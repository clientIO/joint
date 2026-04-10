import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import '../index.css';
import {
  GraphProvider,
  Paper,
  useElements,
  type ElementRecord,
  type LinkRecord,
} from '@joint/react';

// ============================================================================
// Types
// ============================================================================

/**
 * Element user data uses center position (cx, cy) instead of
 * JointJS's top-left position (x, y).
 * The cx/cy values are derived from position + size for display purposes.
 */
interface CenterElement {
  readonly label: string;
}

// ============================================================================
// Data
// ============================================================================

/**
 * Initial elements store standard top-left position. The DataPanel derives
 * center coordinates (cx, cy) from position + size for display.
 */
const initialElements: Record<string, ElementRecord<CenterElement>> = {
  'node-1': {
    data: { label: 'Node One' },
    position: { x: 70, y: 100 },
    size: { width: 160, height: 60 },
  },
  'node-2': {
    data: { label: 'Node Two' },
    position: { x: 370, y: 70 },
    size: { width: 160, height: 60 },
  },
  'node-3': {
    data: { label: 'Node Three' },
    position: { x: 220, y: 250 },
    size: { width: 160, height: 60 },
  },
};

const initialLinks: Record<string, LinkRecord> = {
  'link-1': {
    source: { id: 'node-1' },
    target: { id: 'node-2' },
    color: PRIMARY,
  },
  'link-2': {
    source: { id: 'node-1' },
    target: { id: 'node-3' },
    color: PRIMARY,
  },
};

// ============================================================================
// Data Panel — shows live cx/cy values
// ============================================================================

function DataPanel() {
  const elements = useElements<CenterElement>();
  return (
    <div className="p-4 min-w-50 text-sm font-mono">
      <h3 className="text-base font-bold mb-3">Element Data (cx, cy)</h3>
      {[...elements.entries()].map(([id, { data, position, size }]) => {
        const x = position?.x ?? 0;
        const y = position?.y ?? 0;
        const width = size?.width ?? 100;
        const height = size?.height ?? 60;
        return (
          <div key={id} className="mb-3 p-2 rounded bg-gray-800">
            <div className="font-bold mb-1">{data?.label}</div>
            <div>cx: {Math.round(x + width / 2)}</div>
            <div>cy: {Math.round(y + height / 2)}</div>
            <div className="text-gray-400 text-xs mt-1">
              {width} &times; {height}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Main
// ============================================================================

const PAPER_STYLE = { flex: 1 };

function Main() {
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
    >
      <Main />
    </GraphProvider>
  );
}
