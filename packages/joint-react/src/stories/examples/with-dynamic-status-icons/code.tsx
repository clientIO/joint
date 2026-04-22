/* eslint-disable react-perf/jsx-no-new-object-as-prop */

import { type dia, g, highlighters, V } from '@joint/core';
import type { ElementRecord } from '@joint/react';
import {
  GraphProvider,
  Paper,
  SVGText,
  useElementSize,
  useGraph,
  useNodesMeasuredEffect,
} from '@joint/react';
import { useCallback, useEffect, useId, useRef } from 'react';
import { BG, PAPER_CLASSNAME, PAPER_STYLE, PRIMARY, TEXT } from 'storybook-config/theme';

const ShapeTypes = {
  rectangle: 'rectangle',
  circle: 'circle',
  ellipse: 'ellipse',
  path: 'path',
} as const;

type ShapeType = (typeof ShapeTypes)[keyof typeof ShapeTypes];

interface ShapeElement {
  readonly type: ShapeType;
  readonly label: string;
}

const initialElements: Record<string, ElementRecord<ShapeElement>> = {
  rectangle: {
    data: { type: ShapeTypes.rectangle, label: 'Rectangle' },
    size: { width: 100, height: 100 },
    position: { x: 20, y: 20 },
  },
  circle: {
    data: { type: ShapeTypes.circle, label: 'Circle' },
    size: { width: 100, height: 100 },
    position: { x: 160, y: 20 },
  },
  ellipse: {
    data: { type: ShapeTypes.ellipse, label: 'Ellipse' },
    size: { width: 150, height: 100 },
    position: { x: 320, y: 20 },
  },
  path: {
    data: { type: ShapeTypes.path, label: 'Path' },
    size: { width: 100, height: 100 },
    position: { x: 520, y: 20 },
  },
};

// ----------------------------------------------------------------------------
// Shapes
// ----------------------------------------------------------------------------
function RectangleShape({ label }: Readonly<ShapeElement>) {
  const { width, height } = useElementSize();
  return (
    <>
      <rect width={width} height={height} fill={BG} stroke={PRIMARY} strokeWidth={2} />
      <SVGText
        x={width / 2}
        y={height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={TEXT}
        fontSize={14}
        fontWeight="bold"
      >
        {label}
      </SVGText>
    </>
  );
}

function CircleShape({ label }: Readonly<ShapeElement>) {
  const { width, height } = useElementSize();
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
      <SVGText
        x={width / 2}
        y={height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={TEXT}
        fontSize={14}
        fontWeight="bold"
      >
        {label}
      </SVGText>
    </>
  );
}

function EllipseShape({ label }: Readonly<ShapeElement>) {
  const { width, height } = useElementSize();
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
      <SVGText
        x={width / 2}
        y={height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={TEXT}
        fontSize={14}
        fontWeight="bold"
      >
        {label}
      </SVGText>
    </>
  );
}

function PathShape({ label }: Readonly<ShapeElement>) {
  const { width, height } = useElementSize();
  return (
    <>
      <path
        d={`M 0 ${0.25 * height} 0 ${0.75 * height} ${0.6 * width} ${height} C ${1.2 * width} ${height} ${1.2 * width} 0 ${0.6 * width} 0 Z`}
        fill={BG}
        stroke={PRIMARY}
        strokeWidth={2}
      />
      <SVGText
        x={width / 2}
        y={height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={TEXT}
        fontSize={14}
        fontWeight="bold"
      >
        {label}
      </SVGText>
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
  const { graph } = useGraph();
  const paperId = useId();
  const paperRef = useRef<dia.Paper | null>(null);

  const setRandomStatuses = useCallback(() => {
    for (const element of graph.getElements()) {
      const status = Array.from({ length: g.random(1, 4) }).map(() => randomColor());
      element.prop('status', status);
    }
  }, [graph]);

  useInterval(setRandomStatuses);

  useNodesMeasuredEffect(paperId, ({ isInitial, paper }) => {
    if (!isInitial) return;
    for (const element of graph.getElements()) {
      StatusList.add(element.findView(paper), 'root', 'status', {
        attribute: 'status',
        position: 'top-right',
        margin: { right: 5, top: 5 },
        gap: 3,
        direction: 'row',
      });
    }
    setRandomStatuses();
  });

  return (
    <Paper
      ref={paperRef}
      id={paperId}
      height={500}
      className={PAPER_CLASSNAME}
      renderElement={RenderElement}
      gridSize={20}
      drawGrid={{ name: 'mesh' }}
      style={PAPER_STYLE}
    />
  );
}

export default function App() {
  return (
    <GraphProvider initialElements={initialElements}>
      <Main />
    </GraphProvider>
  );
}
