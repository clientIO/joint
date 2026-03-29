import type { LinkRecord } from '@joint/react';
import { GraphProvider, Paper } from '@joint/react';
import { PAPER_CLASSNAME, LIGHT, BG } from 'storybook-config/theme';
import type { LinkMarkerName } from '../../../theme/markers';
import { linkMarkerShapes } from '../../../theme/markers';

const LINK_LENGTH = 160;
const GAP_X = 260;
const GAP_Y = 80;
const COLS = 3;
const PADDING = 60;

const markerNames = Object.keys(linkMarkerShapes).filter(
  (name) => name !== 'none'
) as LinkMarkerName[];

function buildGrid() {
  const links: Record<string, LinkRecord> = {};

  for (const [index, name] of markerNames.entries()) {
    const col = index % COLS;
    const row = Math.floor(index / COLS);
    const x = PADDING + col * GAP_X;
    const y = PADDING + row * GAP_Y;

    links[name] = {
      source: { x, y },
      target: { x: x + LINK_LENGTH, y },
      style: {
        color: LIGHT,
        width: 2,
        sourceMarker: name,
        targetMarker: name,
      },
      labelMap: {
        label: { text: name, color: LIGHT, backgroundColor: '#023345', backgroundBorderRadius: 4 },
      },
    };
  }

  return links;
}

const links = buildGrid();

export default function App() {
  return (
    <GraphProvider links={links}>
      <Paper
        className={`${PAPER_CLASSNAME} h-[400px]`}
        width="100%"
        interactive={false}
        style={{ backgroundColor: BG }}
        drawGrid={false}
      />
    </GraphProvider>
  );
}
