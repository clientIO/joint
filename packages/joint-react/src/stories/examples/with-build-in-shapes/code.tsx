/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import '../index.css';
import { GraphProvider, Paper, type CellRecordBase } from '@joint/react';

const SECONDARY = '#6366f1';

const initialCells: readonly CellRecordBase[] = [
  // Row 1: Basic shapes
  {
    id: 'rectangle',
    position: { x: 20, y: 20 },
    size: { width: 100, height: 50 },
    type: 'standard.Rectangle',
    attrs: { body: { fill: PRIMARY }, label: { fill: 'white', text: 'Rectangle' } },
  },
  {
    id: 'circle',
    position: { x: 150, y: 20 },
    size: { width: 60, height: 60 },
    type: 'standard.Circle',
    attrs: {
      body: { fill: SECONDARY, stroke: '#333333' },
      label: { fill: 'white', text: 'Circle' },
    },
  },
  {
    id: 'ellipse',
    position: { x: 240, y: 20 },
    size: { width: 100, height: 50 },
    type: 'standard.Ellipse',
    attrs: {
      body: { fill: PRIMARY, stroke: '#333333' },
      label: { fill: 'white', text: 'Ellipse' },
    },
  },
  {
    id: 'cylinder',
    position: { x: 370, y: 10 },
    size: { width: 60, height: 70 },
    type: 'standard.Cylinder',
    attrs: { body: { fill: SECONDARY }, top: { fill: '#4f46e5' } },
  },
  // Row 2: Path shapes
  {
    id: 'path',
    position: { x: 20, y: 110 },
    size: { width: 80, height: 80 },
    type: 'standard.Path',
    attrs: {
      body: {
        d: 'M 0 20 L 40 0 L 80 20 L 80 60 L 40 80 L 0 60 Z',
        fill: PRIMARY,
        stroke: '#333333',
      },
      label: { fill: 'white', text: 'Path' },
    },
  },
  {
    id: 'polygon',
    position: { x: 130, y: 110 },
    size: { width: 80, height: 80 },
    type: 'standard.Polygon',
    attrs: {
      body: { points: '40,0 80,30 65,80 15,80 0,30', fill: SECONDARY, stroke: '#333333' },
      label: { fill: 'white', text: 'Polygon' },
    },
  },
  {
    id: 'polyline',
    position: { x: 240, y: 110 },
    size: { width: 100, height: 80 },
    type: 'standard.Polyline',
    attrs: {
      body: {
        points: '0,40 25,0 50,40 75,0 100,40',
        strokeWidth: 3,
        stroke: PRIMARY,
        fill: 'none',
        pointerEvents: 'all',
      },
      label: { y: 70, fill: 'white', text: 'Polyline' },
    },
  },
  {
    id: 'textblock',
    position: { x: 370, y: 110 },
    size: { width: 100, height: 60 },
    type: 'standard.TextBlock',
    attrs: {
      body: { stroke: PRIMARY, fill: '#f3f4f6' },
      label: { text: 'TextBlock\nwith wrap', style: { fontSize: 14, color: PRIMARY } },
    },
  },
  // Row 3: Headered and Image shapes
  {
    id: 'headered',
    position: { x: 20, y: 220 },
    size: { width: 120, height: 80 },
    type: 'standard.HeaderedRectangle',
    attrs: {
      body: { fill: '#e5e7eb' },
      header: { fill: PRIMARY },
      headerText: { fill: 'white', text: 'Header' },
      bodyText: { fill: '#374151', text: 'Body' },
    },
  },
  {
    id: 'image',
    position: { x: 170, y: 220 },
    size: { width: 60, height: 60 },
    type: 'standard.Image',
    attrs: {
      image: { xlinkHref: 'https://picsum.photos/60/60?random=1' },
      label: { fill: 'white', text: 'Image' },
    },
  },
  {
    id: 'bordered-image',
    position: { x: 260, y: 220 },
    size: { width: 70, height: 70 },
    type: 'standard.BorderedImage',
    attrs: {
      border: { stroke: PRIMARY, strokeWidth: 3 },
      image: { xlinkHref: 'https://picsum.photos/70/70?random=2' },
      label: { fill: 'white', text: 'Bordered' },
    },
  },
  {
    id: 'embedded-image',
    position: { x: 360, y: 220 },
    size: { width: 150, height: 70 },
    type: 'standard.EmbeddedImage',
    attrs: {
      body: { stroke: SECONDARY, fill: '#f3f4f6' },
      image: { xlinkHref: 'https://picsum.photos/30/30?random=3' },
      label: { fill: '#374151', text: 'Embedded' },
    },
  },
  // Row 4: More shapes and link targets
  {
    id: 'inscribed-image',
    position: { x: 20, y: 330 },
    size: { width: 70, height: 70 },
    type: 'standard.InscribedImage',
    attrs: {
      border: { stroke: PRIMARY },
      background: { fill: '#e5e7eb' },
      image: { xlinkHref: 'https://picsum.photos/50/50?random=4' },
      label: { fill: 'white', text: 'Inscribed' },
    },
  },
  {
    id: 'link-source',
    position: { x: 150, y: 350 },
    size: { width: 80, height: 40 },
    type: 'standard.Rectangle',
    attrs: { body: { fill: PRIMARY }, label: { fill: 'white', text: 'Source' } },
  },
  {
    id: 'link-target-1',
    position: { x: 350, y: 320 },
    size: { width: 80, height: 40 },
    type: 'standard.Rectangle',
    attrs: { body: { fill: SECONDARY }, label: { fill: 'white', text: 'Target 1' } },
  },
  {
    id: 'link-target-2',
    position: { x: 350, y: 420 },
    size: { width: 80, height: 40 },
    type: 'standard.Rectangle',
    attrs: { body: { fill: PRIMARY }, label: { fill: 'white', text: 'Target 2' } },
  },
  {
    id: 'link-target-3',
    position: { x: 520, y: 320 },
    size: { width: 80, height: 40 },
    type: 'standard.Rectangle',
    attrs: { body: { fill: SECONDARY }, label: { fill: 'white', text: 'Target 3' } },
  },
  {
    id: 'link-standard',
    source: { id: 'link-source' },
    target: { id: 'link-target-1' },
    type: 'standard.Link',
    attrs: { line: { stroke: PRIMARY } },
    labels: [{ attrs: { text: { text: 'Link' } } }],
  },
  {
    id: 'link-double',
    source: { id: 'link-source' },
    target: { id: 'link-target-2' },
    type: 'standard.DoubleLink',
    attrs: { line: { stroke: SECONDARY }, outline: { stroke: '#c7d2fe' } },
    labels: [{ attrs: { text: { text: 'DoubleLink' } } }],
  },
  {
    id: 'link-shadow',
    source: { id: 'link-target-1' },
    target: { id: 'link-target-3' },
    type: 'standard.ShadowLink',
    attrs: { line: { stroke: PRIMARY }, shadow: { stroke: '#9ca3af' } },
    labels: [{ attrs: { text: { text: 'ShadowLink' } } }],
  },
] satisfies CellRecordBase[];

function Main() {
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper className={PAPER_CLASSNAME} height={500} interactive={true} />
    </div>
  );
}

export default function App() {
  return (
    <GraphProvider initialCells={initialCells}>
      <Main />
    </GraphProvider>
  );
}
