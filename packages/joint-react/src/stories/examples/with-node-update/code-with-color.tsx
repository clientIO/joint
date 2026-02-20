/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import { GraphProvider, Paper, useCellId, type GraphLink } from '@joint/react';
import '../index.css';
import { PRIMARY, LIGHT, PAPER_CLASSNAME } from 'storybook-config/theme';
import { HTMLNode } from 'storybook-config/decorators/with-simple-data';
import { useCellActions } from '../../../hooks/use-cell-actions';

const initialElements: Record<
  string,
  { label: string; color: string; x: number; y: number; width: number; height: number }
> = {
  '1': { label: 'Node 1', color: PRIMARY, x: 100, y: 0, width: 100, height: 50 },
  '2': { label: 'Node 2', color: PRIMARY, x: 100, y: 200, width: 100, height: 50 },
};

const initialEdges: Record<string, GraphLink> = {
  'e1-2': {
    source: '1',
    target: '2',
    color: LIGHT,
  },
};

type BaseElementWithData = (typeof initialElements)[string];

function RenderElement({ color }: Readonly<BaseElementWithData>) {
  const id = useCellId();
  const { set } = useCellActions<BaseElementWithData>();
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
          set(id, (previous) => ({ ...previous, color: event.target.value }));
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
