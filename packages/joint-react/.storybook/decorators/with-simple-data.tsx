/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */
//@ts-expect-error its js package without types
import JsonViewer from '@andypf/json-viewer/dist/esm/react/JsonViewer';

import type { HTMLProps, JSX, PropsWithChildren } from 'react';
import type { InferElement } from '@joint/react';
import {
  createElements,
  createLinks,
  GraphProvider,
  MeasuredNode,
  Paper,
  useElement,
} from '@joint/react';
import { PAPER_CLASSNAME, PRIMARY } from '../theme';

const initialElements = createElements([
  {
    id: '1',
    label: 'Node 1',
    color: PRIMARY,
    x: 100,
    y: 20,
    width: 150,
    height: 50,
  },
  {
    id: '2',
    label: 'Node 2',
    color: PRIMARY,
    x: 200,
    y: 250,
    width: 150,
    height: 50,
  },
]);

export type SimpleElement = InferElement<typeof initialElements>;
const initialLinks = createLinks([
  {
    id: 'l-1',
    source: '1',
    target: '2',
    attrs: {
      line: {
        stroke: PRIMARY,
      },
    },
  },
]);

export function SimpleGraphProviderDecorator({ children }: Readonly<PropsWithChildren>) {
  return (
    <GraphProvider initialElements={initialElements} initialLinks={initialLinks}>
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
    <div style={{ width: '100%', height: 450 }}>
      <SimpleGraphProviderDecorator>
        <Paper
          width="100%"
          height={450}
          className={PAPER_CLASSNAME}
          renderElement={properties.renderElement}
          linkPinning={false}
        />
      </SimpleGraphProviderDecorator>
    </div>
  );
}

function RenderSimpleRectElement(properties: SimpleElement) {
  const { width, color, height } = properties;
  return <rect width={width} height={height} fill={color} />;
}

export function RenderPaperWithChildren(properties: Readonly<{ children: JSX.Element }>) {
  return (
    <div style={{ width: '100%', height: 350 }}>
      <SimpleGraphProviderDecorator>
        <Paper
          width="100%"
          height={350}
          className={PAPER_CLASSNAME}
          renderElement={RenderSimpleRectElement}
        >
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

export function HTMLNode(props: PropsWithChildren<HTMLProps<HTMLDivElement>>) {
  const { width, height } = useElement();
  return (
    <foreignObject width={width} height={height} overflow="visible">
      <MeasuredNode>
        <div {...props} />
      </MeasuredNode>
    </foreignObject>
  );
}

export function ShowJson(props: Readonly<{ readonly data: string; showCopy?: boolean }>) {
  return (
    <JsonViewer
      indent={2}
      expanded
      theme="default-dark"
      show-data-types
      show-toolbar="false"
      expand-icon-type="arrow"
      show-copy={false}
      show-size
      data={props.data}
    />
  );
}

export function DataRenderer({ data, name }: Readonly<{ data: unknown; name: string }>) {
  return (
    <div className="mt-4">
      <h4 className="mb-2">{name}:</h4>
      <ShowJson data={JSON.stringify(data, null, 2)} />
    </div>
  );
}
