import { useCallback, useMemo, useState, type ChangeEvent, type ComponentProps } from 'react';
import {
  type CellRecord,
  GraphProvider,
  HTMLBox,
  Paper,
  type RenderElement,
  useCellId,
  useCells,
  useGraph,
} from '@joint/react';

interface NodeData {
  readonly label: string;
}

const SIZE = { width: 140, height: 50 };

// Colors — unified dark diagram palette.
const LINK_COLOR = '#8697A6';

const LINK_STYLE = { color: LINK_COLOR, targetMarker: 'arrow' } as const;

const initialCells: ReadonlyArray<CellRecord<NodeData>> = [
  { id: 'a', type: 'element', data: { label: 'Source' }, position: { x: 60, y: 60 }, size: SIZE },
  { id: 'b', type: 'element', data: { label: 'Process' }, position: { x: 300, y: 60 }, size: SIZE },
  { id: 'c', type: 'element', data: { label: 'Sink' }, position: { x: 540, y: 60 }, size: SIZE },
  { id: 'a→b', type: 'link', source: { id: 'a' }, target: { id: 'b' }, style: LINK_STYLE },
  { id: 'b→c', type: 'link', source: { id: 'b' }, target: { id: 'c' }, style: LINK_STYLE },
];

type PaperInteraction = Pick<
  ComponentProps<typeof Paper>,
  'interactive' | 'onElementPointerClick' | 'onBlankPointerClick' | 'onElementMouseEnter' | 'onElementMouseLeave'
>;

interface NodeBodyProps {
  readonly label: string;
  readonly selectedId: string | null;
}

function NodeBody({ label, selectedId }: Readonly<NodeBodyProps>) {
  const isSelected = String(useCellId()) === selectedId;
  return <HTMLBox className={isSelected ? 'jj-node jj-node--active' : 'jj-node'}>{label}</HTMLBox>;
}

interface LabelEditorProps {
  readonly selectedId: string | null;
}

function LabelEditor({ selectedId }: Readonly<LabelEditorProps>) {
  const { setCell } = useGraph<CellRecord<NodeData>>();
  const label = useCells<CellRecord<NodeData>, string>(selectedId, (cell) =>
    cell?.type === 'element' ? cell.data?.label ?? '' : ''
  );

  const onChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (!selectedId) return;
      const next = event.target.value;
      setCell(selectedId, (previous) => {
        const element = previous as CellRecord<NodeData> & { readonly type: 'element' };
        return { ...element, data: { ...element.data, label: next } };
      });
    },
    [selectedId, setCell]
  );

  if (!selectedId) {
    return <span className="jj-chip">Select a node to edit</span>;
  }

  return (
    <label className="jj-field">
      <span className="jj-label">Label</span>
      <input className="jj-input w-40" value={label} onChange={onChange} />
    </label>
  );
}

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

  // Edit mode: select and edit elements. View mode: read-only, hover for info.
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

  const renderElement: RenderElement<NodeData> = useCallback(
    (data) => <NodeBody label={data.label} selectedId={selectedId} />,
    [selectedId]
  );

  return (
    <div className="flex size-full flex-col">
      <div className="jj-controls m-3">
        <button type="button" className="jj-btn jj-btn--primary" onClick={toggleMode}>
          {editMode ? 'Edit mode' : 'View mode'}
        </button>
        {editMode ? (
          <LabelEditor selectedId={selectedId} />
        ) : (
          <span className="jj-chip">{hovered ? `Hovering ${hovered}` : 'Hover a node for info'}</span>
        )}
        <span className="jj-label">
          {editMode ? 'Drag and click nodes to edit them.' : 'Read-only — interactive is off.'}
        </span>
      </div>
      <Paper className="min-h-0 flex-1" renderElement={renderElement} {...interactivity} />
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
