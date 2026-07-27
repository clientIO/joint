import type { CellRecord, ValidateEmbeddingParams } from '@joint/react';
import { GraphProvider, useCell, Paper, HTMLBox, selectElementSize } from '@joint/react';
import type { dia } from '@joint/core';

// Colors — unified dark diagram palette.
const PRIMARY = '#ED2637';
const SECONDARY = '#FF9505';
const CONTAINER_BODY_COLOR = '#121c26';
const LINK_COLOR = '#8697A6';

type ContainerData = {
  readonly label: string;
  readonly isContainer?: boolean;
  readonly [key: string]: unknown;
};

const initialCells: ReadonlyArray<CellRecord<ContainerData>> = [
  {
    id: 'container',
    type: 'element',
    position: { x: 50, y: 50 },
    size: { width: 300, height: 200 },
    data: { label: 'Container', isContainer: true },
    z: 1,
  },
  {
    id: 'child-1',
    type: 'element',
    position: { x: 70, y: 80 },
    data: { label: 'Child 1' },
    parent: 'container',
    z: 2,
  },
  {
    id: 'child-2',
    type: 'element',
    position: { x: 200, y: 80 },
    data: { label: 'Child 2' },
    parent: 'container',
    z: 2,
  },
  {
    id: 'link-1',
    type: 'link',
    source: { id: 'child-1' },
    target: { id: 'child-2' },
    parent: 'container',
    style: { color: LINK_COLOR },
    z: 2,
  },
];

const embeddingHighlight: dia.Paper.Options['highlighting'] = {
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
};

function ContainerNode({ label }: Readonly<ContainerData>) {
  const { width, height } = useCell(selectElementSize);
  return (
    <g>
      <rect
        width={width}
        height={height}
        rx={8}
        ry={8}
        fill={CONTAINER_BODY_COLOR}
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
  return <HTMLBox className="jj-node">{label}</HTMLBox>;
}

function renderElement(data: Readonly<ContainerData>) {
  return data.isContainer ? <ContainerNode {...data} /> : <ChildElement {...data} />;
}

// Only allow dropping elements into container elements.
function validateEmbedding({ parent }: ValidateEmbeddingParams): boolean {
  return Boolean(parent.model.prop('data/isContainer'));
}

export default function App() {
  return (
    <GraphProvider initialCells={initialCells}>
      <Paper
        className="size-full"
        renderElement={renderElement}
        embeddingMode
        validateEmbedding={validateEmbedding}
        highlighting={embeddingHighlight}
      />
    </GraphProvider>
  );
}
