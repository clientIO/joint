import type { OnLoadOptions } from '@joint/react';
import { GraphProvider, Paper, type GraphElement } from '@joint/react';
import '../index.css';
import { PAPER_CLASSNAME, PRIMARY, TEXT } from 'storybook-config/theme';
import { dia } from '@joint/core';
import { elementTools, g } from '@joint/core';

// ----------------------------------------------------------------------------
// Type Definitions
// ----------------------------------------------------------------------------
type ElementType =
  | 'linkedProcess'
  | 'input'
  | 'mark'
  | 'actor'
  | 'shipment'
  | 'parallelogram'
  | 'hexagon'
  | 'step'
  | 'trapezoid'
  | 'document'
  | 'plus'
  | 'arrow'
  | 'note'
  | 'table'
  | 'cube'
  | 'card';

interface BaseElement extends GraphElement {
  type: ElementType;
  label: string;
  width: number;
  height: number;
}

interface OffsetElement extends BaseElement {
  type: 'parallelogram' | 'hexagon' | 'step' | 'trapezoid' | 'document' | 'plus' | 'note' | 'card';
  offset: number;
}

interface ArrowElement extends BaseElement {
  type: 'arrow';
  arrowHeight: number;
  thickness: number;
}

interface TableElement extends BaseElement {
  type: 'table';
  dividerX: number;
  dividerY: number;
}

interface CubeElement extends BaseElement {
  type: 'cube';
  cornerX: number;
  cornerY: number;
}

interface SimpleElement extends BaseElement {
  type: 'linkedProcess' | 'input' | 'mark' | 'actor' | 'shipment';
}

type ControlledElement = OffsetElement | ArrowElement | TableElement | CubeElement | SimpleElement;

// ----------------------------------------------------------------------------
// Layout Constants
// ----------------------------------------------------------------------------
const MARGIN = 10;
const COLUMNS_COUNT = 4;
const COLUMNS_GAP = 200;
const ROW_GAP = 140;

function pos(index: number, w: number, h: number) {
  const col = index % COLUMNS_COUNT;
  const row = Math.floor(index / COLUMNS_COUNT);
  return {
    x: MARGIN + col * COLUMNS_GAP + (COLUMNS_GAP - w) / 2,
    y: MARGIN + row * ROW_GAP + (ROW_GAP - h) / 2,
  };
}

// ----------------------------------------------------------------------------
// Initial Elements
// ----------------------------------------------------------------------------
const initialElements: Record<string, ControlledElement> = {
  linkedProcess: {
    type: 'linkedProcess',
    label: 'Linked Process',
    ...pos(0, 120, 50),
    width: 120,
    height: 50,
  },
  input: { type: 'input', label: 'Input', ...pos(1, 100, 50), width: 100, height: 50 },
  mark: { type: 'mark', label: 'Mark', ...pos(2, 120, 50), width: 120, height: 50 },
  actor: { type: 'actor', label: 'Actor', ...pos(3, 50, 100), width: 50, height: 100 },
  parallelogram: {
    type: 'parallelogram',
    label: 'Parallelogram',
    ...pos(4, 80, 60),
    width: 80,
    height: 60,
    offset: 10,
  },
  hexagon: {
    type: 'hexagon',
    label: 'Hexagon',
    ...pos(5, 90, 60),
    width: 90,
    height: 60,
    offset: 20,
  },
  step: { type: 'step', label: 'Step', ...pos(6, 90, 60), width: 90, height: 60, offset: 20 },
  trapezoid: {
    type: 'trapezoid',
    label: 'Trapezoid',
    ...pos(7, 120, 60),
    width: 120,
    height: 60,
    offset: 20,
  },
  document: {
    type: 'document',
    label: 'Document',
    ...pos(8, 120, 50),
    width: 120,
    height: 50,
    offset: 20,
  },
  shipment: { type: 'shipment', label: 'Shipment', ...pos(9, 70, 50), width: 70, height: 50 },
  plus: { type: 'plus', label: 'Plus', ...pos(10, 70, 70), width: 70, height: 70, offset: 20 },
  arrow: {
    type: 'arrow',
    label: 'Arrow',
    ...pos(11, 100, 100),
    width: 100,
    height: 100,
    arrowHeight: 33,
    thickness: 33,
  },
  note: { type: 'note', label: 'Note', ...pos(12, 100, 100), width: 100, height: 100, offset: 20 },
  table: {
    type: 'table',
    label: 'Table',
    ...pos(13, 100, 100),
    width: 100,
    height: 100,
    dividerX: 25,
    dividerY: 25,
  },
  cube: {
    type: 'cube',
    label: 'Cube',
    ...pos(14, 100, 100),
    width: 100,
    height: 100,
    cornerX: 100 / 3,
    cornerY: 40,
  },
  card: { type: 'card', label: 'Card', ...pos(15, 100, 60), width: 100, height: 60, offset: 20 },
};

// ----------------------------------------------------------------------------
// Label Component
// ----------------------------------------------------------------------------
function Label({
  width,
  height,
  label,
}: Readonly<{ width: number; height: number; label: string }>) {
  return (
    <text
      textAnchor="middle"
      dominantBaseline="hanging"
      fontFamily="sans-serif"
      fontSize="13"
      fill={TEXT}
      x={width / 2}
      y={height + 10}
    >
      {label}
    </text>
  );
}

// ----------------------------------------------------------------------------
// Shapes
// ----------------------------------------------------------------------------
function LinkedProcess({ width, height, label }: Readonly<BaseElement>) {
  return (
    <>
      <rect width={width} height={height} fill="#ffffff" stroke="#333333" strokeWidth={2} />
      <path d={`M 10 0 v ${height}`} stroke="#333333" strokeWidth={2} fill="none" />
      <path d={`M ${width - 10} 0 v ${height}`} stroke="#333333" strokeWidth={2} fill="none" />
      <Label width={width} height={height} label={label} />
    </>
  );
}

function InputShape({ width, height, label }: Readonly<BaseElement>) {
  return (
    <>
      <path
        d={`M 0 0 h ${width} v ${height - 10} C ${0.6 * width} ${height - 10} ${0.3 * width} ${height + 5} 0 ${height - 5} z`}
        fill="#ffffff"
        stroke="#333333"
        strokeWidth={2}
      />
      <Label width={width} height={height} label={label} />
    </>
  );
}

function MarkShape({ width, height, label }: Readonly<BaseElement>) {
  const hh = height * 0.5;
  return (
    <>
      <path
        d={`M 0 ${hh} ${hh} 0 H ${width - hh} a 3 3 0 0 1 3 ${height} H ${hh} z`}
        fill="#ffffff"
        stroke="#333333"
        strokeWidth={2}
      />
      <Label width={width} height={height} label={label} />
    </>
  );
}

function ActorShape({ width, height, label }: Readonly<BaseElement>) {
  const headY = 0.2;
  const bodyY = 0.4;
  const legsY = 0.7;
  const cx = width * 0.5;
  const cy = headY * height;
  const r = headY * height;
  return (
    <>
      <rect width={width} height={height} fill="transparent" />
      <path
        d={`M 0 ${0.5 * height} h ${width} M 0 ${height} ${cx} ${legsY * height} ${width} ${height} M ${cx} ${legsY * height} V ${bodyY * height}`}
        fill="none"
        stroke="#333333"
        strokeWidth={2}
      />
      <circle cx={cx} cy={cy} r={r} fill="#ffffff" stroke="#333333" strokeWidth={2} />
      <Label width={width} height={height} label={label} />
    </>
  );
}

function Parallelogram({ width, height, offset = 0, label }: Readonly<OffsetElement>) {
  return (
    <>
      <path
        d={`M 0 ${height} L ${offset} 0 L ${width} 0 L ${width - offset} ${height} Z`}
        fill={PRIMARY}
        stroke={PRIMARY}
      />
      <Label width={width} height={height} label={label} />
    </>
  );
}

function Hexagon({ width, height, offset = 0, label }: Readonly<OffsetElement>) {
  const o = Math.max(0, Math.min(offset, width / 2));
  return (
    <>
      <path
        d={`M 0 ${height / 2} L ${o} ${height} L ${width - o} ${height} L ${width} ${height / 2} L ${width - o} 0 L ${o} 0 Z`}
        fill={PRIMARY}
        stroke={PRIMARY}
      />
      <Label width={width} height={height} label={label} />
    </>
  );
}

function StepShape({ width, height, offset = 0, label }: Readonly<OffsetElement>) {
  const o = Math.max(0, Math.min(offset, width));
  return (
    <>
      <path
        d={`M 0 0 L ${o} ${height / 2} L 0 ${height} L ${width - o} ${height} L ${width} ${height / 2} L ${width - o} 0 Z`}
        fill={PRIMARY}
        stroke={PRIMARY}
      />
      <Label width={width} height={height} label={label} />
    </>
  );
}

function TrapezoidShape({ width, height, offset = 0, label }: Readonly<OffsetElement>) {
  const o = Math.max(0, Math.min(offset, width / 2));
  return (
    <>
      <path
        d={`M 0 ${height} L ${width} ${height} L ${width - o} 0 L ${o} 0 Z`}
        fill={PRIMARY}
        stroke={PRIMARY}
      />
      <Label width={width} height={height} label={label} />
    </>
  );
}

function DocumentShape({ width, height, offset = 0, label }: Readonly<OffsetElement>) {
  const o = Math.max(0, Math.min(offset, height / 2));
  return (
    <>
      <path
        d={`M 0 0 L 0 ${height - o} C ${0.16 * width} ${height} ${0.33 * width} ${height} ${0.5 * width} ${height - o} S ${0.75 * width} ${height - 2 * o} ${width} ${height - o} L ${width} 0 Z`}
        fill={PRIMARY}
        stroke={PRIMARY}
      />
      <Label width={width} height={height} label={label} />
    </>
  );
}

function ShipmentShape({ width, height, label }: Readonly<BaseElement>) {
  const scale = Math.min(width / 256, height / 256);
  const tx = (width - 256 * scale) / 2;
  const ty = (height - 256 * scale) / 2;
  return (
    <>
      <rect width={width} height={height} fill="transparent" />
      <g transform={`translate(${tx},${ty}) scale(${scale})`}>
        <path
          d="M248,119.9v-.2a1.7,1.7,0,0,0-.1-.7v-.3c0-.2-.1-.4-.1-.6v-.2l-.2-.8h-.1l-14-34.8A15.7,15.7,0,0,0,218.6,72H184V64a8,8,0,0,0-8-8H24A16,16,0,0,0,8,72V184a16,16,0,0,0,16,16H37a32,32,0,0,0,62,0h58a32,32,0,0,0,62,0h13a16,16,0,0,0,16-16V120ZM184,88h34.6l9.6,24H184ZM24,72H168v64H24ZM68,208a16,16,0,1,1,16-16A16,16,0,0,1,68,208Zm120,0a16,16,0,1,1,16-16A16,16,0,0,1,188,208Z"
          fill="#333333"
        />
      </g>
      <Label width={width} height={height} label={label} />
    </>
  );
}

function PlusShape({ width, height, offset = 0, label }: Readonly<OffsetElement>) {
  const o = Math.max(0, Math.min(offset, width / 2));
  return (
    <>
      <path
        d={`M ${o} 0 L ${width - o} 0 v ${o} h ${o} V ${height - o} h ${-o} v ${o} H ${o} v ${-o} h ${-o} V ${o} H ${o} z`}
        fill={PRIMARY}
        stroke={PRIMARY}
      />
      <Label width={width} height={height} label={label} />
    </>
  );
}

function Arrow({ width, height, label, arrowHeight = 0, thickness = 0 }: Readonly<ArrowElement>) {
  return (
    <>
      <path
        d={`M ${width - arrowHeight} 0 L ${width} ${height / 2} L ${width - arrowHeight} ${height} v -${height / 2 - thickness / 2} H 0 v -${thickness} H ${width - arrowHeight} z`}
        fill={PRIMARY}
        stroke={PRIMARY}
        strokeWidth="2"
      />
      <Label width={width} height={height} label={label} />
    </>
  );
}

function NoteShape({ width, height, offset = 0, label }: Readonly<OffsetElement>) {
  const o = Math.max(0, Math.min(offset, width));
  return (
    <>
      <path
        d={`M ${o} 0 H ${width} V ${height} H 0 V ${o} Z`}
        fill="#ffffff"
        stroke="#333333"
        strokeWidth={2}
      />
      <path d={`M 0 ${o} H ${o} V 0`} fill="none" stroke="#333333" strokeWidth={2} />
      <Label width={width} height={height} label={label} />
    </>
  );
}

function TableShape({
  width,
  height,
  dividerX = 25,
  dividerY = 25,
  label,
}: Readonly<TableElement>) {
  const dx = Math.max(0, Math.min(dividerX, width));
  const dy = Math.max(0, Math.min(dividerY, height));
  return (
    <>
      <path
        d={`M 0 0 H ${width} V ${height} H 0 Z M 0 ${dy} H ${width} M ${dx} 0 V ${height}`}
        fill="#ffffff"
        stroke="#333333"
        strokeWidth={2}
      />
      <Label width={width} height={height} label={label} />
    </>
  );
}

function CubeShape({ width, height, cornerX = 33, cornerY = 40, label }: Readonly<CubeElement>) {
  const cx = Math.max(0, Math.min(cornerX, width));
  const cy = Math.max(0, Math.min(cornerY, height));
  return (
    <>
      {/* Background outline */}
      <path
        d={`M 0 0 H ${width - cx} L ${width} ${cy} V ${height} H ${cx} L 0 ${height - cy} Z`}
        fill="#ffffff"
        stroke="#333333"
        strokeWidth={2}
      />
      {/* Top face */}
      <path
        d={`M 0 0 H ${width - cx} L ${width} ${cy} H ${cx} Z`}
        fill="#f5f5f5"
        stroke="#333333"
        strokeWidth={2}
      />
      {/* Side face */}
      <path
        d={`M 0 0 L ${cx} ${cy} V ${height} L 0 ${height - cy} Z`}
        fill="#ededed"
        stroke="#333333"
        strokeWidth={2}
      />
      {/* Front face */}
      <rect
        x={cx}
        y={cy}
        width={width - cx}
        height={height - cy}
        fill="#ffffff"
        stroke="#333333"
        strokeWidth={2}
      />
      <Label width={width} height={height} label={label} />
    </>
  );
}

function CardShape({ width, height, offset = 0, label }: Readonly<OffsetElement>) {
  const o = Math.max(0, Math.min(offset, width));
  return (
    <>
      <path
        d={`M ${o} 0 H ${width} A ${height / 2},${o} 90 0 0 ${width},${height} H ${o} A ${height / 2},${o} 90 0 1 ${o},0 Z`}
        fill={PRIMARY}
        stroke={PRIMARY}
      />
      <Label width={width} height={height} label={label} />
    </>
  );
}

// ----------------------------------------------------------------------------
// Controls
// ----------------------------------------------------------------------------
class ParallelogramOffsetControl extends elementTools.Control {
  protected getPosition(view: dia.ElementView) {
    const { model } = view;
    const { width, height } = model.size();
    const controlLevel = (height * 1) / 3;
    const offsetSide = new g.Line(
      new g.Point(model.prop('data/offset'), 0),
      new g.Point(0, height)
    );
    const levelLine = new g.Line(new g.Point(0, controlLevel), new g.Point(width, controlLevel));
    const controlPoint = offsetSide.intersect(levelLine);
    if (controlPoint) return controlPoint;
    return { x: 0, y: controlLevel };
  }

  protected setPosition(view: dia.ElementView, coordinates: dia.Point) {
    const { model } = view;
    const { width } = model.size();
    let offset = coordinates.x * 1.5;
    offset = Math.max(0, Math.min(offset, width));
    model.prop('data/offset', offset);
  }
}

function getVerticalOffsetPosition(view: dia.ElementView, level: number): dia.Point {
  const { model } = view;
  const { width, height } = model.size();
  const offset = model.prop('data/offset') || 0;
  const controlLevel = height * level;
  const offsetSide = new g.Line(new g.Point(offset, 0), new g.Point(offset, height));
  const levelLine = new g.Line(new g.Point(0, controlLevel), new g.Point(width, controlLevel));
  const controlPoint = offsetSide.intersect(levelLine);
  return controlPoint ?? { x: 0, y: controlLevel };
}

class HexagonOffsetControl extends elementTools.Control {
  protected getPosition(view: dia.ElementView) {
    return getVerticalOffsetPosition(view, 0.5);
  }

  protected setPosition(view: dia.ElementView, coordinates: dia.Point) {
    const { width } = view.model.size();
    view.model.prop('data/offset', Math.max(0, Math.min(coordinates.x, width / 2)));
  }
}

class StepOffsetControl extends elementTools.Control {
  protected getPosition(view: dia.ElementView) {
    return getVerticalOffsetPosition(view, 0.5);
  }

  protected setPosition(view: dia.ElementView, coordinates: dia.Point) {
    const { width } = view.model.size();
    view.model.prop('data/offset', Math.max(0, Math.min(coordinates.x, width)));
  }
}

class TrapezoidOffsetControl extends elementTools.Control {
  protected getPosition(view: dia.ElementView) {
    const { model } = view;
    const { width, height } = model.size();
    const controlLevel = (height * 1) / 4;
    const offsetSide = new g.Line(
      new g.Point(model.prop('data/offset'), 0),
      new g.Point(0, height)
    );
    const levelLine = new g.Line(new g.Point(0, controlLevel), new g.Point(width, controlLevel));
    const controlPoint = offsetSide.intersect(levelLine);
    return controlPoint ?? { x: 0, y: controlLevel };
  }

  protected setPosition(view: dia.ElementView, coordinates: dia.Point) {
    const { width } = view.model.size();
    let offset = coordinates.x * (3 / 2);
    offset = Math.max(0, Math.min(offset, width / 2));
    view.model.prop('data/offset', offset);
  }
}

class DocumentOffsetControl extends elementTools.Control {
  protected getPosition(view: dia.ElementView) {
    const { model } = view;
    const { width, height } = model.size();
    const offset = model.prop('data/offset') || 0;
    const curveVertexXFactor = 0.7;
    const inverseCPXFactor = 0.66;

    const controlCurve = new g.Curve(
      new g.Point(0.5 * width, height - offset),
      new g.Point(inverseCPXFactor * width, height - 2 * offset),
      new g.Point(0.75 * width, height - 2 * offset),
      new g.Point(width, height - offset)
    );
    const offsetSide = new g.Line(
      new g.Point(curveVertexXFactor * width, 0),
      new g.Point(curveVertexXFactor * width, height)
    );
    const intersections = offsetSide.intersect(controlCurve.toPolyline());
    return intersections?.[0] ?? { x: 0, y: 0 };
  }

  protected setPosition(view: dia.ElementView, coordinates: dia.Point) {
    const { height } = view.model.size();
    const offset = Math.max(0, Math.min((height - coordinates.y) / 2, height / 2));
    view.model.prop('data/offset', offset);
  }
}

class PlusOffsetControl extends elementTools.Control {
  protected getPosition(view: dia.ElementView) {
    const offset = view.model.prop('data/offset') || 0;
    return { x: offset, y: offset };
  }

  protected setPosition(view: dia.ElementView, coordinates: dia.Point) {
    const { width } = view.model.size();
    let offset = Math.max(coordinates.x, coordinates.y);
    offset = Math.max(0, Math.min(offset, width / 2));
    view.model.prop('data/offset', offset);
  }
}

class ArrowOffsetControl extends elementTools.Control {
  protected getPosition(view: dia.ElementView) {
    const { model } = view;
    const { arrowHeight, thickness } = model.prop('data');
    const { width, height } = model.size();
    return { x: width - arrowHeight, y: height / 2 - thickness / 2 };
  }

  protected setPosition(view: dia.ElementView, coordinates: dia.Point) {
    const { model } = view;
    const { width, height } = model.size();
    const arrowHeight = Math.max(0, Math.min(width - coordinates.x, width));
    const thickness = Math.max(0, Math.min(height - 2 * coordinates.y, height));
    model.prop('data/arrowHeight', arrowHeight);
    model.prop('data/thickness', thickness);
  }
}

class NoteOffsetControl extends elementTools.Control {
  protected getPosition(view: dia.ElementView) {
    const offset = view.model.prop('data/offset') || 0;
    return { x: offset, y: offset };
  }

  protected setPosition(view: dia.ElementView, coordinates: dia.Point) {
    const { width } = view.model.size();
    let offset = Math.max(coordinates.x, coordinates.y);
    offset = Math.max(0, Math.min(offset, width));
    view.model.prop('data/offset', offset);
  }
}

class TableDividerControl extends elementTools.Control {
  protected getPosition(view: dia.ElementView) {
    const dividerX = view.model.prop('data/dividerX') || 0;
    const dividerY = view.model.prop('data/dividerY') || 0;
    return { x: dividerX, y: dividerY };
  }

  protected setPosition(view: dia.ElementView, coordinates: dia.Point) {
    const { width, height } = view.model.size();
    view.model.prop('data/dividerX', Math.max(0, Math.min(coordinates.x, width)));
    view.model.prop('data/dividerY', Math.max(0, Math.min(coordinates.y, height)));
  }
}

class CubeCornerControl extends elementTools.Control {
  protected getPosition(view: dia.ElementView) {
    const cornerX = view.model.prop('data/cornerX') || 0;
    const cornerY = view.model.prop('data/cornerY') || 0;
    return { x: cornerX, y: cornerY };
  }

  protected setPosition(view: dia.ElementView, coordinates: dia.Point) {
    const { width, height } = view.model.size();
    const defaultAspect = 100 / 3 / 40;
    const xFromX = Math.max(0, Math.min(coordinates.x, width));
    const xFromY = Math.max(0, Math.min(coordinates.y, height)) * defaultAspect;
    const x = Math.min(xFromX, xFromY);
    const y = x / defaultAspect;
    view.model.prop('data/cornerX', x);
    view.model.prop('data/cornerY', y);
  }
}

class CardOffsetControl extends elementTools.Control {
  protected getPosition(view: dia.ElementView) {
    const offset = view.model.prop('data/offset') || 0;
    const { width, height } = view.model.size();
    return { x: width - offset, y: height / 2 };
  }

  protected setPosition(view: dia.ElementView, coordinates: dia.Point) {
    const { width } = view.model.size();
    view.model.prop('data/offset', Math.max(0, Math.min(width / 2, width - coordinates.x)));
  }
}

// ----------------------------------------------------------------------------
// Render Element
// ----------------------------------------------------------------------------
function renderElement(element: ControlledElement) {
  switch (element.type) {
    case 'linkedProcess': {
      return <LinkedProcess {...element} />;
    }
    case 'input': {
      return <InputShape {...element} />;
    }
    case 'mark': {
      return <MarkShape {...element} />;
    }
    case 'actor': {
      return <ActorShape {...element} />;
    }
    case 'parallelogram': {
      return <Parallelogram {...element} />;
    }
    case 'hexagon': {
      return <Hexagon {...element} />;
    }
    case 'step': {
      return <StepShape {...element} />;
    }
    case 'trapezoid': {
      return <TrapezoidShape {...element} />;
    }
    case 'document': {
      return <DocumentShape {...element} />;
    }
    case 'shipment': {
      return <ShipmentShape {...element} />;
    }
    case 'plus': {
      return <PlusShape {...element} />;
    }
    case 'arrow': {
      return <Arrow {...element} />;
    }
    case 'note': {
      return <NoteShape {...element} />;
    }
    case 'table': {
      return <TableShape {...element} />;
    }
    case 'cube': {
      return <CubeShape {...element} />;
    }
    case 'card': {
      return <CardShape {...element} />;
    }
    default: {
      return null;
    }
  }
}

// ----------------------------------------------------------------------------
// Add Element Controls
// ----------------------------------------------------------------------------
const controlMap: Partial<Record<ElementType, () => elementTools.Control>> = {
  parallelogram: () => new ParallelogramOffsetControl(),
  hexagon: () => new HexagonOffsetControl(),
  step: () => new StepOffsetControl(),
  trapezoid: () => new TrapezoidOffsetControl(),
  document: () => new DocumentOffsetControl(),
  plus: () => new PlusOffsetControl(),
  arrow: () => new ArrowOffsetControl(),
  note: () => new NoteOffsetControl(),
  table: () => new TableDividerControl(),
  cube: () => new CubeCornerControl(),
  card: () => new CardOffsetControl(),
};

function addElementControls({ paper, graph }: OnLoadOptions) {
  for (const element of graph.getElements()) {
    const type = element.prop('data/type') as ElementType;
    const factory = controlMap[type];
    if (!factory) continue;
    const toolsView = new dia.ToolsView({ tools: [factory()] });
    element.findView(paper).addTools(toolsView);
  }
}

// ----------------------------------------------------------------------------
// Application Components
// ----------------------------------------------------------------------------
function Main() {
  return (
    <Paper
      width="100%"
      height={600}
      className={PAPER_CLASSNAME}
      renderElement={renderElement}
      onElementsSizeReady={addElementControls}
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
