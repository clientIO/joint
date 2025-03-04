/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import type { Meta, StoryObj } from '@storybook/react/*';
import type { InferElement } from '../../utils/create';
import { createElements, createLinks } from '../../utils/create';
import './index.css';
import { useState } from 'react';
import { Highlighter } from '../../components/highlighters';
import { GraphProvider } from '../../components/graph-provider/graph-provider';
import { Paper } from '../../components/paper/paper';

export type Story = StoryObj<typeof GraphProvider>;
const meta: Meta<typeof GraphProvider> = {
  title: 'Examples/With highlighter',
  component: GraphProvider,
};
export default meta;

const initialElements = createElements([
  {
    id: '1',
    data: { label: 'Node 1' },
    x: 100,
    y: 50,
    width: 100,
    height: 50,
  },
  { id: '2', data: { label: 'Node 1' }, x: 100, y: 200, width: 100, height: 50 },
]);

const initialEdges = createLinks([{ id: 'e1-2', source: '1', target: '2' }]);

type BaseElementWithData = InferElement<typeof initialElements>;

function RenderItemWithChildren({ data: { label }, height, width }: BaseElementWithData) {
  const [isHighlighted, setIsHighlighted] = useState(true);
  return (
    <g
      width={width}
      height={height}
      onClick={() => setIsHighlighted(!isHighlighted)}
      joint-selector={'body'}
      className="node"
    >
      <rect width={width} height={height} fill="yellow" />
      {label}
      <Highlighter.Mask opacity={0.7} strokeWidth={10} stroke={isHighlighted ? 'orange' : 'cyan'}>
        <rect width={width / 2} height={height / 2} x={width / 4} y={height / 4} fill="pink" />
      </Highlighter.Mask>
    </g>
  );
}
function Main() {
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper width={400} renderElement={RenderItemWithChildren} />
    </div>
  );
}
export const Default: Story = {
  args: {
    defaultElements: initialElements,
    defaultLinks: initialEdges,
  },
  render: (props) => {
    return (
      <GraphProvider {...props}>
        <Main />
      </GraphProvider>
    );
  },
};
