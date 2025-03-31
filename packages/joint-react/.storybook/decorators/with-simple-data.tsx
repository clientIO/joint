/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */

import type { JSX, PropsWithChildren } from 'react';
import type { InferElement } from '@joint/react';
import { createElements, createLinks, GraphProvider, Paper } from '@joint/react';
import { PRIMARY } from '.storybook/theme';

const initialElements = createElements([
  {
    id: '1',
    data: { label: 'Node 1', color: PRIMARY },
    x: 100,
    y: 20,
    width: 100,
    height: 50,
  },
  {
    id: '2',
    data: { label: 'Node 2', color: PRIMARY },
    x: 200,
    y: 250,
    width: 100,
    height: 50,
  },
]);

export type SimpleElement = InferElement<typeof initialElements>;
const defaultLinks = createLinks([
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    attrs: {
      line: {
        stroke: PRIMARY,
      },
    },
  },
]);

function SimpleGraphProviderDecorator({ children }: Readonly<PropsWithChildren>) {
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

export function RenderItemDecorator(
  properties: Readonly<{
    renderElement: (element: SimpleElement) => JSX.Element;
  }>
) {
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

export function RenderPaperWithChildren(properties: Readonly<{ children: JSX.Element }>) {
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
