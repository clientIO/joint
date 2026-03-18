/* eslint-disable react-perf/jsx-no-new-object-as-prop */

import { useEffect, useId, useState } from 'react';
import { dia, util } from '@joint/core';
import type { FlatLinkData } from '@joint/react';
import { GraphProvider, Paper, usePaperEvents, usePaper, jsx, useGraphEvents } from '@joint/react';
import { PAPER_CLASSNAME } from 'storybook-config/theme';

const BG_COLOR = '#f4f7f6';
const FG_COLOR = '#131e29';

const markers: dia.SVGMarkerJSON[] = [
  // #1
  { markup: jsx(<path d="M 0 0 L 12 -4 L 5 0 L 12 4 z" fill={FG_COLOR} stroke-width="2" />) },
  // #2
  { markup: jsx(<path d="M 0 0 L 12 -4 L 5 0 L 12 4 z" fill={FG_COLOR} stroke-width="2" stroke-linejoin="round" />) },
  // #3
  { markup: jsx(<path d="M 0 0 L 8 -4 L 8 4 z" stroke-width="2" fill={FG_COLOR} />) },
  // #4
  { markup: jsx(<path d="M -2 0 L 15 -4 V 4 z" stroke-width="1" fill={FG_COLOR} />) },
  // #5
  { markup: jsx(<path d="M 0 0 L 12 -4 L 5 0 L 12 4 z" stroke-width="2" fill={FG_COLOR} />) },
  // #6
  { markup: jsx(<path d="M 10 3 L 0 0 L 10 -3" fill="none" stroke-width="2" />) },
  // #7
  { markup: jsx(<path d="M 10 3 L 0 0 L 10 -3" fill="none" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />) },
  // #8
  { markup: jsx(<path d="M 0 0 L 8 -4 L 8 4 z" stroke-width="2" fill={FG_COLOR} />) },
  // #9
  { markup: jsx(<path d="M -3 0 L 10 -3 V 3 z" stroke-width="2" fill={FG_COLOR} />) },
  // #10
  { markup: jsx(<path d="M 0 0 L 12 -4 C 8 0 8 0 12 4 z" stroke-width="2" fill={FG_COLOR} />) },
  // #11
  { markup: jsx(<path d="M 0 0 L 15 -5 C 4 0 4 0 15 5 z" stroke-width="2" fill={BG_COLOR} />) },
  // #12
  { markup: jsx(<path d="M 0 0 L 12 -5 C 10 0 10 0 12 5 z" stroke-width="2" fill={FG_COLOR} />) },
  // #13
  { markup: jsx(<path d="M -5 -10 C 0 -5 0 5 -5 10 L 10 0 z" stroke-width="0" fill={FG_COLOR} />) },
  // #14
  { markup: jsx(<path d="M 0 0 L 12 -8 C 8 0 8 0 12 8 z" stroke-width="2" fill={FG_COLOR} />) },
  // #15
  { markup: jsx(<path d="M 0 0 L 10 4" stroke-width="2" stroke-linecap="round" />) },
  // #16
  { markup: jsx(<path d="M 0 0 L 8 -5 V 0 z" fill={FG_COLOR} stroke-width="2" />) },
  // #17
  { markup: jsx(<path d="M 0 0 L 8 -5 V 0 z" fill={FG_COLOR} stroke-width="2" stroke-linejoin="round" />) },
  // #18
  { markup: jsx(<path d="M 0 0 L 5 -5 L 10 0 L 5 5 z" stroke-width="2" fill={FG_COLOR} />) },
  // #19
  { markup: jsx(<path d="M 0 0 L 5 -5 L 10 0 L 5 5 z" fill={FG_COLOR} stroke-width="2" stroke-linejoin="round" />) },
  // #20
  { markup: jsx(<path d="M 0 0 L 5 -5 L 10 0 L 5 5 z" fill={FG_COLOR} stroke-width="2" stroke-linejoin="bevel" />) },
  // #21
  { markup: jsx(<path d="M 0 0 L 6 -3 L 12 0 L 6 3 z" stroke-width="2" fill={FG_COLOR} />) },
  // #22
  { markup: jsx(<path d="M 0 0 L 6 -3 L 12 0 L 6 3 z" fill={FG_COLOR} stroke-width="2" stroke-linejoin="round" />) },
  // #23
  { markup: jsx(<circle r="4" fill={FG_COLOR} stroke-width="2" />) },
  // #24
  { markup: jsx(<path d="M 0 -5 V 5" stroke-width="2" fill={FG_COLOR} />) },
  // #25
  { markup: jsx(<path d="M 5 -5 V 5" stroke-width="2" fill="none" />) },
  // #26
  { markup: jsx(<path d="M 5 -5 V 5 M 10 -5 V 5" stroke-width="2" fill={FG_COLOR} />) },
  // #27
  { markup: jsx(<path d="M 0 -4 L 10 0 M 0 4 L 10 0" stroke-width="2" />) },
  // #28
  { markup: jsx(<path d="M 0 -4 h 10 v 4 M 0 4 h 10 v -4" stroke-width="2" fill="none" />) },
  // #29
  { markup: jsx(<path d="M 0 -4 h 10 v 4 M 0 4 h 10 v -4 M 10 0 0 0" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />) },
  // #30
  {
    markup: jsx(
      <>
        <path d="M 5 -5 V 5" stroke-width="2" fill="none" />
        <circle cx="14" r="4" stroke-width="2" fill={BG_COLOR} />
      </>
    ),
  },
  // #31
  { markup: jsx(<path d="M 0 -4 L 10 0 M 0 4 L 10 0 M 10 -5 V 5" stroke-width="2" />) },
  // #32
  { markup: jsx(<path d="M 3 -5 L 12 5" stroke-width="2" />) },
  // #33
  { markup: jsx(<path d="M 3 -5 L 12 5 M 3 5 L 12 -5" stroke-width="2" />) },
  // #34
  { markup: jsx(<path d="M 0 0 L 8 -5 V 0 z" stroke-width="2" fill={BG_COLOR} />) },
  // #35
  { markup: jsx(<circle r="3" fill={BG_COLOR} stroke-width="2" />) },
  // #36
  { markup: jsx(<path d="M 0 0 L 5 -5 L 10 0 L 5 5 z" stroke-width="2" fill={BG_COLOR} />) },
  // #37
  { markup: jsx(<path d="M 0 0 L 6 -3 L 12 0 L 6 3 z" stroke-width="2" fill={BG_COLOR} />) },
  // #38
  {
    markup: jsx(
      <>
        <circle r="8" cx="4" fill={BG_COLOR} stroke-width="2" />
        <path d="M -4 0 H 12 M 4 -8 V 8" fill="none" stroke-width="2" />
      </>
    ),
  },
  // #39
  { markup: jsx(<circle r="8" cx="-4" fill={BG_COLOR} stroke-width="2" />) },
  // #40
  { markup: jsx(<rect x="-5" y="-5" width="10" height="10" fill={BG_COLOR} stroke-width="2" />) },
  // #41
  { markup: jsx(<rect x="5" y="-5" width="10" height="10" fill="none" stroke-width="2" />) },
  // #42
  { markup: jsx(<path d="M -10 -10 C 3 -10 3 10 -10 10" stroke-width="2" fill="none" />) },
  // #43
  {
    markup: jsx(
      <>
        <path d="M 0 -4 L 10 0 M 0 4 L 10 0 M 0 0 H 10" stroke-width="2" fill="none" />
        <circle cx="14" r="3" fill={BG_COLOR} stroke-width="2" />
      </>
    ),
  },
  // #44
  {
    markup: jsx(
      <>
        <path d="M 10 0 L 0 0" stroke={BG_COLOR} stroke-width="3" />
        <path d="M 0 0 L 8 -4 V 4 z" stroke-width="2" fill={BG_COLOR} />
        <path d="M 10 0 L 18 -4 V 4 z" stroke-width="2" fill={BG_COLOR} />
      </>
    ),
  },
  // #45
  { markup: jsx(<polyline points="-2,0 8,-5 8,-2 17,-5 17,5 8,2 8,5 -2,0" fill={FG_COLOR} stroke="none" />) },
  // #46
  {
    markup: jsx(
      <>
        <rect x="-25" width="50" height="25" rx="2" ry="2" transform="rotate(-90)" fill={BG_COLOR} stroke-width="2" />
        <image x="-25" width="50" height="25" transform="rotate(-90)" href="https://assets.codepen.io/7589991/jj-logo-black.svg" />
      </>
    ),
  },
  // #47
  {
    markup: jsx(
      <>
        <rect x="-25" width="50" height="25" rx="2" ry="2" transform="rotate(-90)" fill={BG_COLOR} stroke="#0075f2" stroke-width="2" />
        <image x="-25" width="50" height="25" transform="rotate(-90)" href="https://assets.codepen.io/7589991/jj-logo-red.svg" />
      </>
    ),
  },
  // #48
  {
    markup: jsx(
      <>
        <path d="M -4 0 H 12 M 4 -8 V 8" stroke="#ed2637" stroke-width="2" fill="none" />
        <circle r="8" cx="4" fill="none" stroke="#0075f2" stroke-width="2" />
      </>
    ),
  },
  // #49
  {
    markup: jsx(
      <>
        <path d="M 0 -4 L 10 0 M 0 4 L 10 0 M 0 0 H 10" stroke="#0075f2" stroke-width="2" fill="none" />
        <circle cx="14" r="3" fill={BG_COLOR} stroke="#ed2637" stroke-width="2" />
      </>
    ),
  },
  // #50
  {
    markup: jsx(
      <>
        <path d="M 10 0 L 0 0" stroke={BG_COLOR} stroke-width="3" />
        <path d="M -2 0 L 8 -6 V 6 z" stroke="none" fill="#ed2637" />
        <path d="M 8 0 L 18 -6 V 6 z" stroke="none" fill="#0075f2" />
      </>
    ),
  },
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
    'pointer-events': 'none',
    'text-anchor': 'middle',
    'font-size': 8,
    'font-family': 'sans-serif',
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
  | { type: 'link'; link: dia.Link; linkView: dia.LinkView }
  | { type: 'arrow'; link: dia.Link };

function Main() {
  const paperId = useId();
  const { paper } = usePaper(paperId);
  const [zoom, setZoom] = useState<ZoomState>({ type: 'overview' });

  // Enable smooth zoom transitions once paper is ready
  useEffect(() => {
    if (!paper) return;
    paper.layers.style.transition = 'transform 250ms';
    paper.transformToFitContent({
      padding: 50,
      useModelGeometry: true,
      verticalAlign: 'middle',
      horizontalAlign: 'middle',
    });
  }, [paper]);

  // React to zoom state changes
  useEffect(() => {
    if (!paper) return;
    if (zoom.type === 'overview') {
      TextHighlighter.removeAll(paper, 'number');
      paper.transformToFitContent({
        padding: 50,
        useModelGeometry: true,
        verticalAlign: 'middle',
        horizontalAlign: 'middle',
      });
    } else if (zoom.type === 'link') {
      const bbox = zoom.link.getBBox().inflate(20);
      paper.transformToFitContent({
        contentArea: bbox,
        horizontalAlign: 'middle',
        verticalAlign: 'middle',
      });
      TextHighlighter.removeAll(paper, 'number');
      const number = Number.parseInt(zoom.link.id.toString().replace('marker-', ''), 10);
      TextHighlighter.add(zoom.linkView, 'root', 'number', {
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
      paper.transformToFitContent({
        contentArea: bbox,
        horizontalAlign: 'middle',
        verticalAlign: 'middle',
      });
    }
  }, [zoom, paper]);

  usePaperEvents(paperId, {
    'link:pointerdown': (linkView: dia.LinkView) => {
      const link = linkView.model;
      setZoom((previous) => {
        if (previous.type === 'link' && previous.link === link) {
          return { type: 'arrow', link };
        }
        return { type: 'link', link, linkView };
      });
    },
    'blank:pointerdown': () => setZoom({ type: 'overview' }),
  });

  return (
    <Paper
      id={paperId}
      className={`${PAPER_CLASSNAME} h-[600px]`}
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
