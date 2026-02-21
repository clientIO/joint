import { PAPER_CLASSNAME, PRIMARY, TEXT } from 'storybook-config/theme';
import '../index.css';
import type { dia } from '@joint/core';
import {
  GraphProvider,
  Paper,
  useElement,
  type GraphElement,
  type GraphLink,
  type RenderElement,
  type ElementToGraphOptions,
} from '@joint/react';
import { useCallback } from 'react';

const SECONDARY = '#6366f1';

interface PortElement extends GraphElement {
  readonly label: string;
  readonly color: string;
}

const initialElements: Record<string, PortElement> = {
  'node-1': {
    label: 'Node 1',
    color: PRIMARY,
    x: 50,
    y: 100,
    width: 140,
    height: 60,
    // Add ports in the mapDataToElementAttributes function
    // useful when you don't want your data model to be coupled
    // shape definition, and you want to add ports only for rendering purposes
  },
  'node-2': {
    label: 'Node 2',
    color: SECONDARY,
    x: 350,
    y: 100,
    width: 140,
    height: 60,
    ports: [
      {
        id: 'in-1',
        cx: 0,
        cy: 'calc(0.33 * h)',
        width: 16,
        height: 16,
        color: PRIMARY,
      },
      {
        id: 'in-2',
        cx: 0,
        cy: 'calc(0.66 * h)',
        width: 16,
        height: 16,
        color: PRIMARY,
      },
    ],
  },
};

const initialLinks: Record<string, GraphLink> = {
  'link-1': {
    source: { id: 'node-1', port: 'out-1' },
    target: { id: 'node-2', port: 'in-1' },
    color: SECONDARY,
  },
  'link-2': {
    source: { id: 'node-1', port: 'out-2' },
    target: { id: 'node-2', port: 'in-2' },
    color: PRIMARY,
  },
};

function ElementNode({ label, color }: Readonly<PortElement>) {
  const { width = 140, height = 60 } = useElement<PortElement>();
  return (
    <>
      <rect rx={8} ry={8} width={width} height={height} fill={color} stroke="#333" strokeWidth={2} />
      <text
        x={width / 2}
        y={height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={TEXT}
        fontSize={14}
        fontWeight="bold"
      >
        {label}
      </text>
    </>
  );
}

function Main() {
  const renderElement: RenderElement<PortElement> = useCallback(
    (props) => <ElementNode {...props} />,
    []
  );
  return <Paper className={PAPER_CLASSNAME} height={400} renderElement={renderElement} />;
}

const NODE_1_PORTS = [
  {
    id: 'out-1',
    cx: 'calc(w)',
    cy: 'calc(0.33 * h)',
    width: 16,
    height: 16,
    color: SECONDARY,
  },
  {
    id: 'out-2',
    cx: 'calc(w)',
    cy: 'calc(0.66 * h)',
    width: 16,
    height: 16,
    color: SECONDARY,
  },
] as const;

const mapDataToElementAttributes = ({
  id,
  data,
  defaultAttributes,
}: ElementToGraphOptions<GraphElement>): dia.Cell.JSON => {
  if (id === 'node-1') {
    return defaultAttributes({ ...data, ports: [...NODE_1_PORTS] });
  }
  return defaultAttributes();
};

export default function App() {
  return (
    <GraphProvider
      elements={initialElements}
      links={initialLinks}
      mapDataToElementAttributes={mapDataToElementAttributes}
    >
      <Main />
    </GraphProvider>
  );
}
