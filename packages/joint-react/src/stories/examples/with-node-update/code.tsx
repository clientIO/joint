/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import '../index.css';
import { useSetElement } from '../../../hooks/use-set-element';
import { useElements } from '../../../hooks/use-elements';
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

function ElementInput({ id, data }: BaseElementWithData) {
  const { label } = data;
  const setElement = useSetElement<BaseElementWithData>(id, 'data');
  return (
    <input value={label} onChange={(event) => setElement({ ...data, label: event.target.value })} />
  );
}

function RenderElement({ data: { label } }: BaseElementWithData) {
  return <HTMLNode className="node">{label}</HTMLNode>;
}

function Main() {
  const elements = useElements<BaseElementWithData>();
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper width={400} renderElement={RenderElement} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {elements.map((item) => {
          return <ElementInput key={item.id} {...item} />;
        })}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <GraphProvider defaultElements={initialElements} defaultLinks={initialEdges}>
      <Main />
    </GraphProvider>
  );
}
