/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import { GraphProvider, Paper, useElements, type GraphLink } from '@joint/react';
import '../index.css';
import { LIGHT, PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import { useCellActions } from '../../../hooks/use-cell-actions';

const initialElements: Record<string, { color: string; x: number; y: number; width: number; height: number }> = {
  '1': { color: PRIMARY, x: 100, y: 0, width: 130, height: 35 },
  '2': { color: PRIMARY, x: 100, y: 200, width: 130, height: 35 },
};

const initialEdges: Record<string, GraphLink> = {
  'e1-2': {
    source: '1',
    target: '2',
    color: LIGHT,
  },
};

type BaseElementWithData = (typeof initialElements)[string];

interface ElementInputProps extends BaseElementWithData {
  readonly id: string;
}

function ElementInput({ id, color }: Readonly<ElementInputProps>) {
  const { set } = useCellActions<BaseElementWithData>();
  return (
    <input
      className="nodrag"
      type="color"
      value={color}
      onChange={(event) => set(id, (previous) => ({ ...previous, color: event.target.value }))}
    />
  );
}

function RenderElement({ color, width, height }: Readonly<BaseElementWithData>) {
  return <rect rx={10} ry={10} className="node" width={width} height={height} fill={color} />;
}

function Main() {
  const elements = useElements<BaseElementWithData>();
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper width="100%" className={PAPER_CLASSNAME} height={280} renderElement={RenderElement} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {Object.entries(elements).map(([id, item]) => {
          return <ElementInput key={id} id={id} {...item} />;
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
