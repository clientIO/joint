/* eslint-disable react-perf/jsx-no-new-object-as-prop */

import type { Meta, StoryObj } from '@storybook/react/*';
import { GraphProvider } from '../../components/graph-provider';
import type { RenderElement } from '../../components/paper';
import { Paper } from '../../components/paper';
import { HtmlElement } from '../../components/html-element';
import { useCallback } from 'react';
import type { InferElement } from '../../utils/create';
import { createElements, createLinks } from '../../utils/create';
import './index.css';

export type Story = StoryObj<typeof GraphProvider>;
const meta: Meta<typeof GraphProvider> = {
  title: 'Examples/With minimap',
  component: GraphProvider,
};
export default meta;

const initialElements = createElements([
  { id: '1', data: { label: 'Node 1' }, x: 100, y: 0, width: 100, height: 50 },
  { id: '2', data: { label: 'Node 2' }, x: 100, y: 200, width: 100, height: 50 },
]);
const initialEdges = createLinks([{ id: 'e1-2', source: '1', target: '2' }]);

type BaseElementWithData = InferElement<typeof initialElements>;

function RenderElement(props: BaseElementWithData) {
  return <HtmlElement className="node">{props.data.label}</HtmlElement>;
}
function MiniMap() {
  const renderElement: RenderElement<BaseElementWithData> = useCallback(
    (element) => <rect width={element.width} height={element.height} fill="gray" radius={10} />,
    []
  );
  return (
    <div className="minimap">
      <Paper
        interactive={false}
        scale={0.4}
        width={'100%'}
        height={'100%'}
        renderElement={renderElement}
      />
    </div>
  );
}
function Main() {
  const renderElement: RenderElement<BaseElementWithData> = useCallback(
    (element) => <HtmlElement className="node">{element.data.label}</HtmlElement>,
    []
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper width={400} renderElement={renderElement} />
      <MiniMap />
    </div>
  );
}
export const Basic: Story = {
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
