import { GraphProvider, Paper, type CellRecord } from '@joint/react';

// Colors — unified dark diagram palette.
const NODE_FILL = '#1c2836';
const NODE_STROKE = '#3c4f63';
const RAISED_FILL = '#243445';
const TEXT_COLOR = '#DDE6ED';
const MUTED_TEXT_COLOR = '#93A4B3';
const LINK_COLOR = '#8697A6';

// Shared attributes, spread per cell so no two shapes reference the same object.
const BODY_ATTRS = { fill: NODE_FILL, stroke: NODE_STROKE };

/** Builds a link label styled for the dark palette (the built-in default is dark-on-white). */
function darkLinkLabel(text: string) {
  return {
    attrs: {
      text: { text, fill: TEXT_COLOR },
      rect: { fill: RAISED_FILL, stroke: NODE_STROKE },
    },
  };
}

type ElementType = 'standard.Rectangle' | 'standard.Circle' | 'standard.Ellipse' | 'standard.Cylinder' | 'standard.Path' | 'standard.Polygon' | 'standard.Polyline' | 'standard.TextBlock' | 'standard.HeaderedRectangle' | 'standard.Image' | 'standard.BorderedImage' | 'standard.EmbeddedImage' | 'standard.InscribedImage';
type LinkType = 'standard.Link' | 'standard.DoubleLink' | 'standard.ShadowLink';

const initialCells: ReadonlyArray<CellRecord<unknown, unknown, ElementType, LinkType>> = [
  // Row 1: Basic shapes
  {
    id: 'rectangle',
    position: { x: 20, y: 20 },
    size: { width: 100, height: 50 },
    type: 'standard.Rectangle',
    attrs: { body: { ...BODY_ATTRS }, label: { fill: TEXT_COLOR, text: 'Rectangle' } },
  },
  {
    id: 'circle',
    position: { x: 150, y: 20 },
    size: { width: 60, height: 60 },
    type: 'standard.Circle',
    attrs: {
      body: { ...BODY_ATTRS },
      label: { fill: TEXT_COLOR, text: 'Circle' },
    },
  },
  {
    id: 'ellipse',
    position: { x: 240, y: 20 },
    size: { width: 100, height: 50 },
    type: 'standard.Ellipse',
    attrs: {
      body: { ...BODY_ATTRS },
      label: { fill: TEXT_COLOR, text: 'Ellipse' },
    },
  },
  {
    id: 'cylinder',
    position: { x: 370, y: 10 },
    size: { width: 60, height: 70 },
    type: 'standard.Cylinder',
    attrs: { body: { ...BODY_ATTRS }, top: { fill: RAISED_FILL, stroke: NODE_STROKE } },
  },
  // Row 2: Path shapes
  {
    id: 'path',
    position: { x: 20, y: 110 },
    size: { width: 80, height: 80 },
    type: 'standard.Path',
    attrs: {
      body: {
        ...BODY_ATTRS,
        d: 'M 0 20 L 40 0 L 80 20 L 80 60 L 40 80 L 0 60 Z',
      },
      label: { fill: TEXT_COLOR, text: 'Path' },
    },
  },
  {
    id: 'polygon',
    position: { x: 130, y: 110 },
    size: { width: 80, height: 80 },
    type: 'standard.Polygon',
    attrs: {
      body: { ...BODY_ATTRS, points: '40,0 80,30 65,80 15,80 0,30' },
      label: { fill: TEXT_COLOR, text: 'Polygon' },
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
        stroke: LINK_COLOR,
        fill: 'none',
        pointerEvents: 'all',
      },
      label: { y: 70, fill: TEXT_COLOR, text: 'Polyline' },
    },
  },
  {
    id: 'textblock',
    position: { x: 370, y: 110 },
    size: { width: 100, height: 60 },
    type: 'standard.TextBlock',
    attrs: {
      body: { ...BODY_ATTRS },
      label: { text: 'TextBlock\nwith wrap', style: { fontSize: 14, color: TEXT_COLOR } },
    },
  },
  // Row 3: Headered and Image shapes
  {
    id: 'headered',
    position: { x: 20, y: 220 },
    size: { width: 120, height: 80 },
    type: 'standard.HeaderedRectangle',
    attrs: {
      body: { ...BODY_ATTRS },
      header: { fill: RAISED_FILL, stroke: NODE_STROKE },
      headerText: { fill: TEXT_COLOR, text: 'Header' },
      bodyText: { fill: MUTED_TEXT_COLOR, text: 'Body' },
    },
  },
  {
    id: 'image',
    position: { x: 170, y: 220 },
    size: { width: 60, height: 60 },
    type: 'standard.Image',
    attrs: {
      image: { xlinkHref: 'https://picsum.photos/60/60?random=1' },
      label: { fill: TEXT_COLOR, text: 'Image' },
    },
  },
  {
    id: 'bordered-image',
    position: { x: 260, y: 220 },
    size: { width: 70, height: 70 },
    type: 'standard.BorderedImage',
    attrs: {
      border: { stroke: NODE_STROKE, strokeWidth: 3 },
      background: { fill: NODE_FILL },
      image: { xlinkHref: 'https://picsum.photos/70/70?random=2' },
      label: { fill: TEXT_COLOR, text: 'Bordered' },
    },
  },
  {
    id: 'embedded-image',
    position: { x: 360, y: 220 },
    size: { width: 150, height: 70 },
    type: 'standard.EmbeddedImage',
    attrs: {
      body: { ...BODY_ATTRS },
      image: { xlinkHref: 'https://picsum.photos/30/30?random=3' },
      label: { fill: TEXT_COLOR, text: 'Embedded' },
    },
  },
  // Row 4: More shapes and link targets
  {
    id: 'inscribed-image',
    position: { x: 20, y: 330 },
    size: { width: 70, height: 70 },
    type: 'standard.InscribedImage',
    attrs: {
      border: { stroke: NODE_STROKE },
      background: { fill: NODE_FILL },
      image: { xlinkHref: 'https://picsum.photos/50/50?random=4' },
      label: { fill: TEXT_COLOR, text: 'Inscribed' },
    },
  },
  {
    id: 'link-source',
    position: { x: 150, y: 350 },
    size: { width: 80, height: 40 },
    type: 'standard.Rectangle',
    attrs: { body: { ...BODY_ATTRS }, label: { fill: TEXT_COLOR, text: 'Source' } },
  },
  {
    id: 'link-target-1',
    position: { x: 350, y: 320 },
    size: { width: 80, height: 40 },
    type: 'standard.Rectangle',
    attrs: { body: { ...BODY_ATTRS }, label: { fill: TEXT_COLOR, text: 'Target 1' } },
  },
  {
    id: 'link-target-2',
    position: { x: 350, y: 420 },
    size: { width: 80, height: 40 },
    type: 'standard.Rectangle',
    attrs: { body: { ...BODY_ATTRS }, label: { fill: TEXT_COLOR, text: 'Target 2' } },
  },
  {
    id: 'link-target-3',
    position: { x: 520, y: 320 },
    size: { width: 80, height: 40 },
    type: 'standard.Rectangle',
    attrs: { body: { ...BODY_ATTRS }, label: { fill: TEXT_COLOR, text: 'Target 3' } },
  },
  {
    id: 'link-standard',
    source: { id: 'link-source' },
    target: { id: 'link-target-1' },
    type: 'standard.Link',
    attrs: { line: { stroke: LINK_COLOR } },
    labels: [darkLinkLabel('Link')],
  },
  {
    id: 'link-double',
    source: { id: 'link-source' },
    target: { id: 'link-target-2' },
    type: 'standard.DoubleLink',
    // The thin inner line reads as the gap between the two outline strokes.
    attrs: {
      outline: { stroke: LINK_COLOR },
      line: { stroke: NODE_FILL, targetMarker: { stroke: LINK_COLOR } },
    },
    labels: [darkLinkLabel('DoubleLink')],
  },
  {
    id: 'link-shadow',
    source: { id: 'link-target-1' },
    target: { id: 'link-target-3' },
    type: 'standard.ShadowLink',
    attrs: { line: { stroke: LINK_COLOR } },
    labels: [darkLinkLabel('ShadowLink')],
  },
];

export default function App() {
  return (
    <GraphProvider initialCells={initialCells}>
      <Paper className="size-full" interactive />
    </GraphProvider>
  );
}
