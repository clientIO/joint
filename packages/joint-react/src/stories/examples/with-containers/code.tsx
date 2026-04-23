/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import type { Cells, ValidateEmbeddingContext } from '@joint/react';
import {
  GraphProvider,
  Paper,
  HTMLHost,
  useElementSize,
} from '@joint/react';
import { BG, PAPER_CLASSNAME, PAPER_STYLE, PRIMARY, SECONDARY } from 'storybook-config/theme';

type ContainerData = {
  readonly label: string;
  readonly isContainer?: boolean;
  readonly [key: string]: unknown;
};

const initialCells: Cells<ContainerData> = [
  {
    id: 'container',
    type: 'ElementModel',
    position: { x: 50, y: 50 },
    size: { width: 300, height: 200 },
    data: { label: 'Container', isContainer: true },
    z: 1,
  },
  {
    id: 'child-1',
    type: 'ElementModel',
    position: { x: 70, y: 80 },
    data: { label: 'Child 1' },
    parent: 'container',
    z: 2,
  },
  {
    id: 'child-2',
    type: 'ElementModel',
    position: { x: 200, y: 80 },
    data: { label: 'Child 2' },
    parent: 'container',
    z: 2,
  },
  {
    id: 'link-1',
    type: 'LinkModel',
    source: { id: 'child-1' },
    target: { id: 'child-2' },
    parent: 'container',
    style: { color: 'white' },
    z: 2,
  },
];

function ContainerNode({ label }: Readonly<ContainerData>) {
  const { width = 0, height = 0 } = useElementSize() ?? {};
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

function RenderElement(data: ContainerData | undefined) {
  if (!data) return null;
  if (data.isContainer) {
    return <ContainerNode {...data} />;
  }
  return <ChildElement {...data} />;
}

function validateParentChildRelationship(
  { parent }: ValidateEmbeddingContext
): boolean {
  // Only allow embedding into container elements
  return Boolean(parent.model.prop('data/isContainer'));
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
      style={PAPER_STYLE}
      drawGrid={false}
    />
  );
}

export default function App() {
  return (
    <GraphProvider<ContainerData> initialCells={initialCells}>
      <Main />
    </GraphProvider>
  );
}
