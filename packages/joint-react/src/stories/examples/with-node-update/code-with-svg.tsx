/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import { GraphProvider, Paper, useElements, useElementSize, type FlatElementData, type FlatLinkData } from '@joint/react';
import '../index.css';
import { LIGHT, PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import { useGraph } from '@joint/react';

interface NodeData {
  readonly [key: string]: unknown;
  readonly color: string;
}

const initialElements: Record<string, FlatElementData<NodeData>> = {
  '1': { data: { color: PRIMARY }, x: 100, y: 15, width: 130, height: 35 },
  '2': { data: { color: PRIMARY }, x: 100, y: 200, width: 130, height: 35 },
};

const initialEdges: Record<string, FlatLinkData> = {
  'e1-2': {
    source: '1',
    target: '2',
    color: LIGHT,
  },
};

function ElementInput({ id, color }: Readonly<{ id: string; color: string }>) {
  const { setElement } = useGraph();
  return (
    <input
      className="nodrag"
      type="color"
      value={color}
      onChange={(event) => setElement(id, (previous) => ({ ...previous, data: { ...previous.data as NodeData, color: event.target.value } }))}
    />
  );
}

function RenderElement({ color }: Readonly<NodeData>) {
  const { width, height } = useElementSize();
  return <rect rx={10} ry={10} className="node" width={width} height={height} fill={color} />;
}

function Main() {
  const elements = useElements<NodeData>();
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper className={PAPER_CLASSNAME} height={280} renderElement={RenderElement} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {[...elements.entries()].map(([id, item]) => {
          return <ElementInput key={id} id={id} color={item.color} />;
        })}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <GraphProvider elements={initialElements} links={initialEdges}>
      <Main />
    </GraphProvider>
  );
}
