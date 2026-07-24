import { dia, highlighters } from '@joint/core';
import {
  GraphProvider,
  Paper,
  useCell,
  useGraph,
  useMeasureElement,
  usePaper,
  ELEMENT_MODEL_TYPE,
  selectCellType,
  selectElementSize,
  linkRoutingOrthogonal,
  type CellRecord,
  type CellId,
  type PaperProps,
  type PaperEventHandler,
  type PortalSelector,
  type RenderElement,
} from '@joint/react';
import { useCallback, useEffect, useRef, useState } from 'react';

// Colors — unified dark diagram palette.
const MINIMAP_BACKGROUND_COLOR = '#131E29';
const NODE_FILL_COLOR = '#1c2836';
const NODE_STROKE_COLOR = '#3c4f63';
const CYLINDER_TOP_COLOR = '#243445';
const TEXT_COLOR = '#DDE6ED';
const LINK_COLOR = '#8697A6';
const ACCENT_COLOR = '#ED2637';
const WARNING_COLOR = '#FF9505';
const SUCCESS_COLOR = '#36A18B';

const MINIMAP_WIDTH = 200;
const MINIMAP_HEIGHT = 150;
const MINIMAP_STYLE = {
  width: MINIMAP_WIDTH,
  height: MINIMAP_HEIGHT,
  backgroundColor: MINIMAP_BACKGROUND_COLOR,
};

const PAPER_PROPS: PaperProps = {
  linkRouting: linkRoutingOrthogonal(),
};

const SNAP_LINKS: dia.Paper.Options['snapLinks'] = { radius: 25 };

const SELECTION_HIGHLIGHTER_OPTIONS = {
  padding: 8,
  layer: dia.Paper.Layers.FRONT,
  attrs: { stroke: ACCENT_COLOR, 'stroke-width': 3 },
};

interface ElementUserData {
  readonly [key: string]: unknown;
  readonly title?: string;
}

const initialCells: ReadonlyArray<
  CellRecord<
    ElementUserData,
    unknown,
    'element' | 'standard.Cylinder',
    'link' | 'standard.ShadowLink'
  >
> = [
  {
    id: '1',
    type: 'element',
    data: { title: 'This is error element' },
    position: { x: 50, y: 110 },
    angle: 30,
  },
  {
    id: '2',
    type: 'element',
    data: { title: 'This is info element' },
    position: { x: 550, y: 110 },
  },
  {
    id: '3',
    type: 'element',
    data: {},
    position: { x: 50, y: 370 },
  },
  {
    id: '4',
    type: 'standard.Cylinder',
    data: {},
    position: { x: 550, y: 370 },
    size: { width: 100, height: 150 },
    attrs: {
      body: { fill: NODE_FILL_COLOR, stroke: NODE_STROKE_COLOR },
      top: { fill: CYLINDER_TOP_COLOR, stroke: NODE_STROKE_COLOR },
    },
  },
  {
    id: 'link1',
    type: 'link',
    source: { id: '1' },
    target: { id: '2' },
    style: { width: 4, color: WARNING_COLOR, dasharray: '8,4' },
  },
  {
    id: 'link2',
    type: 'link',
    source: { id: '3' },
    target: { id: '4' },
    style: { color: SUCCESS_COLOR },
  },
  {
    id: 'link3',
    type: 'standard.ShadowLink',
    source: { id: '2' },
    target: { id: '4' },
    attrs: { line: { stroke: LINK_COLOR } },
  },
];

/** Grow the measured text box into the element's model size by adding padding. */
function nodeSizeToModelSize({
  x,
  y,
  width,
  height,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
}) {
  const padding = 20;
  return { x, y, width: width + padding, height: height + padding };
}

/**
 * Render React content only into built-in JointJS shapes (which have no
 * `portalSelector` of their own); ElementModel cells keep their default portal.
 */
const portalSelector: PortalSelector = ({ model }) =>
  model.get('type') === ELEMENT_MODEL_TYPE ? undefined : 'root';

const cloneElementOnDblClick: PaperEventHandler<'onElementPointerDblClick'> = ({ model, graph }) => {
  model.clone().translate(10, 10).addTo(graph);
};

function Shape({ title = 'No Title' }: Readonly<{ title?: string }>) {
  const textRef = useRef<SVGTextElement>(null);
  const { width, height } = useMeasureElement(textRef, { transform: nodeSizeToModelSize });

  return (
    <>
      <ellipse
        rx={width / 2}
        ry={height / 2}
        cx={width / 2}
        cy={height / 2}
        fill={NODE_FILL_COLOR}
        stroke={NODE_STROKE_COLOR}
      />
      <text
        ref={textRef}
        x={width / 2}
        y={height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={14}
        fill={TEXT_COLOR}
      >
        {title}
      </text>
    </>
  );
}

function MinimapShape() {
  const { width, height } = useCell(selectElementSize);
  return (
    <rect
      width={width}
      height={height}
      fill={NODE_FILL_COLOR}
      stroke={NODE_STROKE_COLOR}
      rx={10}
      ry={10}
    />
  );
}

const renderMinimapShape: RenderElement<ElementUserData> = () => <MinimapShape />;

function MiniMap({ paper }: Readonly<{ paper: dia.Paper }>) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const { width, height } = paper.getComputedSize();
    setScale(Math.min(MINIMAP_WIDTH / width, MINIMAP_HEIGHT / height)); // eslint-disable-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect -- Derive scale from paper dimensions
  }, [paper]);

  return (
    <div
      className="absolute bottom-4 right-4 overflow-hidden rounded-lg border border-white/15"
      style={MINIMAP_STYLE}
    >
      <Paper
        {...PAPER_PROPS}
        id="minimap"
        className="size-full"
        interactive={false}
        transform={`scale(${scale})`}
        renderElement={renderMinimapShape}
        drawGrid={false}
      />
    </div>
  );
}

function Selection({ selectedId }: Readonly<{ selectedId: CellId | null }>) {
  const { paper } = usePaper();
  const { graph } = useGraph();

  useEffect(() => {
    if (!paper) return;
    highlighters.mask.removeAll(paper);
    if (!selectedId) return;

    const cell = graph.getCell(selectedId);
    if (!cell) return;

    const view = paper.findViewByModel(cell);
    highlighters.mask.add(view, 'root', 'selection', SELECTION_HIGHLIGHTER_OPTIONS);
  }, [graph, paper, selectedId]);

  return null;
}

const BADGE_RADIUS = 10;

function Badge({ x, y }: Readonly<{ x: number; y: number }>) {
  return (
    <>
      <circle cx={x} cy={y} r={BADGE_RADIUS} fill={ACCENT_COLOR} />
      <text
        x={x}
        y={y}
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize="12"
        fill={TEXT_COLOR}
        fontWeight="bold"
      >
        !
      </text>
    </>
  );
}

function RenderElementWithBadge({ title = 'No Title' }: Readonly<ElementUserData>) {
  const { width } = useCell(selectElementSize);
  const cellType = useCell(selectCellType);
  // Only render the default Shape for our ElementModel type. Custom JointJS
  // shapes (e.g. standard.Cylinder) render themselves via their native markup.
  const isElementModel = cellType === ELEMENT_MODEL_TYPE;
  return (
    <>
      {isElementModel ? <Shape title={title} /> : null}
      <Badge x={width + BADGE_RADIUS} y={-BADGE_RADIUS} />
    </>
  );
}

function Main() {
  const [paper, setPaper] = useState<dia.Paper | null>(null);
  const [showMinimap, setShowMinimap] = useState(false);
  const [selectedElement, setSelectedElement] = useState<CellId | null>(null);

  const renderElement: RenderElement<ElementUserData> = useCallback(
    (data) => <RenderElementWithBadge {...data} />,
    []
  );

  const selectElement: PaperEventHandler<'onElementPointerClick'> = useCallback(
    ({ id }) => setSelectedElement(id),
    []
  );

  const clearSelection: PaperEventHandler<'onBlankPointerClick'> = useCallback(
    () => setSelectedElement(null),
    []
  );

  const toggleMinimap = useCallback(() => setShowMinimap((visible) => !visible), []);

  return (
    <div className="flex size-full flex-col">
      <div className="jj-controls m-3">
        <button type="button" className="jj-btn jj-btn--primary" onClick={toggleMinimap}>
          {showMinimap ? 'Hide minimap' : 'Show minimap'}
        </button>
      </div>
      <div className="relative min-h-0 flex-1">
        <Paper
          {...PAPER_PROPS}
          id="main"
          ref={setPaper}
          className="size-full"
          snapLinks={SNAP_LINKS}
          renderElement={renderElement}
          linkPinning={false}
          portalSelector={portalSelector}
          drawGrid={false}
          onElementPointerClick={selectElement}
          onElementPointerDblClick={cloneElementOnDblClick}
          onBlankPointerClick={clearSelection}
        >
          <Selection selectedId={selectedElement} />
        </Paper>
        {showMinimap && paper && <MiniMap paper={paper} />}
      </div>
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
