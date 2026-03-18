/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import type { FlatLinkData } from '@joint/react';
import { GraphProvider, Paper } from '@joint/react';
import { PAPER_CLASSNAME, LIGHT } from 'storybook-config/theme';
import type { LinkMarkerPreset } from '../../../theme/markers';
import { markerPresets } from '../../../theme/markers';

const LINK_LENGTH = 160;
const GAP_X = 260;
const GAP_Y = 80;
const COLS = 3;
const PADDING = 60;

const markerNames = Object.keys(markerPresets).filter((name) => name !== 'none') as LinkMarkerPreset[];

function buildGrid() {
  const links: Record<string, FlatLinkData> = {};

  markerNames.forEach((name, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = PADDING + col * GAP_X;
    const y = PADDING + row * GAP_Y;

    links[name] = {
      source: { x, y },
      target: { x: x + LINK_LENGTH, y },
      color: LIGHT,
      width: 2,
      sourceMarker: name,
      targetMarker: name,
      labels: {
        label: { text: name, color: LIGHT },
      },
    };
  });

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
      />
    </GraphProvider>
  );
}
