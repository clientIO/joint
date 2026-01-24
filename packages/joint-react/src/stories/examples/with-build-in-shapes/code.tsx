/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import type { dia } from '@joint/core';
import '../index.css';
import {
  GraphProvider,
  Paper,
  type GraphElement,
  type GraphLink,
  type ElementToGraphOptions,
  type LinkToGraphOptions,
} from '@joint/react';

interface NativeElement extends GraphElement {
  readonly type: string;
}

interface NativeLink extends GraphLink {
  readonly type: string;
}

const mapDataToElementAttributes = ({
  data,
  defaultAttributes,
}: ElementToGraphOptions<GraphElement>): dia.Cell.JSON => {
  const result = defaultAttributes();
  const nativeElement = data as NativeElement;
  return { ...result, type: nativeElement.type };
};

const mapDataToLinkAttributes = ({
  data,
  defaultAttributes,
}: LinkToGraphOptions<GraphLink>): dia.Cell.JSON => {
  const result = defaultAttributes();
  if (data.type) {
    return { ...result, type: data.type };
  }
  return result;
};

const SECONDARY = '#6366f1';

const initialElements: NativeElement[] = [
  // Row 1: Basic shapes
  {
    id: 'rectangle',
    x: 20,
    y: 20,
    width: 100,
    height: 50,
    type: 'standard.Rectangle',
    attrs: {
      body: { fill: PRIMARY },
      label: { text: 'Rectangle', fill: 'white' },
    },
  },
  {
    id: 'circle',
    x: 150,
    y: 20,
    width: 60,
    height: 60,
    type: 'standard.Circle',
    attrs: {
      body: { fill: SECONDARY },
      label: { text: 'Circle', fill: 'white' },
    },
  },
  {
    id: 'ellipse',
    x: 240,
    y: 20,
    width: 100,
    height: 50,
    type: 'standard.Ellipse',
    attrs: {
      body: { fill: PRIMARY },
      label: { text: 'Ellipse', fill: 'white' },
    },
  },
  {
    id: 'cylinder',
    x: 370,
    y: 10,
    width: 60,
    height: 70,
    type: 'standard.Cylinder',
    attrs: {
      body: { fill: SECONDARY },
      top: { fill: '#4f46e5' },
    },
  },
  // Row 2: Path shapes
  {
    id: 'path',
    x: 20,
    y: 110,
    width: 80,
    height: 80,
    type: 'standard.Path',
    attrs: {
      body: {
        d: 'M 0 20 L 40 0 L 80 20 L 80 60 L 40 80 L 0 60 Z',
        fill: PRIMARY,
      },
      label: { text: 'Path', fill: 'white' },
    },
  },
  {
    id: 'polygon',
    x: 130,
    y: 110,
    width: 80,
    height: 80,
    type: 'standard.Polygon',
    attrs: {
      body: {
        points: '40,0 80,30 65,80 15,80 0,30',
        fill: SECONDARY,
      },
      label: { text: 'Polygon', fill: 'white' },
    },
  },
  {
    id: 'polyline',
    x: 240,
    y: 110,
    width: 100,
    height: 80,
    type: 'standard.Polyline',
    attrs: {
      body: {
        points: '0,40 25,0 50,40 75,0 100,40',
        fill: 'none',
        stroke: PRIMARY,
        strokeWidth: 3,
      },
      label: { text: 'Polyline', y: 70, fill: 'white' },
    },
  },
  {
    id: 'textblock',
    x: 370,
    y: 110,
    width: 100,
    height: 60,
    type: 'standard.TextBlock',
    attrs: {
      body: { fill: '#f3f4f6', stroke: PRIMARY },
      label: { text: 'TextBlock\nwith wrap', style: { color: PRIMARY } },
    },
  },
  // Row 3: Headered and Image shapes
  {
    id: 'headered',
    x: 20,
    y: 220,
    width: 120,
    height: 80,
    type: 'standard.HeaderedRectangle',
    attrs: {
      header: { fill: PRIMARY },
      headerText: { text: 'Header', fill: 'white' },
      body: { fill: '#e5e7eb' },
      bodyText: { text: 'Body', fill: '#374151' },
    },
  },
  {
    id: 'image',
    x: 170,
    y: 220,
    width: 60,
    height: 60,
    type: 'standard.Image',
    attrs: {
      image: {
        xlinkHref: 'https://picsum.photos/60/60?random=1',
      },
      label: { text: 'Image', fill: 'white' },
    },
  },
  {
    id: 'bordered-image',
    x: 260,
    y: 220,
    width: 70,
    height: 70,
    type: 'standard.BorderedImage',
    attrs: {
      border: { stroke: PRIMARY, strokeWidth: 3 },
      image: {
        xlinkHref: 'https://picsum.photos/70/70?random=2',
      },
      label: { text: 'Bordered', fill: 'white' },
    },
  },
  {
    id: 'embedded-image',
    x: 360,
    y: 220,
    width: 100,
    height: 70,
    type: 'standard.EmbeddedImage',
    attrs: {
      body: { fill: '#f3f4f6', stroke: SECONDARY },
      image: {
        xlinkHref: 'https://picsum.photos/30/30?random=3',
      },
      label: { text: 'Embedded', fill: '#374151' },
    },
  },
  // Row 4: More shapes and link targets
  {
    id: 'inscribed-image',
    x: 20,
    y: 330,
    width: 70,
    height: 70,
    type: 'standard.InscribedImage',
    attrs: {
      border: { stroke: PRIMARY, strokeWidth: 2 },
      background: { fill: '#e5e7eb' },
      image: {
        xlinkHref: 'https://picsum.photos/50/50?random=4',
      },
      label: { text: 'Inscribed', fill: 'white' },
    },
  },
  {
    id: 'link-source',
    x: 150,
    y: 350,
    width: 80,
    height: 40,
    type: 'standard.Rectangle',
    attrs: {
      body: { fill: PRIMARY },
      label: { text: 'Source', fill: 'white' },
    },
  },
  {
    id: 'link-target-1',
    x: 350,
    y: 320,
    width: 80,
    height: 40,
    type: 'standard.Rectangle',
    attrs: {
      body: { fill: SECONDARY },
      label: { text: 'Target 1', fill: 'white' },
    },
  },
  {
    id: 'link-target-2',
    x: 350,
    y: 420,
    width: 80,
    height: 40,
    type: 'standard.Rectangle',
    attrs: {
      body: { fill: PRIMARY },
      label: { text: 'Target 2', fill: 'white' },
    },
  },
  {
    id: 'link-target-3',
    x: 520,
    y: 320,
    width: 80,
    height: 40,
    type: 'standard.Rectangle',
    attrs: {
      body: { fill: SECONDARY },
      label: { text: 'Target 3', fill: 'white' },
    },
  },
];

const initialLinks: NativeLink[] = [
  {
    id: 'link-standard',
    source: 'link-source',
    target: 'link-target-1',
    type: 'standard.Link',
    attrs: {
      line: { stroke: PRIMARY, strokeWidth: 2 },
    },
    labels: [{ attrs: { text: { text: 'Link' } } }],
  },
  {
    id: 'link-double',
    source: 'link-source',
    target: 'link-target-2',
    type: 'standard.DoubleLink',
    attrs: {
      line: { stroke: SECONDARY },
      outline: { stroke: '#c7d2fe' },
    },
    labels: [{ attrs: { text: { text: 'DoubleLink' } } }],
  },
  {
    id: 'link-shadow',
    source: 'link-target-1',
    target: 'link-target-3',
    type: 'standard.ShadowLink',
    attrs: {
      line: { stroke: PRIMARY },
      shadow: { stroke: '#9ca3af' },
    },
    labels: [{ attrs: { text: { text: 'ShadowLink' } } }],
  },
];

function Main() {
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper width="100%" className={PAPER_CLASSNAME} height={500} />
    </div>
  );
}

export default function App() {
  return (
    <GraphProvider
      elements={initialElements}
      links={initialLinks}
      mapDataToElementAttributes={mapDataToElementAttributes}
      mapDataToLinkAttributes={mapDataToLinkAttributes}
    >
      <Main />
    </GraphProvider>
  );
}
