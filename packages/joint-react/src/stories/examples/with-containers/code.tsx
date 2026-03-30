/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import type { dia } from '@joint/core';
import type { LinkRecord, ElementRecord } from '@joint/react';
import { GraphProvider, Paper, HTMLHost, useElementSize } from '@joint/react';
import { BG, PAPER_CLASSNAME, PRIMARY, SECONDARY } from 'storybook-config/theme';

type ContainerData = {
  readonly label: string;
  readonly isContainer?: boolean;
  readonly [key: string]: unknown;
};

const elements: Record<string, ElementRecord<ContainerData>> = {
  container: {
    position: { x: 50, y: 50 },
    size: { width: 300, height: 200 },
    data: { label: 'Container', isContainer: true },
    z: 1,
  },
  'child-1': {
    position: { x: 70, y: 80 },
    data: { label: 'Child 1' },
    parent: 'container',
    z: 2,
  },
  'child-2': {
    position: { x: 200, y: 80 },
    data: { label: 'Child 2' },
    parent: 'container',
    z: 2,
  },
};

const links: Record<string, LinkRecord> = {
  'link-1': {
    source: { id: 'child-1' },
    target: { id: 'child-2' },
    parent: 'container',
    style: { color: 'white' },
    z: 2,
  },
};

function ContainerNode({ label }: Readonly<ContainerData>) {
  const { width, height } = useElementSize();
  return (
    <g>
      <rect
        width={width}
        height={height}
        rx={8}
        ry={8}
        fill="#1f2937"
        stroke={PRIMARY}
        strokeWidth={2}
        strokeDasharray="5,5"
      />
      <text x={10} y={20} fill={PRIMARY} fontSize={12} fontWeight="bold">
        {label}
      </text>
    </g>
  );
}

function ChildElement({ label }: Readonly<ContainerData>) {
  return (
    <HTMLHost
      style={{
        padding: '10px 10px',
        border: `1px solid ${SECONDARY}`,
        background: BG,
        borderRadius: 6,
        color: 'white',
        fontSize: 14,
        fontWeight: 500,
        cursor: 'move',
        display: 'inline-block',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </HTMLHost>
  );
}

function RenderElement(props: Readonly<ContainerData>) {
  if (props.isContainer) {
    return <ContainerNode {...props} />;
  }
  return <ChildElement {...props} />;
}

function validateParentChildRelationship(
  _childView: dia.CellView,
  parentView: dia.CellView
): boolean {
  // Only allow embedding into container elements
  return Boolean(parentView.model.prop('data/isContainer'));
}

function Main() {
  return (
    <Paper
      height={350}
      className={PAPER_CLASSNAME}
      renderElement={RenderElement}
      embeddingMode
      validateEmbedding={validateParentChildRelationship}
      highlighting={{
        embedding: {
          name: 'mask',
          options: {
            padding: 5,
            attrs: {
              stroke: SECONDARY,
              strokeWidth: 2,
              strokeLinejoin: 'round',
            },
          },
        },
      }}
      style={{ backgroundColor: BG }}
      drawGrid={false}
    />
  );
}

export default function App() {
  return (
    <GraphProvider elements={elements} links={links}>
      <Main />
    </GraphProvider>
  );
}
