import { useCallback, type ChangeEvent } from 'react';
import {
  type CellRecord,
  type Computed,
  type ElementRecord,
  GraphProvider,
  Paper,
  useCells,
  useGraph,
} from '@joint/react';

interface NodeData {
  readonly label: string;
}

type NodeElement = ElementRecord<NodeData>;
type ResolvedNodeElement = Computed<NodeElement>;

const initialCells: ReadonlyArray<CellRecord<NodeData>> = [
  { id: '1', type: 'element', data: { label: 'Node 1' }, position: { x: 100, y: 15 } },
  { id: '2', type: 'element', data: { label: 'Node 2' }, position: { x: 100, y: 200 } },
  { id: 'e1-2', type: 'link', source: { id: '1' }, target: { id: '2' } },
];

function LabelEditor({ id, label }: Readonly<{ id: string; label: string }>) {
  const { setCell, isElement } = useGraph<NodeElement>();
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const next = event.target.value;
      setCell(id, (previous) => {
        if (!isElement(previous)) return previous;
        return { ...previous, data: { ...previous.data, label: next } };
      });
    },
    [id, isElement, setCell]
  );
  return (
    <label className="jj-field">
      <span className="jj-label">{id}</span>
      <input className="jj-input w-full" value={label} onChange={handleChange} />
    </label>
  );
}

function Main() {
  const { isElement } = useGraph<NodeElement>();
  const elements = useCells<ResolvedNodeElement, readonly ResolvedNodeElement[]>((cells) =>
    cells.filter((cell) => isElement(cell))
  );
  return (
    <div className="flex size-full flex-row">
      <Paper className="min-w-0 flex-1" />
      <div className="flex w-56 flex-col gap-2 p-3">
        {elements.map((element) => (
          <LabelEditor key={String(element.id)} id={String(element.id)} label={element.data.label} />
        ))}
      </div>
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
