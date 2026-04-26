/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */

// @ts-expect-error do not provide typings.
import JsonViewer from '@andypf/json-viewer/dist/esm/react/JsonViewer';
import { useCallback, useRef, type HTMLProps, type JSX, type PropsWithChildren } from 'react';
import {
  GraphProvider,
  selectElementSize,
  useCellId,
  useElement,
  useMeasureNode,
  type Cells,
  type ElementRecord,
} from '@joint/react';
import { PAPER_CLASSNAME, PRIMARY } from '../theme';
import type { PartialStoryFn, StoryContext } from 'storybook/internal/types';
import { Paper } from '../../src/components/paper/paper';

export type StoryFunction = PartialStoryFn<any, any>;
export type StoryCtx = StoryContext<any, any>;

type TestElementData = {
  label: string;
  color: string;
  hoverColor: string;
};

export const testCells: Cells<TestElementData> = [
  {
    id: '1',
    type: 'ElementModel',
    data: {
      label: 'Node 1',
      color: PRIMARY,
      hoverColor: 'red',
    },
    position: { x: 100, y: 20 },
    size: { width: 150, height: 50 },
    angle: 0,
  },
  {
    id: '2',
    type: 'ElementModel',
    data: {
      label: 'Node 2',
      color: PRIMARY,
      hoverColor: 'blue',
    },
    position: { x: 200, y: 250 },
    size: { width: 150, height: 50 },
    angle: 0,
  },
  {
    id: 'l-1',
    type: 'LinkModel',
    source: { id: '1' },
    target: { id: '2' },
    style: { color: PRIMARY },
  },
];

export type SimpleElement = ElementRecord<TestElementData>;

export function SimpleGraphProviderDecorator({ children }: Readonly<PropsWithChildren>) {
  return <GraphProvider initialCells={testCells}>{children}</GraphProvider>;
}

export function SimpleGraphDecorator(Story: StoryFunction, { args }: StoryCtx) {
  return (
    <SimpleGraphProviderDecorator>
      <Story {...args} />
    </SimpleGraphProviderDecorator>
  );
}

export function RenderItemDecorator(
  properties: Readonly<{
    renderElement: () => JSX.Element;
    renderLink?: () => JSX.Element;
    cells?: Cells;
  }>
) {
  return (
    <div style={{ width: '100%', height: 450 }}>
      <GraphProvider initialCells={properties.cells ?? testCells}>
        <Paper
          height={450}
          className={PAPER_CLASSNAME}
          renderElement={properties.renderElement}
          renderLink={properties.renderLink}
          linkPinning={false}
        />
      </GraphProvider>
    </div>
  );
}

function RenderSimpleRectElement(data: { color: string }) {
  const { width, height } = useElement(selectElementSize);
  return <rect width={width} height={height} fill={data.color} />;
}

export function RenderGraphViewWithChildren(properties: Readonly<{ children: JSX.Element }>) {
  return (
    <div style={{ width: '100%', height: 350 }}>
      <SimpleGraphProviderDecorator>
        <Paper height={350} className={PAPER_CLASSNAME} renderElement={RenderSimpleRectElement}>
          {properties.children}
        </Paper>
      </SimpleGraphProviderDecorator>
    </div>
  );
}

export function SimpleRenderItemDecorator(Story: StoryFunction, { args }: StoryCtx) {
  const component = useCallback(() => <Story {...args} />, [Story, args]);
  return <RenderItemDecorator renderElement={component} />;
}

export function SimpleRenderLinkDecorator(Story: StoryFunction, { args }: StoryCtx) {
  const component = useCallback(() => <Story {...args} />, [Story, args]);
  return (
    <RenderItemDecorator
      renderLink={component}
      // eslint-disable-next-line react-perf/jsx-no-new-function-as-prop
      renderElement={() => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const id = useCellId();
        return <HTMLNode className="node">{id}</HTMLNode>;
      }}
    />
  );
}

export function HTMLNode(props: PropsWithChildren<HTMLProps<HTMLDivElement>>) {
  const elementRef = useRef<HTMLDivElement>(null);
  const { width, height } = useMeasureNode(elementRef);

  return (
    <foreignObject width={width} height={height} overflow="visible">
      <div ref={elementRef} {...props} />
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
