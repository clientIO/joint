

import { PAPER_CLASSNAME } from 'storybook-config/theme';
import '../index.css';
import type {
  ElementPort} from '@joint/react';
import {
  GraphProvider,
  Paper,
  HTMLBox,
  type ElementRecord,
  type DefaultLinkContext
} from '@joint/react';

const RED = '#ef4444';
const GREEN = '#22c55e';
const BLUE = '#3b82f6';

const PORT_SIZE = 14;
const PORT_STYLE: ElementPort = { width: PORT_SIZE, height: PORT_SIZE, shape: 'rect' };

const initialElements: Record<string, ElementRecord> = {
  'node-1': {
    data: { label: 'Source' },
    position: { x: 50, y: 80 },
    size: { width: 140, height: 120 },
    portStyle: PORT_STYLE,
    portMap: {
      red: { cx: 'calc(w)', cy: 'calc(0.25 * h)', color: RED },
      green: { cx: 'calc(w)', cy: 'calc(0.5 * h)', color: GREEN },
      blue: { cx: 'calc(w)', cy: 'calc(0.75 * h)', color: BLUE },
    },
  },
  'node-2': {
    data: { label: 'Target' },
    position: { x: 350, y: 80 },
    size: { width: 140, height: 120 },
    portStyle: PORT_STYLE,
    portMap: {
      'in-1': { cx: 0, cy: 'calc(0.33 * h)' },
      'in-2': { cx: 0, cy: 'calc(0.66 * h)' },
    },
  },
};

const PORT_COLORS: Record<string, string> = {
  red: RED,
  green: GREEN,
  blue: BLUE,
};

function defaultLink({ source }: DefaultLinkContext) {
  const color = (source.port && PORT_COLORS[source.port]) || '#333';
  return {
    style: { color, targetMarker: 'arrow-sunken' },
    z: -1,
  };
}

function RenderElement(data: Readonly<{ label: string }>) {
  return <HTMLBox useModelGeometry>{data.label}</HTMLBox>;
}

export default function App() {
  return (
    <GraphProvider initialElements={initialElements}>
      <Paper
        renderElement={RenderElement}
        className={PAPER_CLASSNAME}
        height={300}
        defaultLink={defaultLink}
        snapLinks
        linkPinning={false}
      />
    </GraphProvider>
  );
}
