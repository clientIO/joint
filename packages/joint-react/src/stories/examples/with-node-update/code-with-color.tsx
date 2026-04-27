/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import {
  GraphProvider,
  HTMLBox,
  Paper,
  useCellId,
  type Cells,
  type ElementRecord,
} from '@joint/react';
import '../index.css';
import { PRIMARY, LIGHT, PAPER_CLASSNAME, SECONDARY } from 'storybook-config/theme';
import { useGraph } from '@joint/react';

interface NodeData {
  readonly [key: string]: unknown;
  readonly label: string;
  readonly color: string;
}

const initialCells: Cells<NodeData> = [
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

function RenderElement({ color }: NodeData) {
  const id = useCellId();
  const { setCell } = useGraph<NodeData>();
  return (
    <HTMLBox useModelGeometry
      style={{ backgroundColor: color }}
      className="node"
    >
      <input
        className="nodrag"
        type="color"
        onChange={(event) => {
          setCell((previous) => {
            const previousElement = previous as ElementRecord<NodeData>;
            return {
              ...previousElement,
              id,
              data: { ...(previousElement.data ?? { label: '', color: '#ffffff' }), color: event.target.value },
            } as ElementRecord<NodeData>;
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
