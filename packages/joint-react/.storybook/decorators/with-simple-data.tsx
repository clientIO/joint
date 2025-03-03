/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */

import { JSX, PropsWithChildren } from 'react';
import { createElements, createLinks, GraphProvider, InferElement, Paper } from '../../src';

const initialElements = createElements([
  {
    id: '1',
    data: { label: 'Node 1' },
    x: 100,
    y: 20,
    width: 100,
    height: 50,
  },
  {
    id: '2',
    data: { label: 'Node 2' },
    x: 200,
    y: 250,
    width: 100,
    height: 50,
  },
]);

export type SimpleElement = InferElement<typeof initialElements>;
const defaultLinks = createLinks([{ id: 'e1-2', source: '1', target: '2' }]);

function SimpleGraphProviderDecorator({ children }: PropsWithChildren) {
  return (
    <GraphProvider defaultElements={initialElements} defaultLinks={defaultLinks}>
      {children}
    </GraphProvider>
  );
}

export function SimpleGraphDecorator(Story: any) {
  return (
    <SimpleGraphProviderDecorator>
      <Story />
    </SimpleGraphProviderDecorator>
  );
}

export function RenderItemDecorator(properties: {
  renderElement: (element: SimpleElement) => JSX.Element;
}) {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <SimpleGraphProviderDecorator>
        <Paper width={'100%'} height={'100%'} renderElement={properties.renderElement} />
      </SimpleGraphProviderDecorator>
    </div>
  );
}

export function SimpleRenderItemDecorator(Story: any) {
  return <RenderItemDecorator renderElement={Story} />;
}
