import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import type { dia } from '@joint/core';
import '../index.css';
import {
  GraphProvider,
  Paper,
  type GraphElement,
  type GraphLink,
  type ElementToGraphOptions,
} from '@joint/react';

const SECONDARY = '#6366f1';

interface NativeElement extends GraphElement {
  readonly type: string;
}

const mapDataToElementAttributes = ({
  data,
  defaultAttributes,
}: ElementToGraphOptions<GraphElement>): dia.Cell.JSON => {
  const result = defaultAttributes();
  const { type, attrs, ports } = data as NativeElement;
  return {
    ...result,
    ...(type && { type }),
    ...(attrs && { attrs }),
    ...(ports && { ports }),
  };
};

const initialElements: Record<string, NativeElement> = {
  'node-1': {
    x: 50,
    y: 100,
    width: 140,
    height: 60,
    type: 'standard.Rectangle',
    attrs: {
      body: {
        width: 'calc(w)',
        height: 'calc(h)',
        strokeWidth: 2,
        stroke: '#333',
        fill: PRIMARY,
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
        text: 'Node 1',
      },
    },
    ports: {
      groups: {
        out: {
          position: 'right',
          attrs: {
            circle: {
              r: 8,
              magnet: true,
              fill: SECONDARY,
              stroke: '#333',
              strokeWidth: 2,
            },
          },
        },
      },
      items: [
        { id: 'out-1', group: 'out' },
        { id: 'out-2', group: 'out' },
      ],
    },
  },
  'node-2': {
    x: 350,
    y: 50,
    width: 140,
    height: 60,
    type: 'standard.Rectangle',
    attrs: {
      body: {
        width: 'calc(w)',
        height: 'calc(h)',
        strokeWidth: 2,
        stroke: '#333',
        fill: SECONDARY,
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
        text: 'Node 2',
      },
    },
    ports: {
      groups: {
        in: {
          position: 'left',
          attrs: {
            circle: {
              r: 8,
              magnet: true,
              fill: PRIMARY,
              stroke: '#333',
              strokeWidth: 2,
            },
          },
        },
        out: {
          position: 'right',
          attrs: {
            circle: {
              r: 8,
              magnet: true,
              fill: SECONDARY,
              stroke: '#333',
              strokeWidth: 2,
            },
          },
        },
      },
      items: [
        { id: 'in-1', group: 'in' },
        { id: 'out-1', group: 'out' },
      ],
    },
  },
  'node-3': {
    x: 350,
    y: 200,
    width: 140,
    height: 60,
    type: 'standard.Rectangle',
    attrs: {
      body: {
        width: 'calc(w)',
        height: 'calc(h)',
        strokeWidth: 2,
        stroke: '#333',
        fill: PRIMARY,
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
        text: 'Node 3',
      },
    },
    ports: {
      groups: {
        in: {
          position: 'left',
          attrs: {
            circle: {
              r: 8,
              magnet: true,
              fill: PRIMARY,
              stroke: '#333',
              strokeWidth: 2,
            },
          },
        },
      },
      items: [{ id: 'in-1', group: 'in' }],
    },
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
