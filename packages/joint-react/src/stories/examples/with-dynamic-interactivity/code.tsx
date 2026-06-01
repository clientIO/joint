import { useCallback, useMemo, useState } from 'react';
import {
  type CellRecord,
  GraphProvider,
  Paper,
  useCells,
  useGraph,
} from '@joint/react';
import { BUTTON_CLASSNAME, PAPER_CLASSNAME } from 'storybook-config/theme';

import '../index.css';

// ============================================================================
// Data
// ============================================================================

interface NodeData {
  readonly label: string;
}

const SIZE = { width: 140, height: 50 };

type PaperInteraction = Pick<
  React.ComponentProps<typeof Paper>,
  'interactive' |
  'onElementPointerClick' | 'onBlankPointerClick' |
  'onElementMouseEnter' | 'onElementMouseLeave'
>;

const initialCells: ReadonlyArray<CellRecord<NodeData>> = [
  { id: 'a', type: 'element', data: { label: 'Source' }, position: { x: 60, y: 60 }, size: SIZE },
  { id: 'b', type: 'element', data: { label: 'Process' }, position: { x: 300, y: 60 }, size: SIZE },
  { id: 'c', type: 'element', data: { label: 'Sink' }, position: { x: 540, y: 60 }, size: SIZE },
  { id: 'a→b', type: 'link', source: { id: 'a' }, target: { id: 'b' }, style: { targetMarker: 'arrow' } },
  { id: 'b→c', type: 'link', source: { id: 'b' }, target: { id: 'c' }, style: { targetMarker: 'arrow' } },
];

// ============================================================================
// Property Editor — visible only in edit mode
// ============================================================================

interface PropertyEditorProps {
  readonly selectedId: string | null;
}

function PropertyEditor({ selectedId }: Readonly<PropertyEditorProps>) {
  const { setCell } = useGraph<CellRecord<NodeData>>();
  const label = useCells<CellRecord<NodeData>, string>(
    selectedId ?? '',
    (cell) => (cell?.type === 'element' ? cell.data?.label ?? '' : '')
  );

  const onChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!selectedId) return;
      const next = event.target.value;
      setCell(selectedId, (previous) => {
        const element = previous as CellRecord<NodeData> & { readonly type: 'element' };
        return { ...element, data: { ...element.data, label: next } };
      });
    },
    [selectedId, setCell]
  );

  return (
    <aside className="w-full bg-white border border-gray-200 rounded-lg shadow-md text-sm text-gray-800 overflow-hidden">
      <header className="px-4 py-2 border-b border-gray-200 bg-gray-50 font-semibold text-gray-700">
        Property Editor
      </header>
      <div className="p-4">
        {selectedId ? (
          <>
            <label className="block mb-1 text-xs font-medium text-gray-500 uppercase tracking-wide">Label</label>
            <input
              value={label}
              onChange={onChange}
              className="w-full px-2 py-1.5 rounded border border-gray-300 bg-white text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <div className="mt-3 text-xs text-gray-400">id: {selectedId}</div>
          </>
        ) : (
          <div className="text-gray-400 italic">Click an element to edit it.</div>
        )}
      </div>
    </aside>
  );
}

// ============================================================================
// Main
// ============================================================================

function Main() {
  const [editMode, setEditMode] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const toggleMode = useCallback(() => {
    setEditMode((previous) => {
      const next = !previous;
      if (!next) setSelectedId(null);
      return next;
    });
  }, []);

  // Edit mode: select & edit elements. View mode: read-only, hover for info.
  const interactivity = useMemo<PaperInteraction>(() => {
    if (editMode) {
      return {
        interactive: true,
        onElementPointerClick: ({ id }) => setSelectedId(String(id)),
        onBlankPointerClick: () => setSelectedId(null),
      };
    }
    return {
      interactive: false,
      onElementMouseEnter: ({ id, model }) => {
        const data = model.get('data') as NodeData | undefined;
        setHovered(data?.label ?? String(id));
      },
      onElementMouseLeave: () => setHovered(null),
    };
  }, [editMode]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <button type="button" onClick={toggleMode} className={BUTTON_CLASSNAME}>
          {editMode ? 'Edit mode' : 'View mode'}
        </button>
        <span className="text-xs opacity-70">
          Toggle to switch <code>interactive</code> live. Edit: drag &amp; click to edit. View: read-only, hover for info.
        </span>
      </div>

      <div className="flex">
        <div className="flex-1 relative">
          <Paper
            className={PAPER_CLASSNAME + ' h-[300px]'}
            {...interactivity}
          />
          {!editMode && hovered && (
            <div className="absolute top-2 right-2 px-3 py-1 rounded-md bg-white border border-gray-200 shadow-md text-xs font-medium text-gray-700 pointer-events-none">
              Hovering: {hovered}
            </div>
          )}
        </div>
        {editMode && (
          <div className="w-64 shrink-0 ml-3">
            <PropertyEditor selectedId={selectedId} />
          </div>
        )}
      </div>
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
