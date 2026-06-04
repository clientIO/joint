/**
 * Builds a JointJS diagram with pure `@joint/core` and serializes it to a static
 * SVG string — entirely in Node, no browser. Styled after the JointJS homepage:
 * dark cards, a dashed outline variant, a diamond decision node, simple line
 * icons, dashed red orthogonal links, red pill labels and red ring ports.
 *
 * `@joint/svg-shim/install` is imported FIRST (ES modules evaluate in source
 * order) so the headless DOM + SVG-geometry shim is installed before
 * `@joint/core` is loaded. With `@napi-rs/canvas` present, label text is
 * measured with the real font, so the serialized SVG is correctly sized.
 */
import '@joint/svg-shim/install';
import { dia, shapes } from '@joint/core';

const NODE_WIDTH = 216;
const NODE_HEIGHT = 86;
const DIAMOND_SIZE = 168;
const FONT = '\'Helvetica Neue\', Helvetica, Arial, sans-serif';

// JointJS brand: dark slate surfaces, a single red accent.
const RED = '#ed2939';
const RED_SOFT = '#f0453f';
const NODE_FILL = '#161e2b';
const DASH_WHITE = '#e8edf3';
const TITLE_FILL = '#f3f5f8';
const SUBTITLE_FILL = '#93a1b3';
const ICON_FILL = '#cdd6e2';

type Side = 'left' | 'right' | 'top' | 'bottom';

// Simple 24×24 line-icon paths — proof that even icons render server-side.
const ICONS = {
  server: 'M3 4h18v6H3z M3 14h18v6H3z M7 7h0.5 M7 17h0.5',
  cube: 'M12 2l9 5v10l-9 5-9-5V7z M12 2v20 M3 7l9 5 9-5',
  layers: 'M12 3l9 5-9 5-9-5z M3 13l9 5 9-5 M3 17l9 5 9-5',
  ruler: 'M3 7h18v10H3z M7 7v4 M11 7v6 M15 7v4 M19 7v6',
  image: 'M3 4h18v16H3z M3 16l5-5 4 4 3-3 6 6 M8 9a1.5 1.5 0 1 0 0-0.01',
  split: 'M7 3v8a4 4 0 0 0 4 4h6 M14 11l4 4-4 4 M7 15v6',
} as const;

/** A connection port: a red ring, echoing the JointJS homepage flow ports. */
const portGroup = (position: Side): dia.Element.PortGroup => ({
  position: { name: position },
  markup: [{ tagName: 'circle', selector: 'port' }],
  attrs: { port: { r: 7, fill: '#0d1117', stroke: RED, strokeWidth: 2, magnet: 'active' } },
});

const PORT_GROUPS = { left: portGroup('left'), right: portGroup('right'), top: portGroup('top'), bottom: portGroup('bottom') };

/** A pipeline card: dark rounded rect, left line-icon, bold title, muted subtitle. */
const CardNode = dia.Element.define(
  'demo.CardNode',
  {
    attrs: {
      body: { width: 'calc(w)', height: 'calc(h)', rx: 12, ry: 12, fill: NODE_FILL, stroke: 'none' },
      icon: { fill: 'none', stroke: ICON_FILL, strokeWidth: 1.6, strokeLinejoin: 'round', strokeLinecap: 'round' },
      title: { textAnchor: 'start', textVerticalAnchor: 'middle', x: 64, y: 'calc(0.4*h)', fontSize: 14, fontWeight: 'bold', fontFamily: FONT, fill: TITLE_FILL },
      subtitle: { textAnchor: 'start', textVerticalAnchor: 'middle', x: 64, y: 'calc(0.66*h)', fontSize: 11, fontFamily: FONT, fill: SUBTITLE_FILL },
    },
    ports: { groups: PORT_GROUPS },
  },
  {
    markup: [
      { tagName: 'rect', selector: 'body' },
      { tagName: 'path', selector: 'icon' },
      { tagName: 'text', selector: 'title' },
      { tagName: 'text', selector: 'subtitle' },
    ],
  }
);

/** A diamond decision node — transparent with a white outline (homepage style). */
const DiamondNode = dia.Element.define(
  'demo.DiamondNode',
  {
    attrs: {
      body: { refPoints: '0,10 10,0 20,10 10,20', fill: 'transparent', stroke: DASH_WHITE, strokeWidth: 2, strokeDasharray: '6 5' },
      title: { textAnchor: 'middle', textVerticalAnchor: 'middle', x: 'calc(w/2)', y: 'calc(0.5*h)', fontSize: 13, fontWeight: 'bold', fontFamily: FONT, fill: TITLE_FILL },
    },
    ports: { groups: PORT_GROUPS },
  },
  {
    markup: [
      { tagName: 'polygon', selector: 'body' },
      { tagName: 'text', selector: 'title' },
    ],
  }
);

/** One node of the pipeline (linear: each node links to the next). */
interface Node {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly icon: keyof typeof ICONS;
  readonly x: number;
  readonly y: number;
  readonly shape?: 'card' | 'diamond';
  readonly dashed?: boolean;
  /** Optional red pill on the link that LEAVES this node. */
  readonly outLabel?: string;
  /** Force the in/out port side (else it is derived from geometry). */
  readonly inSide?: Side;
  readonly outSide?: Side;
}

// Scattered, homepage-style layout. The pipeline runs in array order; ports are
// derived from geometry below, so links always leave/enter the facing side.
const NODES: readonly Node[] = [
  { id: 'node', title: 'Node.js', subtitle: 'server runtime', icon: 'server', x: 64, y: 40 },
  { id: 'core', title: '@joint/core', subtitle: 'dia.Paper builds the SVG', icon: 'cube', x: 64, y: 250, dashed: true, outLabel: 'measured on the server' },
  { id: 'shim', title: '@joint/svg-shim', subtitle: 'headless DOM + geometry', icon: 'layers', x: 450, y: 40, inSide: 'bottom' },
  { id: 'canvas', title: '@napi-rs/canvas', subtitle: 'measures the text', icon: 'ruler', x: 880, y: 250, dashed: true, inSide: 'top', outSide: 'bottom' },
  { id: 'router', title: 'orthogonal router', subtitle: '', icon: 'split', x: 496, y: 350, shape: 'diamond', outLabel: 'static SVG' },
  { id: 'svg', title: 'Static SVG', subtitle: 'paper.svg.outerHTML', icon: 'image', x: 80, y: 470 },
];

const PAPER_WIDTH = 1160;
const PAPER_HEIGHT = 640;

/** The node's centre point, accounting for its shape's size. */
function centerOf(node: Node): { cx: number; cy: number } {
  const w = node.shape === 'diamond' ? DIAMOND_SIZE : NODE_WIDTH;
  const h = node.shape === 'diamond' ? DIAMOND_SIZE : NODE_HEIGHT;
  return { cx: node.x + w / 2, cy: node.y + h / 2 };
}

/** Which side of `from` faces `to` — the dominant axis of the centre delta. */
function sideFacing(from: Node, to: Node): Side {
  const a = centerOf(from);
  const b = centerOf(to);
  const dx = b.cx - a.cx;
  const dy = b.cy - a.cy;
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'right' : 'left';
  return dy >= 0 ? 'bottom' : 'top';
}

/** Builds a node (card or diamond) with its icon and the given in/out port sides. */
function buildNode(node: Node, inSide: Side | undefined, outSide: Side | undefined): dia.Element {
  const isDiamond = node.shape === 'diamond';
  const Ctor = isDiamond ? DiamondNode : CardNode;
  const size = isDiamond ? { width: DIAMOND_SIZE, height: DIAMOND_SIZE } : { width: NODE_WIDTH, height: NODE_HEIGHT };
  const iconTransform = isDiamond
    ? `translate(${DIAMOND_SIZE / 2 - 12}, ${DIAMOND_SIZE * 0.3}) scale(0.85)`
    : `translate(22, ${NODE_HEIGHT / 2 - 12}) scale(0.85)`;
  const attributes: dia.Element.Attributes['attrs'] = isDiamond
    ? { title: { text: node.title } }
    : {
        body: node.dashed ? { fill: 'transparent', stroke: DASH_WHITE, strokeWidth: 2, strokeDasharray: '6 5' } : {},
        icon: { d: ICONS[node.icon], transform: iconTransform },
        title: { text: node.title },
        subtitle: { text: node.subtitle },
      };
  const element = new Ctor({ id: node.id, position: { x: node.x, y: node.y }, size, attrs: attributes });
  if (inSide) element.addPort({ id: 'in', group: inSide });
  if (outSide) element.addPort({ id: 'out', group: outSide });
  return element;
}

const unit = 4;


/** A dashed-red orthogonal, rounded link from one node's out-port to another's in-port. */
function pipeLink(source: string, target: string, label?: string): dia.Link {
  const link = new shapes.standard.Link({
    source: { id: source, port: 'out' },
    target: { id: target, port: 'in' },
    z: -1,
    attrs: {
      line: {
        class: 'flow-link',
        stroke: RED,
        strokeWidth: 1.5,
        strokeDasharray: '6 5',
        targetMarker: { type: 'path', d: 'M 8 -4 0 0 8 4 Z', fill: RED, stroke: 'none' },
      },
    },
  });
  if (label !== undefined) {
    link.labels([
      {
        position: 0.5,
        attrs: {
          // `ref: 'text'` sizes the red pill from the measured label, then `calc`
          // adds padding around it — the shim measures the text in Node.
          text: { text: label, fill: '#fff', fontSize: 11, fontFamily: FONT, fontWeight: 'bold' },
          rect: { ref: 'text', x: 'calc(x - 11)', y: 'calc(y - 6)', width: 'calc(w + 22)', height: 'calc(h + 12)', fill: RED_SOFT, stroke: 'none', rx: 6, ry: 6 },
        },
      },
    ]);
  }
  return link;
}

/**
 * Build the diagram and return its serialized SVG markup.
 *
 * The labelled link's pill is sized from the measured text — the shim's whole
 * point: that measurement happens server-side in Node.
 */
export function buildDiagramSvg(): string {
  const graph = new dia.Graph({}, { cellNamespace: shapes });

  const spacing= 6;
  const paper = new dia.Paper({
    model: graph,
    cellViewNamespace: shapes,
    width: PAPER_WIDTH,
    height: PAPER_HEIGHT,
    // Anchor links at the port centre using the MODEL geometry (the server has no
    // layout, so a rendered bbox would be zero-height). The manhattan router then
    // adds a perpendicular stub at each end, so links meet nodes at 90°.
    defaultAnchor: { name: 'center', args: { useModelGeometry: true } },
    gridSize: 5,
    defaultConnectionPoint: {
        name: 'boundary',
        args: {
            offset: spacing,
            extrapolate: true
        }
    },
    defaultRouter: { name: 'rightAngle', args: { margin: unit * 7 }},
    defaultConnector: {
        name: 'straight',
        args: { cornerType: 'line', cornerPreserveAspectRatio: true }
    } // bevelled path
  });

  // Derive each node's port sides from geometry: the out-port faces the next
  // node, the in-port faces the previous one — so links never wrap around.
  const cells: dia.Cell[] = NODES.map((node, index) => {
    const previous = NODES[index - 1];
    const next = NODES[index + 1];
    const inSide = node.inSide ?? (previous ? sideFacing(node, previous) : undefined);
    const outSide = node.outSide ?? (next ? sideFacing(node, next) : undefined);
    return buildNode(node, inSide, outSide);
  });
  for (let index = 0; index < NODES.length - 1; index++) {
    const from = NODES[index];
    const to = NODES[index + 1];
    if (from && to) cells.push(pipeLink(from.id, to.id, from.outLabel));
  }
  graph.addCells(cells);

  // `paper.svg` fills its (DOM-less) paper container at `100%` — JointJS puts the
  // pixel dimensions on the paper element, not the `<svg>`. Serialized on its own
  // it would have no intrinsic size and collapse. Give it an explicit size +
  // `viewBox`, then let it scale to the page frame (`width: 100%`).
  const { svg } = paper;
  svg.setAttribute('width', String(PAPER_WIDTH));
  svg.setAttribute('height', String(PAPER_HEIGHT));
  svg.setAttribute('viewBox', `0 0 ${PAPER_WIDTH} ${PAPER_HEIGHT}`);
  svg.setAttribute('style', 'display: block; width: 100%; height: auto');

  return svg.outerHTML;
}
