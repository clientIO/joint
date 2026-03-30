/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import '../index.css';
import { GraphProvider, Paper, type ElementRecord, type LinkRecord } from '@joint/react';

const SECONDARY = '#6366f1';

const initialElements: Record<string, ElementRecord> = {
  // Row 1: Basic shapes
  rectangle: {
    position: { x: 20, y: 20 },
    size: { width: 100, height: 50 },
    type: 'standard.Rectangle',
    attrs: { body: { fill: PRIMARY }, label: { fill: 'white', text: 'Rectangle' } },
  },
  circle: {
    position: { x: 150, y: 20 },
    size: { width: 60, height: 60 },
    type: 'standard.Circle',
    attrs: {
      body: { fill: SECONDARY, stroke: '#333333' },
      label: { fill: 'white', text: 'Circle' },
    },
  },
  ellipse: {
    position: { x: 240, y: 20 },
    size: { width: 100, height: 50 },
    type: 'standard.Ellipse',
    attrs: {
      body: { fill: PRIMARY, stroke: '#333333' },
      label: { fill: 'white', text: 'Ellipse' },
    },
  },
  cylinder: {
    position: { x: 370, y: 10 },
    size: { width: 60, height: 70 },
    type: 'standard.Cylinder',
    attrs: { body: { fill: SECONDARY }, top: { fill: '#4f46e5' } },
  },
  // Row 2: Path shapes
  path: {
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
  polygon: {
    position: { x: 130, y: 110 },
    size: { width: 80, height: 80 },
    type: 'standard.Polygon',
    attrs: {
      body: { points: '40,0 80,30 65,80 15,80 0,30', fill: SECONDARY, stroke: '#333333' },
      label: { fill: 'white', text: 'Polygon' },
    },
  },
  polyline: {
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
  textblock: {
    position: { x: 370, y: 110 },
    size: { width: 100, height: 60 },
    type: 'standard.TextBlock',
    attrs: {
      body: { stroke: PRIMARY, fill: '#f3f4f6' },
      label: { text: 'TextBlock\nwith wrap', style: { fontSize: 14, color: PRIMARY } },
    },
  },
  // Row 3: Headered and Image shapes
  headered: {
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
  image: {
    position: { x: 170, y: 220 },
    size: { width: 60, height: 60 },
    type: 'standard.Image',
    attrs: {
      image: { xlinkHref: 'https://picsum.photos/60/60?random=1' },
      label: { fill: 'white', text: 'Image' },
    },
  },
  'bordered-image': {
    position: { x: 260, y: 220 },
    size: { width: 70, height: 70 },
    type: 'standard.BorderedImage',
    attrs: {
      border: { stroke: PRIMARY, strokeWidth: 3 },
      image: { xlinkHref: 'https://picsum.photos/70/70?random=2' },
      label: { fill: 'white', text: 'Bordered' },
    },
  },
  'embedded-image': {
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
  'inscribed-image': {
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
  'link-source': {
    position: { x: 150, y: 350 },
    size: { width: 80, height: 40 },
    type: 'standard.Rectangle',
    attrs: { body: { fill: PRIMARY }, label: { fill: 'white', text: 'Source' } },
  },
  'link-target-1': {
    position: { x: 350, y: 320 },
    size: { width: 80, height: 40 },
    type: 'standard.Rectangle',
    attrs: { body: { fill: SECONDARY }, label: { fill: 'white', text: 'Target 1' } },
  },
  'link-target-2': {
    position: { x: 350, y: 420 },
    size: { width: 80, height: 40 },
    type: 'standard.Rectangle',
    attrs: { body: { fill: PRIMARY }, label: { fill: 'white', text: 'Target 2' } },
  },
  'link-target-3': {
    position: { x: 520, y: 320 },
    size: { width: 80, height: 40 },
    type: 'standard.Rectangle',
    attrs: { body: { fill: SECONDARY }, label: { fill: 'white', text: 'Target 3' } },
  },
};

const initialLinks: Record<string, LinkRecord> = {
  'link-standard': {
    source: { id: 'link-source' },
    target: { id: 'link-target-1' },
    type: 'standard.Link',
    attrs: { line: { stroke: PRIMARY } },
    labels: [{ attrs: { text: { text: 'Link' } } }],
  },
  'link-double': {
    source: { id: 'link-source' },
    target: { id: 'link-target-2' },
    type: 'standard.DoubleLink',
    attrs: { line: { stroke: SECONDARY }, outline: { stroke: '#c7d2fe' } },
    labels: [{ attrs: { text: { text: 'DoubleLink' } } }],
  },
  'link-shadow': {
    source: { id: 'link-target-1' },
    target: { id: 'link-target-3' },
    type: 'standard.ShadowLink',
    attrs: { line: { stroke: PRIMARY }, shadow: { stroke: '#9ca3af' } },
    labels: [{ attrs: { text: { text: 'ShadowLink' } } }],
  },
};

function Main() {
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper className={PAPER_CLASSNAME} height={500} interactive={true}/>
    </div>
  );
}

export default function App() {
  return (
    <GraphProvider
      elements={initialElements}
      links={initialLinks}
    >
      <Main />
    </GraphProvider>
  );
}
