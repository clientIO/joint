/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import { type CellRecord, GraphProvider, HTMLBox, Paper, useCellId, type ElementRecord } from '@joint/react';
import '../index.css';
import { PRIMARY, LIGHT, PAPER_CLASSNAME, SECONDARY } from 'storybook-config/theme';
import { useGraph } from '@joint/react';

interface NodeData {
  readonly [key: string]: unknown;
  readonly label: string;
  readonly color: string;
}

const initialCells: ReadonlyArray<CellRecord<NodeData>> = [
  {
    id: '1',
    type: 'element',
    data: { label: 'Node 1', color: PRIMARY },
    position: { x: 100, y: 15 },
    size: { width: 100, height: 50 },
  },
  {
    id: '2',
    type: 'element',
    data: { label: 'Node 2', color: SECONDARY },
    position: { x: 100, y: 200 },
    size: { width: 100, height: 50 },
  },
  {
    id: 'e1-2',
    type: 'link',
    source: { id: '1' },
    target: { id: '2' },
    color: LIGHT,
  },
];

function RenderElement({ color }: Readonly<NodeData>) {
  const id = useCellId();
  const { setCell, isElement } = useGraph<ElementRecord<NodeData>>();
  return (
    <HTMLBox useModelGeometry
      style={{ backgroundColor: color }}
      className="node"
    >
      <input
        className="nodrag"
        type="color"
        onChange={(event) => {
          setCell(id, (previous) => {
            if (!isElement(previous)) return previous;
            return {
              ...previous,
              data: { ...(previous.data ?? { label: '', color: '#ffffff' }), color: event.target.value },
            };
          });
        }}
        defaultValue={color}
      />
    </HTMLBox>
  );
}
function Main() {
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper className={PAPER_CLASSNAME} height={280} renderElement={RenderElement} />
    </div>
  );
}

export default function WithColor() {
  return (
    <GraphProvider initialCells={initialCells}>
      <Main />
    </GraphProvider>
  );
}
