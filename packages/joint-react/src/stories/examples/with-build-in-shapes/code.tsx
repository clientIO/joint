/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import { util } from '@joint/core';
import '../index.css';
import {
  GraphProvider,
  Paper,
  useFlatElementData,
  useFlatLinkData,
  type FlatElementData,
  type FlatLinkData,
} from '@joint/react';

interface NativeElement extends FlatElementData {
  readonly type: string;
  readonly label?: string;
  readonly attrs?: Record<string, Record<string, unknown>>;
}

interface NativeLink extends FlatLinkData {
  readonly type: string;
  readonly label?: string;
  readonly attrs?: Record<string, Record<string, unknown>>;
}

const SECONDARY = '#6366f1';

const initialElements: Record<string, NativeElement> = {
  // Row 1: Basic shapes
  rectangle: {
    x: 20, y: 20, width: 100, height: 50,
    type: 'standard.Rectangle',
    label: 'Rectangle',
    attrs: { body: { fill: PRIMARY }, label: { fill: 'white' } },
  },
  circle: {
    x: 150, y: 20, width: 60, height: 60,
    type: 'standard.Circle',
    label: 'Circle',
    attrs: { body: { fill: SECONDARY, stroke: '#333333' }, label: { fill: 'white' } },
  },
  ellipse: {
    x: 240, y: 20, width: 100, height: 50,
    type: 'standard.Ellipse',
    label: 'Ellipse',
    attrs: { body: { fill: PRIMARY, stroke: '#333333' }, label: { fill: 'white' } },
  },
  cylinder: {
    x: 370, y: 10, width: 60, height: 70,
    type: 'standard.Cylinder',
    attrs: { body: { fill: SECONDARY }, top: { fill: '#4f46e5' } },
  },
  // Row 2: Path shapes
  path: {
    x: 20, y: 110, width: 80, height: 80,
    type: 'standard.Path',
    label: 'Path',
    attrs: {
      body: { d: 'M 0 20 L 40 0 L 80 20 L 80 60 L 40 80 L 0 60 Z', fill: PRIMARY, stroke: '#333333' },
      label: { fill: 'white' },
    },
  },
  polygon: {
    x: 130, y: 110, width: 80, height: 80,
    type: 'standard.Polygon',
    label: 'Polygon',
    attrs: {
      body: { points: '40,0 80,30 65,80 15,80 0,30', fill: SECONDARY, stroke: '#333333' },
      label: { fill: 'white' },
    },
  },
  polyline: {
    x: 240, y: 110, width: 100, height: 80,
    type: 'standard.Polyline',
    label: 'Polyline',
    attrs: {
      body: { points: '0,40 25,0 50,40 75,0 100,40', strokeWidth: 3, stroke: PRIMARY, fill: 'none', pointerEvents: 'all' },
      label: { y: 70, fill: 'white' },
    },
  },
  textblock: {
    x: 370, y: 110, width: 100, height: 60,
    type: 'standard.TextBlock',
    attrs: {
      body: { stroke: PRIMARY, fill: '#f3f4f6' },
      label: { text: 'TextBlock\nwith wrap', style: { fontSize: 14, color: PRIMARY } },
    },
  },
  // Row 3: Headered and Image shapes
  headered: {
    x: 20, y: 220, width: 120, height: 80,
    type: 'standard.HeaderedRectangle',
    attrs: {
      body: { fill: '#e5e7eb' },
      header: { fill: PRIMARY },
      headerText: { fill: 'white', text: 'Header' },
      bodyText: { fill: '#374151', text: 'Body' },
    },
  },
  image: {
    x: 170, y: 220, width: 60, height: 60,
    type: 'standard.Image',
    label: 'Image',
    attrs: {
      image: { xlinkHref: 'https://picsum.photos/60/60?random=1' },
      label: { fill: 'white' },
    },
  },
  'bordered-image': {
    x: 260, y: 220, width: 70, height: 70,
    type: 'standard.BorderedImage',
    label: 'Bordered',
    attrs: {
      border: { stroke: PRIMARY, strokeWidth: 3 },
      image: { xlinkHref: 'https://picsum.photos/70/70?random=2' },
      label: { fill: 'white' },
    },
  },
  'embedded-image': {
    x: 360, y: 220, width: 150, height: 70,
    type: 'standard.EmbeddedImage',
    label: 'Embedded',
    attrs: {
      body: { stroke: SECONDARY, fill: '#f3f4f6' },
      image: { xlinkHref: 'https://picsum.photos/30/30?random=3' },
      label: { fill: '#374151' },
    },
  },
  // Row 4: More shapes and link targets
  'inscribed-image': {
    x: 20, y: 330, width: 70, height: 70,
    type: 'standard.InscribedImage',
    label: 'Inscribed',
    attrs: {
      border: { stroke: PRIMARY },
      background: { fill: '#e5e7eb' },
      image: { xlinkHref: 'https://picsum.photos/50/50?random=4' },
      label: { fill: 'white' },
    },
  },
  'link-source': {
    x: 150, y: 350, width: 80, height: 40,
    type: 'standard.Rectangle',
    label: 'Source',
    attrs: { body: { fill: PRIMARY }, label: { fill: 'white' } },
  },
  'link-target-1': {
    x: 350, y: 320, width: 80, height: 40,
    type: 'standard.Rectangle',
    label: 'Target 1',
    attrs: { body: { fill: SECONDARY }, label: { fill: 'white' } },
  },
  'link-target-2': {
    x: 350, y: 420, width: 80, height: 40,
    type: 'standard.Rectangle',
    label: 'Target 2',
    attrs: { body: { fill: PRIMARY }, label: { fill: 'white' } },
  },
  'link-target-3': {
    x: 520, y: 320, width: 80, height: 40,
    type: 'standard.Rectangle',
    label: 'Target 3',
    attrs: { body: { fill: SECONDARY }, label: { fill: 'white' } },
  },
};

const initialLinks: Record<string, NativeLink> = {
  'link-standard': {
    source: 'link-source',
    target: 'link-target-1',
    type: 'standard.Link',
    label: 'Link',
    attrs: { line: { stroke: PRIMARY } },
  },
  'link-double': {
    source: 'link-source',
    target: 'link-target-2',
    type: 'standard.DoubleLink',
    label: 'DoubleLink',
    attrs: { line: { stroke: SECONDARY }, outline: { stroke: '#c7d2fe' } },
  },
  'link-shadow': {
    source: 'link-target-1',
    target: 'link-target-3',
    type: 'standard.ShadowLink',
    label: 'ShadowLink',
    attrs: { line: { stroke: PRIMARY }, shadow: { stroke: '#9ca3af' } },
  },
};

function Main() {
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper className={PAPER_CLASSNAME} height={500} />
    </div>
  );
}

export default function App() {
  const elementMappers = useFlatElementData({
    mapAttributes: ({ attributes, data: rawData, graph }) => {
      const data = rawData as NativeElement;
      return {
        ...attributes,
        type: data.type,
        attrs: util.defaultsDeep(
          { label: { text: data.label || '' }},
          data.attrs || {},
          graph.getTypeDefaults(data.type).attrs || {},
        ),
      };
    },
  }, []);

  const linkMappers = useFlatLinkData({
    mapAttributes: ({ attributes, data: rawData, graph }) => {
      const data = rawData as NativeLink;
      return {
        ...attributes,
        type: data.type,
        attrs: util.defaultsDeep({}, data.attrs || {}, graph.getTypeDefaults(data.type).attrs || {}),
        ...(data.label && { labels: [{ attrs: { text: { text: data.label } } }] }),
      };
    },
  }, []);

  return (
    <GraphProvider
      elements={initialElements as Record<string, FlatElementData>}
      links={initialLinks as Record<string, FlatLinkData>}
      {...elementMappers}
      {...linkMappers}
    >
      <Main />
    </GraphProvider>
  );
}
