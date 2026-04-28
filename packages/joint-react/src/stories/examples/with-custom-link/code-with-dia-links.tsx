/* eslint-disable react-perf/jsx-no-new-object-as-prop */

import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import { dia } from '@joint/core';
import { shapes, util } from '@joint/core';
import { type CellRecord, GraphProvider } from '@joint/react';
import { Paper } from '../../../components/paper/paper';

type ElementData = { label: string; color: string };

class LinkModel extends shapes.standard.Link {
  defaults() {
    return util.defaultsDeep(super.defaults, {
      type: 'link',
      attrs: LinkModel.getPresentationAttributes(PRIMARY),
    });
  }

  static getPresentationAttributes(color: string): dia.Cell.Selectors {
    return {
      line: {
        connection: true,
        stroke: color,
        strokeWidth: 10,
        strokeLinejoin: 'round',
        sourceMarker: {
          type: 'circle',
          r: 8,
        },
        targetMarker: {
          type: 'circle',
          r: 8,
        },
      },
      wrapper: {
        connection: true,
        strokeWidth: 10,
        strokeLinejoin: 'round',
      },
    };
  }
}

const initialCells: ReadonlyArray<CellRecord<ElementData>> = [
  {
    id: '1',
    type: 'element',
    data: { label: 'Node 1', color: PRIMARY },
    position: { x: 100, y: 15 },
    size: { width: 140, height: 50 },
  },
  {
    id: '2',
    type: 'element',
    data: { label: 'Node 2', color: PRIMARY },
    position: { x: 100, y: 200 },
    size: { width: 140, height: 50 },
  },
  {
    id: '1123',
    type: 'link',
    source: { id: '1' },
    target: { id: '2' },
    attrs: LinkModel.getPresentationAttributes(PRIMARY),
  },
];

function Main() {
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper className={PAPER_CLASSNAME} height={280} />
    </div>
  );
}

export default function App() {
  return (
    <GraphProvider
      initialCells={initialCells}
      cellNamespace={{ LinkModel }}
    >
      <Main />
    </GraphProvider>
  );
}
