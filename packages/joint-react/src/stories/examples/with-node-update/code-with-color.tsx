/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import {
  createElements,
  createLinks,
  GraphProvider,
  Paper,
  useSetElement,
  type InferElement,
} from '@joint/react';
import '../index.css';
import { PRIMARY, LIGHT, PAPER_CLASSNAME } from 'storybook-config/theme';
import { HTMLNode } from 'storybook-config/decorators/with-simple-data';

const initialElements = createElements([
  { id: '1', label: 'Node 1', color: PRIMARY, x: 100, y: 0 },
  { id: '2', label: 'Node 2', color: PRIMARY, x: 100, y: 200 },
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

function RenderElement({ color, id }: BaseElementWithData) {
  const setColor = useSetElement<BaseElementWithData>(id, 'color');
  return (
    <HTMLNode
      style={{
        backgroundColor: color,
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
          setColor(event.target.value);
        }}
        defaultValue={color}
      />
    </HTMLNode>
  );
}
function Main() {
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper width="100%" className={PAPER_CLASSNAME} height={280} renderElement={RenderElement} />
    </div>
  );
}

export default function WithColor() {
  return (
    <GraphProvider initialElements={initialElements} initialLinks={initialEdges}>
      <Main />
    </GraphProvider>
  );
}
