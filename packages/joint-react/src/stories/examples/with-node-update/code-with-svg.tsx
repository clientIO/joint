/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import {
  createElements,
  createLinks,
  GraphProvider,
  Paper,
  useElements,
  useSetElement,
  type InferElement,
} from '@joint/react';
import '../index.css';
import { LIGHT, PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';

const initialElements = createElements([
  { id: '1', data: { color: PRIMARY }, x: 100, y: 0, width: 130, height: 35 },
  { id: '2', data: { color: PRIMARY }, x: 100, y: 200, width: 130, height: 35 },
]);
const initialEdges = createLinks([
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    attrs: {
      line: {
        stroke: LIGHT,
      },
    },
  },
]);

type BaseElementWithData = InferElement<typeof initialElements>;

function ElementInput({ id, data }: BaseElementWithData) {
  const { color } = data;
  const setElement = useSetElement(id, 'data');
  return (
    <input
      className="nodrag"
      type="color"
      value={color}
      onChange={(event) => setElement({ ...data, color: event.target.value })}
    />
  );
}

function RenderElement({ data: { color }, width, height }: BaseElementWithData) {
  return <rect rx={10} ry={10} className="node" width={width} height={height} fill={color} />;
}

function Main() {
  const elements = useElements<BaseElementWithData>();
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper width="100%" className={PAPER_CLASSNAME} height={280} renderElement={RenderElement} />
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
