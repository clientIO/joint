import type { CellRecord, LinkRecord, LinkMarkerName } from '@joint/react';
import { GraphProvider, Paper } from '@joint/react';

const LINK_LENGTH = 160;
const GAP_Y = 30;
const COLS = 2;
const GAP_X = 220;
const PADDING = 20;

// Colors — unified dark diagram palette.
const LINK_COLOR = '#8697A6';
const LABEL_BODY_COLOR = '#1c2836';
const LABEL_STROKE_COLOR = '#3c4f63';
const LABEL_TEXT_COLOR = '#DDE6ED';

const markerNames = [
  'arrow',
  'arrow-open',
  'arrow-sunken',
  'circle',
  'diamond',
] as const satisfies LinkMarkerName[];

const initialCells: readonly CellRecord[] = markerNames.map((name, index) => {
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  const x = PADDING + col * GAP_X;
  const y = PADDING + row * GAP_Y;

  return {
    id: name,
    type: 'link',
    source: { x, y },
    target: { x: x + LINK_LENGTH, y },
    style: {
      color: LINK_COLOR,
      width: 2,
      sourceMarker: name,
      targetMarker: name,
    },
    labelMap: {
      label: {
        text: name,
        color: LABEL_TEXT_COLOR,
        backgroundColor: LABEL_BODY_COLOR,
        backgroundOutline: LABEL_STROKE_COLOR,
        backgroundOutlineWidth: 1,
        backgroundBorderRadius: 4,
        fontSize: 10,
      },
    },
  } satisfies LinkRecord;
});

export default function App() {
  return (
    <GraphProvider initialCells={initialCells}>
      <Paper className="size-full" transform="scale(2)" interactive={false} drawGrid={false} />
    </GraphProvider>
  );
}
