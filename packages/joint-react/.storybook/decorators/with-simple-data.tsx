/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */

import { JSX, PropsWithChildren } from 'react';
import { createElements, createLinks, GraphProvider, InferElement, Paper } from '../../src';

const initialElements = createElements([
  {
    id: '1',
    data: { label: 'Node 1', color: 'cyan' },
    x: 100,
    y: 20,
    width: 100,
    height: 50,
  },
  {
    id: '2',
    data: { label: 'Node 2', color: 'magenta' },
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
    <div style={{ width: '100%', height: 350 }}>
      <SimpleGraphProviderDecorator>
        <Paper width={'100%'} height={350} renderElement={properties.renderElement} />
      </SimpleGraphProviderDecorator>
    </div>
  );
}

function RenderSimpleRectElement(properties: SimpleElement) {
  const {
    width,
    data: { color },
    height,
  } = properties;
  return <rect width={width} height={height} fill={color} />;
}

export function RenderPaperWithChildren(properties: { children: JSX.Element }) {
  return (
    <div style={{ width: '100%', height: 350 }}>
      <SimpleGraphProviderDecorator>
        <Paper width={'100%'} height={350} renderElement={RenderSimpleRectElement}>
          {properties.children}
        </Paper>
      </SimpleGraphProviderDecorator>
    </div>
  );
}

export function SimpleRenderItemDecorator(Story: any) {
  return <RenderItemDecorator renderElement={Story} />;
}

export function SimpleRenderPaperDecorator(Story: any) {
  return <RenderPaperWithChildren>{Story}</RenderPaperWithChildren>;
}
