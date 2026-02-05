/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import { useEffect, useRef } from 'react';
import type { GraphLink, GraphElement } from '@joint/react';
import { GraphProvider, jsx, Paper } from '@joint/react';
import { PAPER_CLASSNAME, BG, PRIMARY, TEXT, LIGHT } from 'storybook-config/theme';
import { dia, elementTools, linkTools, highlighters, shapes, g } from '@joint/core';

import '../index.css';

// ----------------------------------------------------------------------------
// Type Definitions
// ----------------------------------------------------------------------------
const ShapeTypes = {
  square: 'square',
  rectangle: 'rectangle',
  ellipse: 'ellipse',
} as const;

type ShapeType = typeof ShapeTypes[keyof typeof ShapeTypes];

interface BaseElement extends GraphElement {
  readonly shapeType: ShapeType;
  readonly label?: string;
  readonly width: number;
  readonly height: number;
}

interface SquareElement extends BaseElement {
  readonly shapeType: typeof ShapeTypes.square;
}

interface RectangleElement extends BaseElement {
  readonly shapeType: typeof ShapeTypes.rectangle;
}

interface EllipseElement extends BaseElement {
  readonly shapeType: typeof ShapeTypes.ellipse;
}

type CustomElement = SquareElement | RectangleElement | EllipseElement;

// ----------------------------------------------------------------------------
// Colors
// ----------------------------------------------------------------------------
const GRID_COLOR = '#1a2938';
const ANCHOR_FILL = '#f6f740';
const ANCHOR_STROKE = '#131e29';

// ----------------------------------------------------------------------------
// Anchor Helper Functions
// ----------------------------------------------------------------------------

function getAnchors(shapeType: ShapeType, width: number, height: number): dia.Point[] {
  switch (shapeType) {
    case ShapeTypes.square: {
      // 3 anchors on each side
      return [
        { x: width / 4, y: 0 },
        { x: width / 2, y: 0 },
        { x: (width / 4) * 3, y: 0 },
        { x: width, y: height / 4 },
        { x: width, y: height / 2 },
        { x: width, y: (height / 4) * 3 },
        { x: (width / 4) * 3, y: height },
        { x: width / 2, y: height },
        { x: width / 4, y: height },
        { x: 0, y: (height / 4) * 3 },
        { x: 0, y: height / 2 },
        { x: 0, y: height / 4 },
      ];
    }
    case ShapeTypes.rectangle: {
      const anchors: dia.Point[] = [];
      for (let xPosition = 20; xPosition < width; xPosition += 20) {
        anchors.push({ x: xPosition, y: 0 }, { x: xPosition, y: height });
      }
      return anchors;
    }
    case ShapeTypes.ellipse: {
      // 1 anchor on each side
      return [
        { x: width / 2, y: 0 },
        { x: width, y: height / 2 },
        { x: width / 2, y: height },
        { x: 0, y: height / 2 },
      ];
    }
    default: {
      return [];
    }
  }
}

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

// ----------------------------------------------------------------------------
// Initial Data
// ----------------------------------------------------------------------------
const initialElements: Record<string, CustomElement> = {
  square1: {
    shapeType: ShapeTypes.square,
    label: 'S1',
    x: 100,
    y: 100,
    width: 80,
    height: 80,
  },
  square2: {
    shapeType: ShapeTypes.square,
    label: 'S2',
    x: 340,
    y: 100,
    width: 80,
    height: 80,
  },
  ellipse1: {
    shapeType: ShapeTypes.ellipse,
    label: 'E',
    x: 220,
    y: 300,
    width: 80,
    height: 80,
  },
  rectangle1: {
    shapeType: ShapeTypes.rectangle,
    x: 100,
    y: 500,
    width: 320,
    height: 40,
  },
};

const initialLinks: Record<string, GraphLink> = {
  link1: {
    source: {
      id: 'square1',
      anchor: { name: 'modelCenter', args: { dx: 40, dy: -20 } },
    },
    target: {
      id: 'square2',
      anchor: { name: 'modelCenter', args: { dx: -40, dy: -20 } },
    },
    color: LIGHT,
    width: 2,
  },
  link2: {
    source: {
      id: 'ellipse1',
      anchor: { name: 'modelCenter', args: { dx: -40, dy: 0 } },
    },
    target: {
      id: 'rectangle1',
      anchor: { name: 'modelCenter', args: { dx: -80, dy: -20 } },
    },
    color: LIGHT,
    width: 2,
  },
  link3: {
    source: {
      id: 'rectangle1',
      anchor: { name: 'modelCenter', args: { dx: 80, dy: -20 } },
    },
    target: {
      id: 'ellipse1',
      anchor: { name: 'modelCenter', args: { dx: 40, dy: 0 } },
    },
    color: LIGHT,
    width: 2,
  },
  link4: {
    source: {
      id: 'square2',
      anchor: { name: 'modelCenter', args: { dx: -40, dy: 20 } },
    },
    target: {
      id: 'ellipse1',
      anchor: { name: 'modelCenter', args: { dx: 0, dy: -40 } },
    },
    color: LIGHT,
    width: 2,
  },
  link5: {
    source: {
      id: 'square2',
      anchor: { name: 'modelCenter', args: { dx: -40, dy: 0 } },
    },
    target: {
      id: 'square1',
      anchor: { name: 'modelCenter', args: { dx: 40, dy: 0 } },
    },
    color: LIGHT,
    width: 2,
  },
};

// ----------------------------------------------------------------------------
// Custom Highlighter
// ----------------------------------------------------------------------------
const AnchorsHighlighter = dia.HighlighterView.extend({
  tagName: 'g',
  attributes: {
    stroke: ANCHOR_STROKE,
    fill: ANCHOR_FILL,
    'stroke-width': 2,
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

// ----------------------------------------------------------------------------
// Shapes
// ----------------------------------------------------------------------------
function Rectangle({ width, height, label }: Readonly<SquareElement | RectangleElement>) {
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

function Ellipse({ width, height, label }: Readonly<EllipseElement>) {
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

// ----------------------------------------------------------------------------
// Element Rendering
// ----------------------------------------------------------------------------
function RenderElement(element: CustomElement) {

  switch (element.shapeType) {
    case ShapeTypes.square:
    case ShapeTypes.rectangle: {
      return <Rectangle {...element} />;
    }
    case ShapeTypes.ellipse: {
      return <Ellipse {...element} />;
    }
  }
}

// ----------------------------------------------------------------------------
// Tool Markup
// ----------------------------------------------------------------------------
const anchorButtonMarkup = jsx(
  <circle
    r={6}
    stroke={ANCHOR_STROKE}
    strokeWidth={4}
    fill={ANCHOR_FILL}
    cursor="pointer"
  />
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

// ----------------------------------------------------------------------------
// Tools
// ----------------------------------------------------------------------------
function getElementTools(elementView: dia.ElementView) {
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

function getLinkTools(_linkView: dia.LinkView) {
  const VertexHandle = linkTools.Vertices.VertexHandle.extend({
    attributes: {
      r: 6,
      fill: ANCHOR_FILL,
      stroke: ANCHOR_STROKE,
      'stroke-width': 2,
      cursor: 'move',
    },
  });

  const tools: dia.ToolView[] = [
    new linkTools.Vertices({
      handleClass: VertexHandle,
    }),
    new linkTools.Remove({
      distance: -40,
      markup: removeButtonMarkup,
    }),
    new linkTools.Remove({
      distance: 40,
      markup: removeButtonMarkup,
      visibility: (view) => view.getConnectionLength() > 200,
    })
  ];

  return tools;
}

// ----------------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------------
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

  return (
    <Paper
      width="100%"
      height={650}
      className={PAPER_CLASSNAME}
      renderElement={RenderElement}
      gridSize={20}
      drawGrid={{ name: 'mesh', args: { color: GRID_COLOR } }}
      background={{ color: BG }}
      linkPinning={false}
      async
      // Connector/Router configuration
      defaultConnector={{ name: 'straight', args: { cornerType: 'line' } }}
      defaultRouter={{ name: 'rightAngle', args: { useVertices: true, margin: 40 } }}
      defaultConnectionPoint={{ name: 'anchor', args: { offset: 10 } }}
      // Connection strategy - find closest anchor point
      connectionStrategy={(end, view, _magnet, coords) => {
        const model = view.model as dia.Element;
        const { width, height } = model.size();
        const shapeType = model.prop('data/shapeType') as ShapeType;
        const anchors = getAnchors(shapeType, width, height);
        const relativePoint = model.getRelativePointFromAbsolute(coords);
        const anchor = findClosestAnchor(anchors, relativePoint);
        return {
          anchor: {
            name: 'modelCenter',
            args: {
              dx: anchor.x - width / 2,
              dy: anchor.y - height / 2,
            },
          },
          id: end.id,
        };
      }}
      snapLinks
      defaultLink={() => new shapes.standard.Link({ attrs: { line: { stroke: LIGHT } } })}
      // Highlighting configuration
      highlighting={{
        connecting: {
          name: 'anchors',
        },
      }}
      highlighterNamespace={{ ...highlighters, anchors: AnchorsHighlighter }}
      validateConnection={(sourceView, _sourceMagnet, targetView) =>
        sourceView.model.isElement() && targetView.model.isElement() && sourceView !== targetView
      }
      // Event handlers
      onCellMouseEnter={({ cellView, paper }) => {
        paper.removeTools();

        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = null;
        }

        const tools = cellView.model.isLink()
          ? getLinkTools(cellView as dia.LinkView)
          : getElementTools(cellView as dia.ElementView);
        
        const toolsView = new dia.ToolsView({ tools });
        cellView.addTools(toolsView);
        currentToolsViewRef.current = toolsView;
      }}
      onCellMouseLeave={() => {
        timeoutIdRef.current = setTimeout(() => {
          currentToolsViewRef.current?.remove();
          currentToolsViewRef.current = null;
          timeoutIdRef.current = null;
        }, 1000);

        currentToolsViewRef.current?.el.classList.add('opacity-0','transition-opacity','duration-300', 'delay-300');
      }}
      onElementPointerMove={({ elementView }) => {
        if (elementView.hasTools()) {
          elementView.removeTools();
        }
      }}
    />
  );
}

// ----------------------------------------------------------------------------
// App Component
// ----------------------------------------------------------------------------
export default function App() {
  return (
    <GraphProvider
      elements={initialElements}
      links={initialLinks}
      mapDataToElementAttributes={({ defaultAttributes }) => {
        return {
          ...defaultAttributes(),
          attrs: {
            root: {
              magnet: 'passive'
            }
          }
        };
      }}
    >
      <Main />
    </GraphProvider>
  );
}
