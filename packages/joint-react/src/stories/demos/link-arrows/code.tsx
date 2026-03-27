/* eslint-disable react-perf/jsx-no-new-object-as-prop */

import { useEffect, useId, useState } from 'react';
import { dia, util } from '@joint/core';
import type { FlatLinkData, LinkMarker } from '@joint/react';
import { GraphProvider, Paper, usePaperEvents, usePaper, jsx } from '@joint/react';
import { PAPER_CLASSNAME, BG } from 'storybook-config/theme';

const BG_COLOR = BG;
const FG_COLOR = 'white';

const markers: LinkMarker[] = [
  // #1
  jsx(
    <path
      d="M 0 0 L 12 -4 L 5 0 L 12 4 z"
      fill="context-stroke"
      stroke="context-stroke"
      stroke-width="2"
    />
  ),
  // #2
  jsx(
    <path
      d="M 0 0 L 12 -4 L 5 0 L 12 4 z"
      fill="context-stroke"
      stroke="context-stroke"
      stroke-width="2"
      stroke-linejoin="round"
    />
  ),
  // #3
  jsx(
    <path d="M 0 0 L 8 -4 L 8 4 z" fill="context-stroke" stroke="context-stroke" stroke-width="2" />
  ),
  // #4
  jsx(
    <path d="M -2 0 L 15 -4 V 4 z" fill="context-stroke" stroke="context-stroke" stroke-width="1" />
  ),
  // #5
  jsx(
    <path
      d="M 0 0 L 12 -4 L 5 0 L 12 4 z"
      fill="context-stroke"
      stroke="context-stroke"
      stroke-width="2"
    />
  ),
  // #6
  jsx(<path d="M 10 3 L 0 0 L 10 -3" fill="none" stroke="context-stroke" stroke-width="2" />),
  // #7
  jsx(
    <path
      d="M 10 3 L 0 0 L 10 -3"
      fill="none"
      stroke="context-stroke"
      stroke-width="2"
      stroke-linejoin="round"
      stroke-linecap="round"
    />
  ),
  // #8
  jsx(
    <path d="M 0 0 L 8 -4 L 8 4 z" fill="context-stroke" stroke="context-stroke" stroke-width="2" />
  ),
  // #9
  jsx(
    <path d="M -3 0 L 10 -3 V 3 z" fill="context-stroke" stroke="context-stroke" stroke-width="2" />
  ),
  // #10
  jsx(
    <path
      d="M 0 0 L 12 -4 C 8 0 8 0 12 4 z"
      fill="context-stroke"
      stroke="context-stroke"
      stroke-width="2"
    />
  ),
  // #11
  jsx(
    <path
      d="M 0 0 L 15 -5 C 4 0 4 0 15 5 z"
      fill={BG_COLOR}
      stroke="context-stroke"
      stroke-width="2"
    />
  ),
  // #12
  jsx(
    <path
      d="M 0 0 L 12 -5 C 10 0 10 0 12 5 z"
      fill="context-stroke"
      stroke="context-stroke"
      stroke-width="2"
    />
  ),
  // #13
  jsx(<path d="M -5 -10 C 0 -5 0 5 -5 10 L 10 0 z" fill="context-stroke" stroke-width="0" />),
  // #14
  jsx(
    <path
      d="M 0 0 L 12 -8 C 8 0 8 0 12 8 z"
      fill="context-stroke"
      stroke="context-stroke"
      stroke-width="2"
    />
  ),
  // #15
  jsx(<path d="M 0 0 L 10 4" stroke="context-stroke" stroke-width="2" stroke-linecap="round" />),
  // #16
  jsx(
    <path d="M 0 0 L 8 -5 V 0 z" fill="context-stroke" stroke="context-stroke" stroke-width="2" />
  ),
  // #17
  jsx(
    <path
      d="M 0 0 L 8 -5 V 0 z"
      fill="context-stroke"
      stroke="context-stroke"
      stroke-width="2"
      stroke-linejoin="round"
    />
  ),
  // #18
  jsx(
    <path
      d="M 0 0 L 5 -5 L 10 0 L 5 5 z"
      fill="context-stroke"
      stroke="context-stroke"
      stroke-width="2"
    />
  ),
  // #19
  jsx(
    <path
      d="M 0 0 L 5 -5 L 10 0 L 5 5 z"
      fill="context-stroke"
      stroke="context-stroke"
      stroke-width="2"
      stroke-linejoin="round"
    />
  ),
  // #20
  jsx(
    <path
      d="M 0 0 L 5 -5 L 10 0 L 5 5 z"
      fill="context-stroke"
      stroke="context-stroke"
      stroke-width="2"
      stroke-linejoin="bevel"
    />
  ),
  // #21
  jsx(
    <path
      d="M 0 0 L 6 -3 L 12 0 L 6 3 z"
      fill="context-stroke"
      stroke="context-stroke"
      stroke-width="2"
    />
  ),
  // #22
  jsx(
    <path
      d="M 0 0 L 6 -3 L 12 0 L 6 3 z"
      fill="context-stroke"
      stroke="context-stroke"
      stroke-width="2"
      stroke-linejoin="round"
    />
  ),
  // #23
  jsx(<circle r="4" fill="context-stroke" stroke="context-stroke" stroke-width="2" />),
  // #24
  jsx(<path d="M 0 -5 V 5" fill="context-stroke" stroke="context-stroke" stroke-width="2" />),
  // #25
  jsx(<path d="M 5 -5 V 5" fill="none" stroke="context-stroke" stroke-width="2" />),
  // #26
  jsx(
    <path
      d="M 5 -5 V 5 M 10 -5 V 5"
      fill="context-stroke"
      stroke="context-stroke"
      stroke-width="2"
    />
  ),
  // #27
  jsx(<path d="M 0 -4 L 10 0 M 0 4 L 10 0" stroke="context-stroke" stroke-width="2" />),
  // #28
  jsx(
    <path
      d="M 0 -4 h 10 v 4 M 0 4 h 10 v -4"
      fill="none"
      stroke="context-stroke"
      stroke-width="2"
    />
  ),
  // #29
  jsx(
    <path
      d="M 0 -4 h 10 v 4 M 0 4 h 10 v -4 M 10 0 0 0"
      fill="none"
      stroke="context-stroke"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  ),
  // #30
  jsx(
    <>
      <path d="M 5 -5 V 5" fill="none" stroke="context-stroke" stroke-width="2" />
      <circle cx="14" r="4" fill={BG_COLOR} stroke="context-stroke" stroke-width="2" />
    </>
  ),
  // #31
  jsx(<path d="M 0 -4 L 10 0 M 0 4 L 10 0 M 10 -5 V 5" stroke="context-stroke" stroke-width="2" />),
  // #32
  jsx(<path d="M 3 -5 L 12 5" stroke="context-stroke" stroke-width="2" />),
  // #33
  jsx(<path d="M 3 -5 L 12 5 M 3 5 L 12 -5" stroke="context-stroke" stroke-width="2" />),
  // #34
  jsx(<path d="M 0 0 L 8 -5 V 0 z" fill={BG_COLOR} stroke="context-stroke" stroke-width="2" />),
  // #35
  jsx(<circle r="3" fill={BG_COLOR} stroke="context-stroke" stroke-width="2" />),
  // #36
  jsx(
    <path
      d="M 0 0 L 5 -5 L 10 0 L 5 5 z"
      fill={BG_COLOR}
      stroke="context-stroke"
      stroke-width="2"
    />
  ),
  // #37
  jsx(
    <path
      d="M 0 0 L 6 -3 L 12 0 L 6 3 z"
      fill={BG_COLOR}
      stroke="context-stroke"
      stroke-width="2"
    />
  ),
  // #38
  jsx(
    <>
      <circle r="8" cx="4" fill={BG_COLOR} stroke="context-stroke" stroke-width="2" />
      <path d="M -4 0 H 12 M 4 -8 V 8" fill="none" stroke="context-stroke" stroke-width="2" />
    </>
  ),
  // #39
  jsx(<circle r="8" cx="-4" fill={BG_COLOR} stroke="context-stroke" stroke-width="2" />),
  // #40
  jsx(
    <rect
      x="-5"
      y="-5"
      width="10"
      height="10"
      fill={BG_COLOR}
      stroke="context-stroke"
      stroke-width="2"
    />
  ),
  // #41
  jsx(
    <rect
      x="5"
      y="-5"
      width="10"
      height="10"
      fill="none"
      stroke="context-stroke"
      stroke-width="2"
    />
  ),
  // #42
  jsx(
    <path d="M -10 -10 C 3 -10 3 10 -10 10" fill="none" stroke="context-stroke" stroke-width="2" />
  ),
  // #43
  jsx(
    <>
      <path
        d="M 0 -4 L 10 0 M 0 4 L 10 0 M 0 0 H 10"
        fill="none"
        stroke="context-stroke"
        stroke-width="2"
      />
      <circle cx="14" r="3" fill={BG_COLOR} stroke="context-stroke" stroke-width="2" />
    </>
  ),
  // #44
  jsx(
    <>
      <path d="M 10 0 L 0 0" stroke={BG_COLOR} stroke-width="3" />
      <path d="M 0 0 L 8 -4 V 4 z" fill={BG_COLOR} stroke="context-stroke" stroke-width="2" />
      <path d="M 10 0 L 18 -4 V 4 z" fill={BG_COLOR} stroke="context-stroke" stroke-width="2" />
    </>
  ),
  // #45
  jsx(
    <polyline points="-2,0 8,-5 8,-2 17,-5 17,5 8,2 8,5 -2,0" fill="context-stroke" stroke="none" />
  ),
  // #46
  jsx(
    <>
      <rect
        x="-25"
        width="50"
        height="25"
        rx="2"
        ry="2"
        transform="rotate(-90)"
        fill={BG_COLOR}
        stroke="context-stroke"
        stroke-width="2"
      />
      <image
        x="-25"
        width="50"
        height="25"
        transform="rotate(-90)"
        href="https://assets.codepen.io/7589991/jj-logo-black.svg"
      />
    </>
  ),
  // #47
  jsx(
    <>
      <rect
        x="-25"
        width="50"
        height="25"
        rx="2"
        ry="2"
        transform="rotate(-90)"
        fill={BG_COLOR}
        stroke="#0075f2"
        stroke-width="2"
      />
      <image
        x="-25"
        width="50"
        height="25"
        transform="rotate(-90)"
        href="https://assets.codepen.io/7589991/jj-logo-red.svg"
      />
    </>
  ),
  // #48
  jsx(
    <>
      <path d="M -4 0 H 12 M 4 -8 V 8" stroke="#ed2637" stroke-width="2" fill="none" />
      <circle r="8" cx="4" fill="none" stroke="#0075f2" stroke-width="2" />
    </>
  ),
  // #49
  jsx(
    <>
      <path
        d="M 0 -4 L 10 0 M 0 4 L 10 0 M 0 0 H 10"
        stroke="#0075f2"
        stroke-width="2"
        fill="none"
      />
      <circle cx="14" r="3" fill={BG_COLOR} stroke="#ed2637" stroke-width="2" />
    </>
  ),
  // #50
  jsx(
    <>
      <path d="M 10 0 L 0 0" stroke={BG_COLOR} stroke-width="3" />
      <path d="M -2 0 L 8 -6 V 6 z" stroke="none" fill="#ed2637" />
      <path d="M 8 0 L 18 -6 V 6 z" stroke="none" fill="#0075f2" />
    </>
  ),
];

const MARGIN = 30;
const LINKS_PER_ROW = 10;
const LINK_BBOX_WIDTH = 40;
const LINK_BBOX_HEIGHT = 100;

function buildLinks(): Record<string, FlatLinkData> {
  const links: Record<string, FlatLinkData> = {};
  for (const [index, marker] of markers.entries()) {
    const col = index % LINKS_PER_ROW;
    const row = Math.floor(index / LINKS_PER_ROW);
    const x = col * (MARGIN + LINK_BBOX_WIDTH);
    const y = row * (MARGIN + LINK_BBOX_HEIGHT);
    links[`marker-${index + 1}`] = {
      source: { x, y },
      target: { x: x + LINK_BBOX_WIDTH, y: y + LINK_BBOX_HEIGHT },
      color: FG_COLOR,
      width: 2,
      sourceMarker: marker,
      targetMarker: marker,
    };
  }
  return links;
}

const links = buildLinks();

// Custom highlighter that shows a text label next to the link
const TextHighlighter = dia.HighlighterView.extend({
  tagName: 'text',
  attributes: {
    fill: '#ed2637',
    pointerEvents: 'none',
    textAnchor: 'middle',
    fontSize: 8,
    fontFamily: 'sans-serif',
    opacity: 0,
  },
  style: {
    transition: 'opacity 0.3s 0.6s ease',
  },
  highlight(linkView: dia.LinkView) {
    const { text = '', ratio = 0.5, dx = 0, dy = 0 } = this.options;
    const point = linkView.getPointAtRatio(ratio);
    this.vel.text(text || '', { textVerticalAnchor: 'middle' });
    this.vel.attr('transform', `translate(${point.x + dx} ${point.y + dy})`);
    util.nextFrame(() => this.vel.attr('opacity', 1));
  },
});

type ZoomState =
  | { type: 'overview' }
  | { type: 'link'; link: dia.Link }
  | { type: 'arrow'; link: dia.Link };

function zoomToFit(paper: dia.Paper, contentArea: dia.BBox | null = paper.model.getBBox()) {
  paper.transformToFitContent({
    ...(contentArea && { contentArea }),
    padding: 50,
    horizontalAlign: 'middle',
    verticalAlign: 'middle',
  });
}

function Main() {
  const paperId = useId();
  const { paper } = usePaper(paperId);
  const [zoom, setZoom] = useState<ZoomState>({ type: 'overview' });

  // Enable smooth zoom transitions once paper is ready
  useEffect(() => {
    if (!paper) return;
    paper.layers.style.transition = 'transform 250ms';
    zoomToFit(paper);
  }, [paper]);

  // React to zoom state changes
  useEffect(() => {
    if (!paper) return;
    if (zoom.type === 'overview') {
      TextHighlighter.removeAll(paper, 'number');
      zoomToFit(paper);
    } else if (zoom.type === 'link') {
      const bbox = zoom.link.getBBox().inflate(20);
      zoomToFit(paper, bbox);
      TextHighlighter.removeAll(paper, 'number');
      const number = Number.parseInt(String(zoom.link.id).replace('marker-', ''), 10);
      TextHighlighter.add(zoom.link.findView(paper), 'root', 'number', {
        layer: dia.Paper.Layers.FRONT,
        text: `#${number}`,
        ratio: 0,
        dx: -20,
        dy: -10,
      });
    } else {
      const bbox = zoom.link.getBBox();
      bbox.x -= LINK_BBOX_WIDTH / 2;
      bbox.y -= 15;
      bbox.height = LINK_BBOX_HEIGHT / 2;
      zoomToFit(paper, bbox);
    }
  }, [zoom, paper]);

  usePaperEvents(paperId, {
    'link:pointerdown': (linkView: dia.LinkView) => {
      const link = linkView.model;
      setZoom((previous) => {
        if (previous.type === 'link' && previous.link === link) {
          return { type: 'arrow', link };
        }
        return { type: 'link', link };
      });
    },
    'blank:pointerdown': () => setZoom({ type: 'overview' }),
  });

  return (
    <Paper
      id={paperId}
      className={`${PAPER_CLASSNAME} h-150`}
      width="100%"
      interactive={false}
      sorting={dia.Paper.sorting.NONE}
      style={{ background: BG_COLOR }}
    />
  );
}

export default function App() {
  return (
    <GraphProvider links={links}>
      <Main />
    </GraphProvider>
  );
}
