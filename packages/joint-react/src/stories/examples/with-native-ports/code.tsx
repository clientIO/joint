import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import type { dia } from '@joint/core';
import '../index.css';
import {
  GraphProvider,
  Paper,
  flatMapper,
  type GraphElement,
  type GraphLink,
  type ElementToGraphOptions,
} from '@joint/react';

const SECONDARY = '#6366f1';

interface NativeElement extends GraphElement {
  readonly color: string;
  readonly label: string;
  readonly inputPorts?: readonly string[];
  readonly outputPorts?: readonly string[];
}

function buildNativePorts(inputPorts?: readonly string[], outputPorts?: readonly string[]) {
  if (!inputPorts && !outputPorts) return;
  const groups: Record<string, dia.Element.PortGroup> = {};
  const items: dia.Element.Port[] = [];

  if (inputPorts) {
    groups.in = {
      position: 'left',
      size: { width: 16, height: 16 },
      attrs: {
        circle: {
          r: 'calc(s / 2)',
          magnet: true,
          fill: PRIMARY,
          stroke: '#333',
          strokeWidth: 2,
        },
      },
    };
    for (const id of inputPorts) {
      items.push({ id, group: 'in' });
    }
  }

  if (outputPorts) {
    groups.out = {
      position: 'right',
      size: { width: 16, height: 16 },
      attrs: {
        circle: {
          r: 'calc(s / 2)',
          magnet: true,
          fill: SECONDARY,
          stroke: '#333',
          strokeWidth: 2,
        },
      },
    };
    for (const id of outputPorts) {
      items.push({ id, group: 'out' });
    }
  }

  return { groups, items };
}

const mapDataToElementAttributes = (
  options: ElementToGraphOptions<GraphElement>
): dia.Cell.JSON => {
  const result = flatMapper.mapDataToElementAttributes(options);
  const { color, label, inputPorts, outputPorts } = options.data as NativeElement;
  return {
    ...result,
    type: 'standard.Rectangle',
    attrs: {
      body: {
        width: 'calc(w)',
        height: 'calc(h)',
        strokeWidth: 2,
        stroke: '#333',
        fill: color,
        rx: 8,
        ry: 8,
      },
      label: {
        textVerticalAnchor: 'middle',
        textAnchor: 'middle',
        x: 'calc(w/2)',
        y: 'calc(h/2)',
        fontSize: 14,
        fill: 'white',
        text: label,
      },
    },
    ports: buildNativePorts(inputPorts, outputPorts),
  };
};

const initialElements: Record<string, NativeElement> = {
  'node-1': {
    x: 50,
    y: 100,
    width: 140,
    height: 60,
    color: PRIMARY,
    label: 'Node 1',
    outputPorts: ['out-1', 'out-2'],
  },
  'node-2': {
    x: 350,
    y: 50,
    width: 140,
    height: 60,
    color: SECONDARY,
    label: 'Node 2',
    inputPorts: ['in-1'],
    outputPorts: ['out-1'],
  },
  'node-3': {
    x: 350,
    y: 200,
    width: 140,
    height: 60,
    color: PRIMARY,
    label: 'Node 3',
    inputPorts: ['in-1'],
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
    target: { id: 'node-3', port: 'in-1' },
    color: PRIMARY,
  },
};

function Main() {
  return <Paper className={PAPER_CLASSNAME} height={400} />;
}

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
