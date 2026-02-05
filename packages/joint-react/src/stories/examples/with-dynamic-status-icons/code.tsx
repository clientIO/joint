/* eslint-disable react-perf/jsx-no-new-function-as-prop */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */

import { g, highlighters, V } from '@joint/core';
import type { GraphElement } from '@joint/react';
import { GraphProvider, Paper, TextNode, useGraph } from '@joint/react';
import { useCallback, useEffect } from 'react';
import { BG, PAPER_CLASSNAME, PRIMARY, TEXT } from 'storybook-config/theme';

const ShapeTypes = {
  rectangle: 'rectangle',
  circle: 'circle',
  ellipse: 'ellipse',
  path: 'path',
} as const;

type ShapeType = (typeof ShapeTypes)[keyof typeof ShapeTypes];

interface ShapeElement extends GraphElement {
  readonly type: ShapeType;
  readonly width: number;
  readonly height: number;
  readonly x: number;
  readonly y: number;
  readonly label: string;
}

const initialElements: Record<string, ShapeElement> = {
  rectangle: {
    type: ShapeTypes.rectangle,
    width: 100,
    height: 100,
    x: 20,
    y: 20,
    label: 'Rectangle',
  },
  circle: {
    type: ShapeTypes.circle,
    width: 100,
    height: 100,
    x: 160,
    y: 20,
    label: 'Circle',
  },
  ellipse: {
    type: ShapeTypes.ellipse,
    width: 150,
    height: 100,
    x: 320,
    y: 20,
    label: 'Ellipse',
  },
  path: {
    type: ShapeTypes.path,
    width: 100,
    height: 100,
    x: 520,
    y: 20,
    label: 'Path',
  },
};

// ----------------------------------------------------------------------------
// Shapes
// ----------------------------------------------------------------------------
function RectangleShape({ width, height, label }: Readonly<ShapeElement>) {
  return (
    <>
      <rect width={width} height={height} fill={BG} stroke={PRIMARY} strokeWidth={2} />
      <TextNode
        x={width / 2}
        y={height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={TEXT}
        fontSize={14}
        fontWeight="bold"
      >
        {label}
      </TextNode>
    </>
  );
}

function CircleShape({ width, height, label }: Readonly<ShapeElement>) {
  return (
    <>
      <circle
        cx={width / 2}
        cy={height / 2}
        r={width / 2}
        fill={BG}
        stroke={PRIMARY}
        strokeWidth={2}
      />
      <TextNode
        x={width / 2}
        y={height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={TEXT}
        fontSize={14}
        fontWeight="bold"
      >
        {label}
      </TextNode>
    </>
  );
}

function EllipseShape({ width, height, label }: Readonly<ShapeElement>) {
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
      <TextNode
        x={width / 2}
        y={height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={TEXT}
        fontSize={14}
        fontWeight="bold"
      >
        {label}
      </TextNode>
    </>
  );
}

function PathShape({ width, height, label }: Readonly<ShapeElement>) {
  return (
    <>
      <path
        d={`M 0 ${0.25 * height} 0 ${0.75 * height} ${0.6 * width} ${height} C ${1.2 * width} ${height} ${1.2 * width} 0 ${0.6 * width} 0 Z`}
        fill={BG}
        stroke={PRIMARY}
        strokeWidth={2}
      />
      <TextNode
        x={width / 2}
        y={height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={TEXT}
        fontSize={14}
        fontWeight="bold"
      >
        {label}
      </TextNode>
    </>
  );
}
// ----------------------------------------------------------------------------
// Renderer
// ----------------------------------------------------------------------------
function RenderElement(props: Readonly<ShapeElement>) {
  switch (props.type) {
    case ShapeTypes.rectangle: {
      return <RectangleShape {...props} />;
    }
    case ShapeTypes.circle: {
      return <CircleShape {...props} />;
    }
    case ShapeTypes.ellipse: {
      return <EllipseShape {...props} />;
    }
    case ShapeTypes.path: {
      return <PathShape {...props} />;
    }
  }
}

// ----------------------------------------------------------------------------
// Custom Highlighter
// ----------------------------------------------------------------------------
class StatusList extends highlighters.list {
  createListItem(color: string, { width, height }: { width: number; height: number }) {
    const { node } = V('ellipse', {
      rx: width / 2,
      ry: height / 2,
      cx: width / 2,
      cy: height / 2,
      fill: color,
      stroke: '#333',
      strokeWidth: 2,
    });

    return node;
  }
}

// ----------------------------------------------------------------------------
// Helper Functions
// ----------------------------------------------------------------------------
function randomColor() {
  // eslint-disable-next-line unicorn/numeric-separators-style, sonarjs/pseudo-random
  return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
}
// ----------------------------------------------------------------------------
// Custom Hooks
// ----------------------------------------------------------------------------
function useInterval(action: () => void, interval: number = 1000) {
  useEffect(() => {
    const intervalId = setInterval(action, interval);
    return () => clearInterval(intervalId);
  }, [action, interval]);
}

// ----------------------------------------------------------------------------
// Application Components
// ----------------------------------------------------------------------------
function Main() {
  const graph = useGraph();

  const setRandomStatuses = useCallback(() => {
    for (const element of graph.getElements()) {
      const status = Array.from({ length: g.random(1, 4) }).map(() => randomColor());
      element.prop('status', status);
    }
  }, [graph]);

  useInterval(setRandomStatuses);

  useEffect(() => {
    setRandomStatuses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Paper
      width="100%"
      height={500}
      className={PAPER_CLASSNAME}
      renderElement={RenderElement}
      async
      gridSize={20}
      drawGrid={{ name: 'mesh' }}
      onElementsSizeReady={({ paper }) => {
        for (const element of graph.getElements()) {
          StatusList.add(element.findView(paper), 'root', 'status', {
            attribute: 'status',
            position: 'top-right',
            margin: { right: 5, top: 5 },
            gap: 3,
            direction: 'row',
          });
        }
      }}
    />
  );
}

export default function App() {
  return (
    <GraphProvider elements={initialElements}>
      <Main />
    </GraphProvider>
  );
}
