import { g, highlighters, V } from '@joint/core';
import type { CellRecord } from '@joint/react';
import {
  GraphProvider,
  useCell,
  Paper,
  SVGText,
  useGraph,
  useOnElementsMeasured,
  selectElementSize,
} from '@joint/react';
import { useCallback, useEffect } from 'react';

// Colors — unified dark diagram palette. The status dot colors are random on
// purpose: the color IS the status this demo renders.
const SHAPE_STROKE_COLOR = '#ED2637';
const SHAPE_FILL_COLOR = '#1c2836';
const STATUS_STROKE_COLOR = '#3c4f63';
const TEXT_COLOR = '#DDE6ED';


const ShapeTypes = {
  rectangle: 'rectangle',
  circle: 'circle',
  ellipse: 'ellipse',
  path: 'path',
} as const;

type ShapeType = (typeof ShapeTypes)[keyof typeof ShapeTypes];

interface ShapeData {
  readonly type: ShapeType;
  readonly label: string;
}

const initialCells: ReadonlyArray<CellRecord<ShapeData>> = [
  {
    id: 'rectangle',
    type: 'element',
    data: { type: ShapeTypes.rectangle, label: 'Rectangle' },
    size: { width: 100, height: 100 },
    position: { x: 20, y: 20 },
  },
  {
    id: 'circle',
    type: 'element',
    data: { type: ShapeTypes.circle, label: 'Circle' },
    size: { width: 100, height: 100 },
    position: { x: 160, y: 20 },
  },
  {
    id: 'ellipse',
    type: 'element',
    data: { type: ShapeTypes.ellipse, label: 'Ellipse' },
    size: { width: 150, height: 100 },
    position: { x: 320, y: 20 },
  },
  {
    id: 'path',
    type: 'element',
    data: { type: ShapeTypes.path, label: 'Path' },
    size: { width: 100, height: 100 },
    position: { x: 520, y: 20 },
  },
];

interface ShapeLabelProps {
  readonly label: string;
  readonly width: number;
  readonly height: number;
}

function ShapeLabel({ label, width, height }: Readonly<ShapeLabelProps>) {
  return (
    <SVGText
      x={width / 2}
      y={height / 2}
      textAnchor="middle"
      dominantBaseline="middle"
      fill={TEXT_COLOR}
      fontSize={14}
      fontWeight="bold"
    >
      {label}
    </SVGText>
  );
}

function RectangleShape({ label }: Readonly<ShapeData>) {
  const { width, height } = useCell(selectElementSize);
  return (
    <>
      <rect
        width={width}
        height={height}
        fill={SHAPE_FILL_COLOR}
        stroke={SHAPE_STROKE_COLOR}
        strokeWidth={2}
      />
      <ShapeLabel label={label} width={width} height={height} />
    </>
  );
}

function CircleShape({ label }: Readonly<ShapeData>) {
  const { width, height } = useCell(selectElementSize);
  return (
    <>
      <circle
        cx={width / 2}
        cy={height / 2}
        r={width / 2}
        fill={SHAPE_FILL_COLOR}
        stroke={SHAPE_STROKE_COLOR}
        strokeWidth={2}
      />
      <ShapeLabel label={label} width={width} height={height} />
    </>
  );
}

function EllipseShape({ label }: Readonly<ShapeData>) {
  const { width, height } = useCell(selectElementSize);
  return (
    <>
      <ellipse
        cx={width / 2}
        cy={height / 2}
        rx={width / 2}
        ry={height / 2}
        fill={SHAPE_FILL_COLOR}
        stroke={SHAPE_STROKE_COLOR}
        strokeWidth={2}
      />
      <ShapeLabel label={label} width={width} height={height} />
    </>
  );
}

function PathShape({ label }: Readonly<ShapeData>) {
  const { width, height } = useCell(selectElementSize);
  return (
    <>
      <path
        d={`M 0 ${0.25 * height} 0 ${0.75 * height} ${0.6 * width} ${height} C ${1.2 * width} ${height} ${1.2 * width} 0 ${0.6 * width} 0 Z`}
        fill={SHAPE_FILL_COLOR}
        stroke={SHAPE_STROKE_COLOR}
        strokeWidth={2}
      />
      <ShapeLabel label={label} width={width} height={height} />
    </>
  );
}

function RenderElement(data: Readonly<ShapeData>) {
  switch (data.type) {
    case ShapeTypes.rectangle: {
      return <RectangleShape {...data} />;
    }
    case ShapeTypes.circle: {
      return <CircleShape {...data} />;
    }
    case ShapeTypes.ellipse: {
      return <EllipseShape {...data} />;
    }
    case ShapeTypes.path: {
      return <PathShape {...data} />;
    }
  }
}

/** Renders each status entry as a colored ellipse in the highlighter's list. */
class StatusList extends highlighters.list {
  createListItem(color: string, { width, height }: { width: number; height: number }) {
    const { node } = V('ellipse', {
      rx: width / 2,
      ry: height / 2,
      cx: width / 2,
      cy: height / 2,
      fill: color,
      stroke: STATUS_STROKE_COLOR,
      strokeWidth: 2,
    });
    return node;
  }
}

function randomColor() {
  // eslint-disable-next-line unicorn/numeric-separators-style, sonarjs/pseudo-random
  return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
}

function useInterval(action: () => void, interval: number = 1000) {
  useEffect(() => {
    const intervalId = setInterval(action, interval);
    return () => clearInterval(intervalId);
  }, [action, interval]);
}

function Main() {
  const { graph } = useGraph();

  const setRandomStatuses = useCallback(() => {
    for (const element of graph.getElements()) {
      const status = Array.from({ length: g.random(1, 4) }).map(() => randomColor());
      element.prop('status', status);
    }
  }, [graph]);

  useInterval(setRandomStatuses);

  useOnElementsMeasured(({ isInitial, paper }) => {
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
    <Paper className="size-full" renderElement={RenderElement} drawGrid={false} />
  );
}

export default function App() {
  return (
    <GraphProvider initialCells={initialCells}>
      <Main />
    </GraphProvider>
  );
}
