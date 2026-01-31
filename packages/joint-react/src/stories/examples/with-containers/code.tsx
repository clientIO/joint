/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { dia } from '@joint/core';
import { GraphProvider, Paper, useNodeSize, type GraphElement } from '@joint/react';
import { useRef } from 'react';
import { PAPER_CLASSNAME, PRIMARY, SECONDARY } from 'storybook-config/theme';

interface ContainerElement extends GraphElement {
  readonly label: string;
  readonly isContainer?: boolean;
}

const elements: Record<string, ContainerElement> = {
  'container': {
    x: 50,
    y: 50,
    width: 300,
    height: 200,
    label: 'Container',
    isContainer: true,
  },
  'child-1': {
    x: 70,
    y: 80,
    label: 'Child 1',
    parent: 'container',
  },
  'child-2': {
    x: 200,
    y: 80,
    label: 'Child 2',
    parent: 'container',
  },
};

function ContainerNode({ label, width, height }: Readonly<ContainerElement>) {
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
      <text
        x={10}
        y={20}
        fill={PRIMARY}
        fontSize={12}
        fontWeight="bold"
      >
        {label}
      </text>
    </g>
  );
}

function ChildNode({ label }: Readonly<ContainerElement>) {
  const ref = useRef<HTMLDivElement>(null);
  const { width, height } = useNodeSize(ref);

  return (
    <foreignObject width={width} height={height}>
      <div
        ref={ref}
        style={{
          padding: '10px 10px',
          backgroundColor: SECONDARY,
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
      </div>
    </foreignObject>
  );
}

function RenderElement(props: ContainerElement) {
  if (props.isContainer) {
    return <ContainerNode {...props} />;
  }
  return <ChildNode {...props} />;
}

function validateParentChildRelationship(
  childView: dia.CellView,
  parentView: dia.CellView
): boolean {
  // Only allow embedding into container elements
  return Boolean(parentView.model.prop('data/isContainer'));
}

function Main() {
  return (
    <Paper
      width="100%"
      height={350}
      className={PAPER_CLASSNAME}
      renderElement={RenderElement}
      embeddingMode
      validateEmbedding={validateParentChildRelationship}
    />
  );
}

export default function App() {
  return (
    <GraphProvider elements={elements}>
      <Main />
    </GraphProvider>
  );
}
