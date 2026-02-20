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
  const { type, attrs } = data as NativeElement;
  return {
    ...result,
    ...(type && { type }),
    ...(attrs && { attrs }),
  };
};

const mapDataToLinkAttributes = ({
  data,
  defaultAttributes,
}: LinkToGraphOptions<GraphLink>): dia.Cell.JSON => {
  const result = defaultAttributes();
  const { type, attrs, labels } = data as NativeLink;
  return {
    ...result,
    ...(type && { type }),
    ...(attrs && { attrs }),
    ...(labels && { labels }),
  };
};

const SECONDARY = '#6366f1';

const CYLINDER_TILT = 10;

const initialElements: Record<string, NativeElement> = {
  // Row 1: Basic shapes
  rectangle: {
    x: 20,
    y: 20,
    width: 100,
    height: 50,
    type: 'standard.Rectangle',
    attrs: {
      body: {
        width: 'calc(w)',
        height: 'calc(h)',
        strokeWidth: 2,
        stroke: '#000000',
        fill: PRIMARY,
      },
      label: {
        textVerticalAnchor: 'middle',
        textAnchor: 'middle',
        x: 'calc(w/2)',
        y: 'calc(h/2)',
        fontSize: 14,
        fill: 'white',
        text: 'Rectangle',
      },
    },
  },
  circle: {
    x: 150,
    y: 20,
    width: 60,
    height: 60,
    type: 'standard.Circle',
    attrs: {
      body: {
        cx: 'calc(s/2)',
        cy: 'calc(s/2)',
        r: 'calc(s/2)',
        strokeWidth: 2,
        stroke: '#333333',
        fill: SECONDARY,
      },
      label: {
        textVerticalAnchor: 'middle',
        textAnchor: 'middle',
        x: 'calc(w/2)',
        y: 'calc(h/2)',
        fontSize: 14,
        fill: 'white',
        text: 'Circle',
      },
    },
  },
  ellipse: {
    x: 240,
    y: 20,
    width: 100,
    height: 50,
    type: 'standard.Ellipse',
    attrs: {
      body: {
        cx: 'calc(w/2)',
        cy: 'calc(h/2)',
        rx: 'calc(w/2)',
        ry: 'calc(h/2)',
        strokeWidth: 2,
        stroke: '#333333',
        fill: PRIMARY,
      },
      label: {
        textVerticalAnchor: 'middle',
        textAnchor: 'middle',
        x: 'calc(w/2)',
        y: 'calc(h/2)',
        fontSize: 14,
        fill: 'white',
        text: 'Ellipse',
      },
    },
  },
  cylinder: {
    x: 370,
    y: 10,
    width: 60,
    height: 70,
    type: 'standard.Cylinder',
    attrs: {
      body: {
        lateralArea: CYLINDER_TILT,
        fill: SECONDARY,
        stroke: '#333333',
        strokeWidth: 2,
      },
      top: {
        cx: 'calc(w/2)',
        cy: CYLINDER_TILT,
        rx: 'calc(w/2)',
        ry: CYLINDER_TILT,
        fill: '#4f46e5',
        stroke: '#333333',
        strokeWidth: 2,
      },
    },
  },
  // Row 2: Path shapes
  path: {
    x: 20,
    y: 110,
    width: 80,
    height: 80,
    type: 'standard.Path',
    attrs: {
      body: {
        d: 'M 0 20 L 40 0 L 80 20 L 80 60 L 40 80 L 0 60 Z',
        strokeWidth: 2,
        stroke: '#333333',
        fill: PRIMARY,
      },
      label: {
        textVerticalAnchor: 'middle',
        textAnchor: 'middle',
        x: 'calc(w/2)',
        y: 'calc(h/2)',
        fontSize: 14,
        fill: 'white',
        text: 'Path',
      },
    },
  },
  polygon: {
    x: 130,
    y: 110,
    width: 80,
    height: 80,
    type: 'standard.Polygon',
    attrs: {
      body: {
        points: '40,0 80,30 65,80 15,80 0,30',
        strokeWidth: 2,
        stroke: '#333333',
        fill: SECONDARY,
      },
      label: {
        textVerticalAnchor: 'middle',
        textAnchor: 'middle',
        x: 'calc(w/2)',
        y: 'calc(h/2)',
        fontSize: 14,
        fill: 'white',
        text: 'Polygon',
      },
    },
  },
  polyline: {
    x: 240,
    y: 110,
    width: 100,
    height: 80,
    type: 'standard.Polyline',
    attrs: {
      body: {
        points: '0,40 25,0 50,40 75,0 100,40',
        strokeWidth: 3,
        stroke: PRIMARY,
        fill: 'none',
        pointerEvents: 'all',
      },
      label: {
        textVerticalAnchor: 'middle',
        textAnchor: 'middle',
        x: 'calc(w/2)',
        y: 70,
        fontSize: 14,
        fill: 'white',
        text: 'Polyline',
      },
    },
  },
  textblock: {
    x: 370,
    y: 110,
    width: 100,
    height: 60,
    type: 'standard.TextBlock',
    attrs: {
      body: {
        width: 'calc(w)',
        height: 'calc(h)',
        stroke: PRIMARY,
        fill: '#f3f4f6',
        strokeWidth: 2,
      },
      foreignObject: {
        width: 'calc(w)',
        height: 'calc(h)',
      },
      label: {
        text: 'TextBlock\nwith wrap',
        style: { fontSize: 14, color: PRIMARY },
      },
    },
  },
  // Row 3: Headered and Image shapes
  headered: {
    x: 20,
    y: 220,
    width: 120,
    height: 80,
    type: 'standard.HeaderedRectangle',
    attrs: {
      body: {
        width: 'calc(w)',
        height: 'calc(h)',
        strokeWidth: 2,
        stroke: '#000000',
        fill: '#e5e7eb',
      },
      header: {
        width: 'calc(w)',
        height: 30,
        strokeWidth: 2,
        stroke: '#000000',
        fill: PRIMARY,
      },
      headerText: {
        textVerticalAnchor: 'middle',
        textAnchor: 'middle',
        x: 'calc(w/2)',
        y: 15,
        fontSize: 16,
        fill: 'white',
        text: 'Header',
      },
      bodyText: {
        textVerticalAnchor: 'middle',
        textAnchor: 'middle',
        x: 'calc(w/2)',
        y: 'calc(h/2+15)',
        fontSize: 14,
        fill: '#374151',
        text: 'Body',
      },
    },
  },
  image: {
    x: 170,
    y: 220,
    width: 60,
    height: 60,
    type: 'standard.Image',
    attrs: {
      image: {
        width: 'calc(w)',
        height: 'calc(h)',
        xlinkHref: 'https://picsum.photos/60/60?random=1',
      },
      label: {
        textVerticalAnchor: 'top',
        textAnchor: 'middle',
        x: 'calc(w/2)',
        y: 'calc(h+10)',
        fontSize: 14,
        fill: 'white',
        text: 'Image',
      },
    },
  },
  'bordered-image': {
    x: 260,
    y: 220,
    width: 70,
    height: 70,
    type: 'standard.BorderedImage',
    attrs: {
      border: {
        width: 'calc(w)',
        height: 'calc(h)',
        stroke: PRIMARY,
        strokeWidth: 3,
      },
      background: {
        width: 'calc(w-1)',
        height: 'calc(h-1)',
        x: 0.5,
        y: 0.5,
        fill: '#FFFFFF',
      },
      image: {
        width: 'calc(w-1)',
        height: 'calc(h-1)',
        x: 0.5,
        y: 0.5,
        xlinkHref: 'https://picsum.photos/70/70?random=2',
      },
      label: {
        textVerticalAnchor: 'top',
        textAnchor: 'middle',
        x: 'calc(w/2)',
        y: 'calc(h+10)',
        fontSize: 14,
        fill: 'white',
        text: 'Bordered',
      },
    },
  },
  'embedded-image': {
    x: 360,
    y: 220,
    width: 150,
    height: 70,
    type: 'standard.EmbeddedImage',
    attrs: {
      body: {
        width: 'calc(w)',
        height: 'calc(h)',
        stroke: SECONDARY,
        fill: '#f3f4f6',
        strokeWidth: 2,
      },
      image: {
        width: 'calc(0.3*w)',
        height: 'calc(h-20)',
        x: 10,
        y: 10,
        preserveAspectRatio: 'xMidYMin',
        xlinkHref: 'https://picsum.photos/30/30?random=3',
      },
      label: {
        textVerticalAnchor: 'top',
        textAnchor: 'left',
        x: 'calc(0.3*w+20)',
        y: 10,
        fontSize: 14,
        fill: '#374151',
        text: 'Embedded',
      },
    },
  },
  // Row 4: More shapes and link targets
  'inscribed-image': {
    x: 20,
    y: 330,
    width: 70,
    height: 70,
    type: 'standard.InscribedImage',
    attrs: {
      border: {
        rx: 'calc(w/2)',
        ry: 'calc(h/2)',
        cx: 'calc(w/2)',
        cy: 'calc(h/2)',
        stroke: PRIMARY,
        strokeWidth: 2,
      },
      background: {
        rx: 'calc(w/2)',
        ry: 'calc(h/2)',
        cx: 'calc(w/2)',
        cy: 'calc(h/2)',
        fill: '#e5e7eb',
      },
      image: {
        width: 'calc(0.68*w)',
        height: 'calc(0.68*h)',
        x: 'calc(0.16*w)',
        y: 'calc(0.16*h)',
        preserveAspectRatio: 'xMidYMid',
        xlinkHref: 'https://picsum.photos/50/50?random=4',
      },
      label: {
        textVerticalAnchor: 'top',
        textAnchor: 'middle',
        x: 'calc(w/2)',
        y: 'calc(h+10)',
        fontSize: 14,
        fill: 'white',
        text: 'Inscribed',
      },
    },
  },
  'link-source': {
    x: 150,
    y: 350,
    width: 80,
    height: 40,
    type: 'standard.Rectangle',
    attrs: {
      body: {
        width: 'calc(w)',
        height: 'calc(h)',
        strokeWidth: 2,
        stroke: '#000000',
        fill: PRIMARY,
      },
      label: {
        textVerticalAnchor: 'middle',
        textAnchor: 'middle',
        x: 'calc(w/2)',
        y: 'calc(h/2)',
        fontSize: 14,
        fill: 'white',
        text: 'Source',
      },
    },
  },
  'link-target-1': {
    x: 350,
    y: 320,
    width: 80,
    height: 40,
    type: 'standard.Rectangle',
    attrs: {
      body: {
        width: 'calc(w)',
        height: 'calc(h)',
        strokeWidth: 2,
        stroke: '#000000',
        fill: SECONDARY,
      },
      label: {
        textVerticalAnchor: 'middle',
        textAnchor: 'middle',
        x: 'calc(w/2)',
        y: 'calc(h/2)',
        fontSize: 14,
        fill: 'white',
        text: 'Target 1',
      },
    },
  },
  'link-target-2': {
    x: 350,
    y: 420,
    width: 80,
    height: 40,
    type: 'standard.Rectangle',
    attrs: {
      body: {
        width: 'calc(w)',
        height: 'calc(h)',
        strokeWidth: 2,
        stroke: '#000000',
        fill: PRIMARY,
      },
      label: {
        textVerticalAnchor: 'middle',
        textAnchor: 'middle',
        x: 'calc(w/2)',
        y: 'calc(h/2)',
        fontSize: 14,
        fill: 'white',
        text: 'Target 2',
      },
    },
  },
  'link-target-3': {
    x: 520,
    y: 320,
    width: 80,
    height: 40,
    type: 'standard.Rectangle',
    attrs: {
      body: {
        width: 'calc(w)',
        height: 'calc(h)',
        strokeWidth: 2,
        stroke: '#000000',
        fill: SECONDARY,
      },
      label: {
        textVerticalAnchor: 'middle',
        textAnchor: 'middle',
        x: 'calc(w/2)',
        y: 'calc(h/2)',
        fontSize: 14,
        fill: 'white',
        text: 'Target 3',
      },
    },
  },
};

const initialLinks: Record<string, NativeLink> = {
  'link-standard': {
    source: 'link-source',
    target: 'link-target-1',
    type: 'standard.Link',
    attrs: {
      line: {
        connection: true,
        stroke: PRIMARY,
        strokeWidth: 2,
        strokeLinejoin: 'round',
        targetMarker: {
          type: 'path',
          d: 'M 10 -5 0 0 10 5 z',
        },
      },
      wrapper: {
        connection: true,
        strokeWidth: 10,
        strokeLinejoin: 'round',
      },
    },
    labels: [{ text: 'Link' }],
  },
  'link-double': {
    source: 'link-source',
    target: 'link-target-2',
    type: 'standard.DoubleLink',
    attrs: {
      line: {
        connection: true,
        stroke: SECONDARY,
        strokeWidth: 4,
        strokeLinejoin: 'round',
        targetMarker: {
          type: 'path',
          stroke: '#000000',
          d: 'M 10 -3 10 -10 -2 0 10 10 10 3',
        },
      },
      outline: {
        connection: true,
        stroke: '#c7d2fe',
        strokeWidth: 6,
        strokeLinejoin: 'round',
      },
    },
    labels: [{ text: 'DoubleLink' }],
  },
  'link-shadow': {
    source: 'link-target-1',
    target: 'link-target-3',
    type: 'standard.ShadowLink',
    attrs: {
      line: {
        connection: true,
        stroke: PRIMARY,
        strokeWidth: 20,
        strokeLinejoin: 'round',
        targetMarker: {
          type: 'path',
          stroke: 'none',
          d: 'M 0 -10 -10 0 0 10 z',
        },
        sourceMarker: {
          type: 'path',
          stroke: 'none',
          d: 'M -10 -10 0 0 -10 10 0 10 0 -10 z',
        },
      },
      shadow: {
        connection: true,
        transform: 'translate(3,6)',
        stroke: '#9ca3af',
        strokeOpacity: 0.2,
        strokeWidth: 20,
        strokeLinejoin: 'round',
        targetMarker: {
          type: 'path',
          d: 'M 0 -10 -10 0 0 10 z',
          stroke: 'none',
        },
        sourceMarker: {
          type: 'path',
          stroke: 'none',
          d: 'M -10 -10 0 0 -10 10 0 10 0 -10 z',
        },
      },
    },
    labels: [{ text: 'ShadowLink' }],
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
