/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import type { CellRecord, LinkRecord } from '@joint/react';
import { GraphProvider, Paper } from '@joint/react';
import { PAPER_CLASSNAME } from 'storybook-config/theme';
import type { LinkMarkerName } from '@joint/react';

const LINK_LENGTH = 160;
const GAP_Y = 30;
const COLS = 2;
const GAP_X = 220;
const PADDING = 20;

const markerNames = ['arrow', 'arrow-open', 'arrow-sunken', 'circle', 'diamond'] as const satisfies LinkMarkerName[];

function buildCells(): readonly CellRecord[] {
  const cells: LinkRecord[] = [];

  for (const [index, name] of markerNames.entries()) {
    const col = index % COLS;
    const row = Math.floor(index / COLS);
    const x = PADDING + col * GAP_X;
    const y = PADDING + row * GAP_Y;

    cells.push({
      id: name,
      type: 'link',
      source: { x, y },
      target: { x: x + LINK_LENGTH, y },
      style: {
        width: 2,
        sourceMarker: name,
        targetMarker: name,
      },
      labelMap: {
        label: {
          text: name,
          backgroundBorderRadius: 4,
          fontSize: 10,
        },
      },
    });
  }

  return cells;
}

const initialCells = buildCells();

export default function App() {
  return (
    <GraphProvider initialCells={initialCells}>
      <Paper style={{ width: '100%' }}
        transform={'scale(2)'}
        className={`${PAPER_CLASSNAME} h-[800px]`}
        interactive={false}
        drawGrid={false}
      />
    </GraphProvider>
  );
}
