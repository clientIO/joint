/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import '../index.css';
import { useSetElement } from '../../../hooks/use-set-element';
import type { InferElement } from '../../../utils/create';
import { createElements, createLinks } from '../../../utils/create';
import { GraphProvider } from '../../../components/graph-provider/graph-provider';
import { HTMLNode } from '../../../components/html-node/html-node';
import { Paper } from '../../../components/paper/paper';

const initialElements = createElements([
  { id: '1', data: { label: 'Node 1', color: '#ffffff' }, x: 100, y: 0 },
  { id: '2', data: { label: 'Node 2', color: '#ffffff' }, x: 100, y: 200 },
]);
const initialEdges = createLinks([{ id: 'e1-2', source: '1', target: '2' }]);

type BaseElementWithData = InferElement<typeof initialElements>;

function RenderElement({ data, id }: BaseElementWithData) {
  const setElement = useSetElement<BaseElementWithData>(id, 'data');
  return (
    <HTMLNode
      style={{
        backgroundColor: data.color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      className="node"
    >
      <input
        className="nodrag"
        type="color"
        onChange={(event) => {
          setElement({ ...data, color: event.target.value });
        }}
        defaultValue={data.color}
      />
    </HTMLNode>
  );
}
function Main() {
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper width={400} renderElement={RenderElement} />
    </div>
  );
}

export default function WithColor() {
  return (
    <GraphProvider defaultElements={initialElements} defaultLinks={initialEdges}>
      <Main />
    </GraphProvider>
  );
}
