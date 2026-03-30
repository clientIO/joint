/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import { GraphProvider, Paper, useElementId, type ElementRecord, type LinkRecord } from '@joint/react';
import '../index.css';
import { PRIMARY, LIGHT, PAPER_CLASSNAME } from 'storybook-config/theme';
import { HTMLNode } from 'storybook-config/decorators/with-simple-data';
import { useGraph } from '@joint/react';

interface NodeData {
  readonly [key: string]: unknown;
  readonly label: string;
  readonly color: string;
}

const initialElements: Record<string, ElementRecord<NodeData>> = {
  '1': {
    data: { label: 'Node 1', color: PRIMARY },
    position: { x: 100, y: 15 },
    size: { width: 100, height: 50 },
  },
  '2': {
    data: { label: 'Node 2', color: PRIMARY },
    position: { x: 100, y: 200 },
    size: { width: 100, height: 50 },
  },
};

const initialEdges: Record<string, LinkRecord> = {
  'e1-2': {
    source: { id: '1' },
    target: { id: '2' },
    color: LIGHT,
  },
};

function RenderElement({ color }: Readonly<NodeData>) {
  const id = useElementId();
  const { setElement } = useGraph<NodeData>();
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
          setElement(id, (previous) => ({
            ...previous,
            data: { ...(previous.data as unknown as NodeData), color: event.target.value },
          }));
        }}
        defaultValue={color}
      />
    </HTMLNode>
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
    <GraphProvider elements={initialElements} links={initialEdges}>
      <Main />
    </GraphProvider>
  );
}
