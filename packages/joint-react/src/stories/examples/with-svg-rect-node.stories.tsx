/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { useCallback } from 'react';
import type { InferElement } from '../../utils/create';
import { createElements, createLinks } from '../../utils/create';
import './index.css';
import type { Meta, StoryObj } from '@storybook/react/*';
import { useUpdateNodeSize } from '../../hooks/use-update-node-size';
import { GraphProvider, Paper, type RenderElement } from '../../../src';

export type Story = StoryObj<typeof GraphProvider>;
const meta: Meta<typeof GraphProvider> = {
  title: 'Examples/With SVG Rect node',
  component: GraphProvider,
};

export default meta;

const initialEdges = createLinks([{ id: 'e1-2', source: '1', target: '2' }]);

const initialElements = createElements([
  { id: '1', data: { label: 'Node 1' }, x: 100, y: 0 },
  { id: '2', data: { label: 'Node 2' }, x: 100, y: 200 },
]);

type BaseElementWithData = InferElement<typeof initialElements>;

function RenderedRect() {
  const rectRef = useUpdateNodeSize<SVGRectElement>();
  return <rect ref={rectRef} joint-selector="fo" width={50} height={50} fill="red" />;
}

function Main() {
  const renderElement: RenderElement<BaseElementWithData> = useCallback(() => <RenderedRect />, []);
  return (
    <div style={{ display: 'flex', flexDirection: 'row', position: 'relative' }}>
      <Paper width={400} renderElement={renderElement} />
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
        }}
      ></div>
    </div>
  );
}

export const WithSizeDefinedInRect: Story = {
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

const initialElementsWithSize = createElements([
  { id: '1', data: { label: 'Node 1' }, x: 100, y: 0, width: 50, height: 50 },
  { id: '2', data: { label: 'Node 2' }, x: 100, y: 200, width: 100, height: 100 },
]);

type BaseElementWithDataAndSize = InferElement<typeof initialElementsWithSize>;
function MainWithSize() {
  const renderElement: RenderElement<BaseElementWithDataAndSize> = useCallback(
    ({ width, height }) => <rect joint-selector="fo" width={width} height={height} fill="red" />,
    []
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'row', position: 'relative' }}>
      <Paper width={400} renderElement={renderElement} />
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
        }}
      ></div>
    </div>
  );
}

export const WithSizeDefinedInData: Story = {
  args: {
    defaultElements: initialElementsWithSize,
    defaultLinks: initialEdges,
  },
  render: (props) => {
    return (
      <GraphProvider {...props}>
        <MainWithSize />
      </GraphProvider>
    );
  },
};
