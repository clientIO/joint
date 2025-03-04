/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { Paper } from '../../../components/paper/paper';
import { createElements, createLinks, type InferElement } from '../../../utils/create';
import { GraphProvider, type GraphProps } from '../../../components/graph-provider/graph-provider';
import '../index.css';
// define initial elements
const initialElements = createElements([
  { id: '1', data: { label: 'hello' }, x: 100, y: 0, width: 100, height: 25 },
  { id: '2', data: { label: 'world' }, x: 100, y: 200, width: 100, height: 25 },
]);

// define initial edges
const initialEdges = createLinks([{ id: 'e1-2', source: '1', target: '2' }]);

// infer element type from the initial elements (this type can be used for later usage like RenderItem props)
type CustomElement = InferElement<typeof initialElements>;

function RenderItem({ width, height, data: { label } }: CustomElement) {
  return (
    <foreignObject style={{ overflow: 'unset' }} width={width} height={height}>
      <div className="node">{label}</div>
    </foreignObject>
  );
}

function Main() {
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper width={400} height={280} renderElement={RenderItem} />
    </div>
  );
}

export default function App(props: Readonly<GraphProps>) {
  return (
    <GraphProvider {...props} defaultLinks={initialEdges} defaultElements={initialElements}>
      <Main />
    </GraphProvider>
  );
}
