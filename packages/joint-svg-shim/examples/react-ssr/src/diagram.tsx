/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import {
  GraphProvider,
  Paper,
  HTMLHost,
  type RenderElement,
  type CellRecord,
  type ElementRecord,
  type LinkRecord,
} from '@joint/react';
import {
  linkRoutingOrthogonal,
  type ElementPort,
  type LinkLabel,
  type LinkStyle,
} from '@joint/react/presets';

const unit = 4;
const bevel = unit * 2;
const ORTHOGONAL_LINKS = linkRoutingOrthogonal({
  cornerType: 'line',
  cornerRadius: bevel,
  margin: unit * 7,
});

/** User data carried by each node. */
interface NodeData {
  readonly label: string;
  readonly sub: string;
  readonly tone: keyof typeof TONES;
}

/** Tailwind class sets per tone. Literal strings so Tailwind can see them. */
const TONES = {
  sky: 'from-sky-500/15 to-sky-500/5 border-sky-400/40 text-sky-200',
  violet: 'from-violet-500/15 to-violet-500/5 border-violet-400/40 text-violet-200',
  emerald: 'from-emerald-500/15 to-emerald-500/5 border-emerald-400/40 text-emerald-200',
  amber: 'from-amber-500/15 to-amber-500/5 border-amber-400/40 text-amber-200',
  rose: 'from-rose-500/15 to-rose-500/5 border-rose-400/40 text-rose-200',
} as const;

const NODE_WIDTH = 220;
const NODE_HEIGHT = 76;

/**
 * Shared link look, built from the `@joint/react` preset — the same thin line +
 * solid triangle arrowhead as the Flowchart demo story, themed for this page.
 */
const LINK_STYLE: LinkStyle = {
  color: '#38bdf8',
  width: 2,
  // Marching-ants dashes via CSS animation (styles.css) — runs even with JS off.
  className: 'jj-link-dashed',
  wrapperColor: '#0f172a',
  wrapperWidth: 5,
  targetMarker: {
    markup: [
      {
        tagName: 'path',
        attributes: { d: `M 0 0 L ${2 * unit} ${unit} L ${2 * unit} -${unit} Z` },
      },
    ],
  },
};

/** A sky-toned connection port, positioned at a node mid-side. */
function port(cx: number, cy: number): ElementPort {
  return { cx, cy, width: 12, height: 12, color: '#0ea5e9', outline: '#7dd3fc', outlineWidth: 2 };
}

const PORT_TOP = port(NODE_WIDTH / 2, 0);
const PORT_BOTTOM = port(NODE_WIDTH / 2, NODE_HEIGHT);
const PORT_LEFT = port(0, NODE_HEIGHT / 2);
const PORT_RIGHT = port(NODE_WIDTH, NODE_HEIGHT / 2);

// A real font both @napi-rs/canvas (server measurement) and the browser have, so the
// measured label width matches the rendered one. The label SIZE (12px below) is
// kept on the server too — the shim coerces the inline `font-size` jsdom would
// otherwise drop. Without `canvas` the server uses a close metrics estimate.
const LABEL_FONT = 'Verdana, sans-serif';

/** A pill label sitting on a link. */
function label(text: string): Record<string, LinkLabel> {
  return {
    main: {
      text,
      color: '#e0f2fe',
      backgroundColor: '#0b1220',
      backgroundOutline: '#0ea5e9',
      backgroundOutlineWidth: 1,
      backgroundBorderRadius: 6,
      backgroundPadding: { horizontal: 8, vertical: 4 },
      fontSize: 12,
      fontFamily: LABEL_FONT,
    },
  };
}

const NODE_SIZE = { width: NODE_WIDTH, height: NODE_HEIGHT };

/** The pipeline nodes, with a connection port on each mid-side a link uses. */
const NODES: ReadonlyArray<ElementRecord<NodeData>> = [
  {
    id: 'server',
    type: 'element',
    position: { x: 60, y: 60 },
    size: NODE_SIZE,
    data: { label: 'Server', sub: 'Node / Bun runtime', tone: 'sky' },
    portMap: { out: PORT_BOTTOM },
  },
  {
    id: 'render',
    type: 'element',
    position: { x: 60, y: 230 },
    size: NODE_SIZE,
    data: { label: 'renderToString', sub: '@joint/react/server', tone: 'violet' },
    portMap: { in: PORT_TOP, out: PORT_RIGHT },
  },
  {
    id: 'html',
    type: 'element',
    position: { x: 350, y: 60 },
    size: NODE_SIZE,
    data: { label: 'Full SVG in HTML', sub: 'works with JS disabled', tone: 'emerald' },
    portMap: { in: PORT_LEFT, out: PORT_RIGHT },
  },
  {
    id: 'browser',
    type: 'element',
    position: { x: 740, y: 230 },
    size: NODE_SIZE,
    data: { label: 'Browser', sub: 'first paint · SEO', tone: 'amber' },
    portMap: { in: PORT_LEFT, out: PORT_TOP },
  },
  {
    id: 'interactive',
    type: 'element',
    position: { x: 740, y: 60 },
    size: NODE_SIZE,
    data: { label: 'Hydrate → Interactive', sub: 'drag · click · events', tone: 'rose' },
    portMap: { in: PORT_BOTTOM },
  },
];

/** The pipeline links: dashed + arrow-headed, port-to-port, some labeled. */
const LINKS: readonly LinkRecord[] = [
  { id: 'l1', type: 'link', source: { id: 'server', port: 'out' }, target: { id: 'render', port: 'in' }, style: LINK_STYLE },
  { id: 'l2', type: 'link', source: { id: 'render', port: 'out' }, target: { id: 'html', port: 'in' }, style: LINK_STYLE, labelMap: label('renderToString') },
  { id: 'l3', type: 'link', source: { id: 'html', port: 'out' }, target: { id: 'browser', port: 'in' }, style: LINK_STYLE, labelMap: label('ships SVG') },
  { id: 'l4', type: 'link', source: { id: 'browser', port: 'out' }, target: { id: 'interactive', port: 'in' }, style: LINK_STYLE },
];

/** The diagram: an SSR pipeline rendered as a JointJS graph with ports + labels. */
const CELLS: ReadonlyArray<CellRecord<NodeData>> = [...NODES, ...LINKS];

/** Renders a node as a styled card inside the SVG (Tailwind via foreignObject). */
const renderNode: RenderElement<NodeData> = ({ label, sub, tone }) => (
  <HTMLHost
    useModelGeometry
    className={`flex h-full w-full flex-col justify-center gap-0.5 rounded-xl border bg-gradient-to-br px-4 shadow-lg backdrop-blur-sm ${TONES[tone]}`}
  >
    <span className="text-sm font-semibold tracking-tight text-white">{label}</span>
    <span className="text-xs opacity-80">{sub}</span>
  </HTMLHost>
);

/** The shared diagram, rendered identically on the server and the client. */
export function Diagram() {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3 shadow-2xl">
      <GraphProvider initialCells={CELLS}>
        <Paper
          className="h-[360px] w-[1020px] overflow-hidden rounded-xl bg-slate-900/40"
          drawGrid={false}
          renderElement={renderNode}
          style={{ width: 1020, height: 360 }}
          linkRouting={ORTHOGONAL_LINKS}
          defaultLink={{
            style: LINK_STYLE,
          }}
        />
      </GraphProvider>
    </div>
  );
}
