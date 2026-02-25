import { LIGHT, PAPER_CLASSNAME, PRIMARY, TEXT } from 'storybook-config/theme';
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
const DEFAULT_ANCHOR: dia.Paper.Options['defaultAnchor'] = {
  name: 'center',
  args: { useModelGeometry: true },
};

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
    height: 60
  },
};

const initialLinks: Record<string, GraphLink> = {
  'link-1': {
    source: { id: 'node-1', port: 'out-1' },
    target: { id: 'node-2', port: 'in-1' },
    color: LIGHT,
    z: -1,
  },
  'link-2': {
    source: { id: 'node-1', port: 'out-2' },
    target: { id: 'node-2', port: 'in-2' },
    color: LIGHT,
    z: -1
  },
};

function ElementShape({ label, color }: Readonly<PortElement>) {
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
    (props) => <ElementShape {...props} />,
    []
  );
  return (
    <Paper
      className={PAPER_CLASSNAME}
      height={400}
      renderElement={renderElement}
      snapLinks={true}
      linkPinning={true}
      // @todo: the default measureNode should always return model bbox
      defaultAnchor={DEFAULT_ANCHOR}
    />
  );
}

const OUTPUT_PORTS = [
  {
    id: 'out-1',
    cx: 'calc(w)',
    cy: 'calc(0.33 * h)',
    width: 16,
    height: 16,
    color: SECONDARY,
    label: 'Out 1',
    labelColor: LIGHT,
  },
  {
    id: 'out-2',
    cx: 'calc(w)',
    cy: 'calc(0.66 * h)',
    width: 16,
    height: 16,
    color: SECONDARY,
    label: 'Out 2',
    labelColor: LIGHT,
  },
] as const;

const INPUT_PORTS = [
  {
    id: 'in-1',
    cx: -8,
    cy: 'calc(0.33 * h)',
    color: PRIMARY,
    width: 16,
    height: 16,
    shape: 'rect',
    label: 'In 1',
    labelColor: LIGHT,
  },
  {
    id: 'in-2',
    cx: 0,
    cy: 'calc(0.66 * h)',
    width: 16,
    height: 16,
    color: PRIMARY,
    label: 'In 2',
    labelColor: LIGHT,
  },
] as const;

const mapDataToElementAttributes = ({
  id, data, toAttributes,
}: ElementToGraphOptions<GraphElement>): dia.Cell.JSON => {
  if (id === 'node-1') return toAttributes({ ...data, ports: [...OUTPUT_PORTS] });
  if (id === 'node-2') return toAttributes({ ...data, ports: [...INPUT_PORTS] });
  throw new Error(`Unknown element id: ${id}`);
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
