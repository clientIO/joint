import { useCallback, useEffect, useRef } from 'react';
import { dia, elementTools, linkTools, highlighters, g } from '@joint/core';
import {
  GraphProvider,
  Paper,
  useCell,
  jsx,
  resolveLinkMarker,
  selectElementSize,
  linkRoutingOrthogonal,
} from '@joint/react';
import type { CanConnectOptions, CellRecord, ConnectionStrategy, LinkStyle } from '@joint/react';

// Colors — unified dark diagram palette.
const BG = '#131E29';
const PRIMARY = '#ED2637';
const TEXT = '#DDE6ED';
const LINK_COLOR = '#8697A6';
const ANCHOR_FILL = '#FF9505';
const ANCHOR_STROKE = BG;

/** Delay (ms) before hover tools fade out, so the pointer can travel to them. */
const TOOLS_REMOVE_DELAY = 1000;

const ORTHOGONAL_LINKS = linkRoutingOrthogonal({
  straightWhenDisconnected: false,
  cornerType: 'line',
  cornerRadius: 5,
  margin: 40,
});

/** Distance (px) to shift the dropped link-end away from the shape edge. */
const ANCHOR_MARGIN = resolveLinkMarker('arrow')?.length ?? 0;

const DEFAULT_LINK_STYLE: LinkStyle = { color: LINK_COLOR, width: 2, targetMarker: 'arrow' };
const DEFAULT_LINK = { style: DEFAULT_LINK_STYLE };

const ShapeTypes = {
  square: 'square',
  rectangle: 'rectangle',
  ellipse: 'ellipse',
} as const;

type ShapeType = (typeof ShapeTypes)[keyof typeof ShapeTypes];

interface ShapeData {
  readonly shapeType: ShapeType;
  readonly label?: string;
}

/** Fixed anchor points for a shape, optionally shifted outward by `margin`. */
function getAnchors(shapeType: ShapeType, width: number, height: number, margin = 0): dia.Point[] {
  switch (shapeType) {
    case ShapeTypes.square: {
      // 3 anchors on each side, shifted outward by `margin`.
      return [
        { x: width / 4, y: -margin },
        { x: width / 2, y: -margin },
        { x: (width / 4) * 3, y: -margin },
        { x: width + margin, y: height / 4 },
        { x: width + margin, y: height / 2 },
        { x: width + margin, y: (height / 4) * 3 },
        { x: (width / 4) * 3, y: height + margin },
        { x: width / 2, y: height + margin },
        { x: width / 4, y: height + margin },
        { x: -margin, y: (height / 4) * 3 },
        { x: -margin, y: height / 2 },
        { x: -margin, y: height / 4 },
      ];
    }
    case ShapeTypes.rectangle: {
      const anchors: dia.Point[] = [];
      for (let xPosition = 20; xPosition < width; xPosition += 20) {
        anchors.push({ x: xPosition, y: -margin }, { x: xPosition, y: height + margin });
      }
      return anchors;
    }
    case ShapeTypes.ellipse: {
      // 1 anchor on each side, shifted outward by `margin`.
      return [
        { x: width / 2, y: -margin },
        { x: width + margin, y: height / 2 },
        { x: width / 2, y: height + margin },
        { x: -margin, y: height / 2 },
      ];
    }
    default: {
      return [];
    }
  }
}

/** Pick the anchor nearest to a point expressed in the shape's local space. */
function findClosestAnchor(anchors: dia.Point[], relativePoint: dia.Point): dia.Point {
  let minDistance = Infinity;
  let [closest] = anchors;
  for (const anchor of anchors) {
    const distance = new g.Point(relativePoint).squaredDistance(anchor);
    if (distance < minDistance) {
      minDistance = distance;
      closest = anchor;
    }
  }
  return closest;
}

const initialCells: ReadonlyArray<CellRecord<ShapeData>> = [
  {
    id: 'square1',
    type: 'element',
    data: { shapeType: ShapeTypes.square, label: 'S1' },
    position: { x: 100, y: 100 },
    size: { width: 80, height: 80 },
  },
  {
    id: 'square2',
    type: 'element',
    data: { shapeType: ShapeTypes.square, label: 'S2' },
    position: { x: 340, y: 100 },
    size: { width: 80, height: 80 },
  },
  {
    id: 'ellipse1',
    type: 'element',
    data: { shapeType: ShapeTypes.ellipse, label: 'E' },
    position: { x: 220, y: 300 },
    size: { width: 80, height: 80 },
  },
  {
    id: 'rectangle1',
    type: 'element',
    data: { shapeType: ShapeTypes.rectangle },
    position: { x: 100, y: 500 },
    size: { width: 320, height: 40 },
  },
  {
    id: 'link1',
    type: 'link',
    source: { id: 'square1', anchor: { name: 'modelCenter', args: { dx: 40, dy: -20 } } },
    target: {
      id: 'square2',
      anchor: { name: 'modelCenter', args: { dx: -40 - ANCHOR_MARGIN, dy: -20 } },
    },
    ...DEFAULT_LINK,
  },
  {
    id: 'link2',
    type: 'link',
    source: { id: 'ellipse1', anchor: { name: 'modelCenter', args: { dx: -40, dy: 0 } } },
    target: { id: 'rectangle1', anchor: { name: 'modelCenter', args: { dx: -100, dy: -30 } } },
    ...DEFAULT_LINK,
  },
  {
    id: 'link3',
    type: 'link',
    source: { id: 'rectangle1', anchor: { name: 'modelCenter', args: { dx: 100, dy: -20 } } },
    target: {
      id: 'ellipse1',
      anchor: { name: 'modelCenter', args: { dx: 40 + ANCHOR_MARGIN, dy: 0 } },
    },
    ...DEFAULT_LINK,
  },
  {
    id: 'link4',
    type: 'link',
    source: { id: 'square2', anchor: { name: 'modelCenter', args: { dx: -40, dy: 20 } } },
    target: {
      id: 'ellipse1',
      anchor: { name: 'modelCenter', args: { dx: 0, dy: -40 - ANCHOR_MARGIN } },
    },
    ...DEFAULT_LINK,
  },
  {
    id: 'link5',
    type: 'link',
    source: { id: 'square2', anchor: { name: 'modelCenter', args: { dx: -40, dy: 0 } } },
    target: {
      id: 'square1',
      anchor: { name: 'modelCenter', args: { dx: 40 + ANCHOR_MARGIN, dy: 0 } },
    },
    ...DEFAULT_LINK,
  },
];

/** Draws every available anchor as a dot while a link is dragged over a shape. */
const AnchorsHighlighter = dia.HighlighterView.extend({
  tagName: 'g',
  attributes: {
    stroke: ANCHOR_STROKE,
    fill: ANCHOR_FILL,
    strokeWidth: 2,
  },

  highlight(cellView: dia.CellView) {
    const model = cellView.model as dia.Element;
    const { width, height } = model.size();
    const shapeType = model.prop('data/shapeType') as ShapeType;
    const anchors = getAnchors(shapeType, width, height);
    const children = anchors.map((anchor) => ({
      tagName: 'circle',
      attributes: { cx: anchor.x, cy: anchor.y, r: 5 },
    }));
    this.renderChildren(children);
  },
});

function Rectangle({ label }: Readonly<ShapeData>) {
  const { width, height } = useCell(selectElementSize);
  return (
    <>
      <path
        d={`M 10 0 H ${width - 10} l 10 10 V ${height - 10} l -10 10 H 10 l -10 -10 V 10 Z`}
        fill={BG}
        stroke={PRIMARY}
        strokeWidth={2}
      />
      {label && (
        <text
          x={width / 2}
          y={height / 2}
          fill={TEXT}
          fontFamily="sans-serif"
          fontSize={20}
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {label}
        </text>
      )}
    </>
  );
}

function Ellipse({ label }: Readonly<ShapeData>) {
  const { width, height } = useCell(selectElementSize);
  return (
    <>
      <ellipse
        cx={width / 2}
        cy={height / 2}
        rx={width / 2}
        ry={height / 2}
        fill={BG}
        stroke={PRIMARY}
        strokeWidth={2}
      />
      {label && (
        <text
          x={width / 2}
          y={height / 2}
          fill={TEXT}
          fontFamily="sans-serif"
          fontSize={20}
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {label}
        </text>
      )}
    </>
  );
}

function RenderElement(data: Readonly<ShapeData>) {
  switch (data.shapeType) {
    case ShapeTypes.square:
    case ShapeTypes.rectangle: {
      return <Rectangle {...data} />;
    }
    case ShapeTypes.ellipse: {
      return <Ellipse {...data} />;
    }
  }
}

const anchorButtonMarkup = jsx(
  <circle r={6} stroke={ANCHOR_STROKE} strokeWidth={4} fill={ANCHOR_FILL} cursor="pointer" />
);

const removeButtonMarkup = jsx(
  <g cursor="pointer">
    <circle r={11} fill={BG} stroke={TEXT} strokeWidth={2} />
    <g transform="translate(-5, -5)">
      <line x1={0} y1={0} x2={10} y2={10} stroke={TEXT} strokeWidth={2} />
      <line x1={10} y1={0} x2={0} y2={10} stroke={TEXT} strokeWidth={2} />
    </g>
  </g>
);

const VertexHandle = linkTools.Vertices.VertexHandle.extend({
  attributes: {
    r: 6,
    fill: ANCHOR_FILL,
    stroke: ANCHOR_STROKE,
    strokeWidth: 2,
    cursor: 'move',
  },
});

/** One Connect tool per anchor so a new link can be started from a fixed point. */
function getElementTools(elementView: dia.ElementView): elementTools.Connect[] {
  const { model } = elementView;
  const { width, height } = model.size();
  const shapeType = model.prop('data/shapeType') as ShapeType;
  const anchors = getAnchors(shapeType, width, height);

  return anchors.map(
    (anchor) =>
      new elementTools.Connect({
        markup: anchorButtonMarkup,
        x: anchor.x,
        y: anchor.y,
      })
  );
}

function getLinkTools(): dia.ToolView[] {
  return [
    new linkTools.Vertices({ handleClass: VertexHandle }),
    new linkTools.Remove({
      distance: -40,
      markup: removeButtonMarkup,
    }),
    new linkTools.Remove({
      distance: 40,
      markup: removeButtonMarkup,
      visibility: (view) => view.getConnectionLength() > 200,
    }),
  ];
}

/** Snap a dropped link end to the fixed anchor nearest the drop point. */
const connectionStrategy: ConnectionStrategy = ({ end, model, dropPoint, endType }) => {
  const element = model as dia.Element;
  const { width, height } = element.size();
  const shapeType = element.prop('data/shapeType') as ShapeType;
  const margin = endType === 'target' ? ANCHOR_MARGIN : 0;
  const anchors = getAnchors(shapeType, width, height, margin);
  const relativePoint = element.getRelativePointFromAbsolute(dropPoint);
  const anchor = findClosestAnchor(anchors, relativePoint);
  return {
    id: end.id,
    anchor: {
      name: 'modelCenter',
      args: {
        dx: anchor.x - width / 2,
        dy: anchor.y - height / 2,
      },
    },
  };
};

const HIGHLIGHTING: dia.Paper.Options['highlighting'] = { connecting: { name: 'anchors' } };
const HIGHLIGHTER_NAMESPACE = { ...highlighters, anchors: AnchorsHighlighter };
const VALIDATE_CONNECTION: CanConnectOptions = { linkLimit: 'none' };

function Main() {
  const currentToolsViewRef = useRef<dia.ToolsView | null>(null);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
    };
  }, []);

  const showTools = useCallback(
    ({ model, view, paper }: { model: dia.Cell; view: dia.CellView; paper: dia.Paper }) => {
      paper.removeTools();

      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }

      const tools = model.isLink() ? getLinkTools() : getElementTools(view as dia.ElementView);

      const toolsView = new dia.ToolsView({ tools });
      view.addTools(toolsView);
      currentToolsViewRef.current = toolsView;
    },
    []
  );

  const fadeOutTools = useCallback(() => {
    timeoutIdRef.current = setTimeout(() => {
      currentToolsViewRef.current?.remove();
      currentToolsViewRef.current = null;
      timeoutIdRef.current = null;
    }, TOOLS_REMOVE_DELAY);

    currentToolsViewRef.current?.el.classList.add(
      'opacity-0',
      'transition-opacity',
      'duration-300',
      'delay-300'
    );
  }, []);

  const hideTools = useCallback(({ view }: { view: dia.ElementView }) => {
    view.removeTools();
  }, []);

  return (
    <Paper
      className="size-full"
      renderElement={RenderElement}
      gridSize={20}
      linkPinning={false}
      linkRouting={ORTHOGONAL_LINKS}
      connectionStrategy={connectionStrategy}
      validateConnection={VALIDATE_CONNECTION}
      snapLinks
      defaultLink={DEFAULT_LINK}
      highlighting={HIGHLIGHTING}
      highlighterNamespace={HIGHLIGHTER_NAMESPACE}
      onCellMouseEnter={showTools}
      onCellMouseLeave={fadeOutTools}
      onElementPointerMove={hideTools}
    />
  );
}

export default function App() {
  return (
    <GraphProvider initialCells={initialCells}>
      <Main />
    </GraphProvider>
  );
}
