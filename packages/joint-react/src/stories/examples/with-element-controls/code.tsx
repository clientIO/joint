import {
  GraphProvider,
  Paper,
  useElementSize,
  useNodesMeasuredEffect,
  type Cells,
  type ElementRecord,
} from '@joint/react';
import '../index.css';
import { PAPER_CLASSNAME, PAPER_STYLE, PRIMARY, LIGHT, TEXT } from 'storybook-config/theme';
import { dia, elementTools, g } from '@joint/core';
import { useCallback, useId } from 'react';

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

interface BaseElement {
  type: ElementType;
  label: string;
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

function pos(id: string, index: number, w: number, h: number, data: ControlledElement): ElementRecord<ControlledElement> {
  const col = index % COLUMNS_COUNT;
  const row = Math.floor(index / COLUMNS_COUNT);
  return {
    id,
    type: 'ElementModel',
    data,
    position: {
      x: MARGIN + col * COLUMNS_GAP + (COLUMNS_GAP - w) / 2,
      y: MARGIN + row * ROW_GAP + (ROW_GAP - h) / 2,
    },
    size: { width: w, height: h },
  };
}

// ----------------------------------------------------------------------------
// Initial Cells
// ----------------------------------------------------------------------------
const initialCells: Cells<ControlledElement> = [
  pos('linkedProcess', 0, 120, 50, { type: 'linkedProcess', label: 'Linked Process' }),
  pos('input', 1, 100, 50, { type: 'input', label: 'Input' }),
  pos('mark', 2, 120, 50, { type: 'mark', label: 'Mark' }),
  pos('actor', 15, 50, 100, { type: 'actor', label: 'Actor' }),
  pos('parallelogram', 4, 80, 60, { type: 'parallelogram', label: 'Parallelogram', offset: 10 }),
  pos('hexagon', 5, 90, 60, { type: 'hexagon', label: 'Hexagon', offset: 20 }),
  pos('step', 6, 90, 60, { type: 'step', label: 'Step', offset: 20 }),
  pos('trapezoid', 7, 120, 60, { type: 'trapezoid', label: 'Trapezoid', offset: 20 }),
  pos('document', 8, 120, 50, { type: 'document', label: 'Document', offset: 20 }),
  pos('shipment', 3, 70, 50, { type: 'shipment', label: 'Shipment' }),
  pos('plus', 10, 70, 70, { type: 'plus', label: 'Plus', offset: 20 }),
  pos('arrow', 11, 100, 100, { type: 'arrow', label: 'Arrow', arrowHeight: 33, thickness: 33 }),
  pos('note', 12, 100, 100, { type: 'note', label: 'Note', offset: 20 }),
  pos('table', 13, 100, 100, { type: 'table', label: 'Table', dividerX: 25, dividerY: 25 }),
  pos('cube', 14, 100, 100, { type: 'cube', label: 'Cube', cornerX: 100 / 3, cornerY: 40 }),
  pos('card', 9, 100, 60, { type: 'card', label: 'Card', offset: 20 }),
];

// ----------------------------------------------------------------------------
// Label Component
// ----------------------------------------------------------------------------
function Label({ label }: Readonly<{ label: string }>) {
  const { width = 0, height = 0 } = useElementSize() ?? {};
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
function LinkedProcess({ label }: Readonly<BaseElement>) {
  const { width = 0, height = 0 } = useElementSize() ?? {};

  return (
    <>
      <rect width={width} height={height} fill="transparent" stroke={PRIMARY} strokeWidth={2} />
      <path d={`M 10 0 v ${height}`} stroke={PRIMARY} strokeWidth={2} fill="none" />
      <path d={`M ${width - 10} 0 v ${height}`} stroke={PRIMARY} strokeWidth={2} fill="none" />
      <Label label={label} />
    </>
  );
}

function InputShape({ label }: Readonly<BaseElement>) {
  const { width = 0, height = 0 } = useElementSize() ?? {};
  return (
    <>
      <path
        d={`M 0 0 h ${width} v ${height - 10} C ${0.6 * width} ${height - 10} ${0.3 * width} ${height + 5} 0 ${height - 5} z`}
        fill="transparent"
        stroke={PRIMARY}
        strokeWidth={2}
      />
      <Label label={label} />
    </>
  );
}

function MarkShape({ label }: Readonly<BaseElement>) {
  const { width = 0, height = 0 } = useElementSize() ?? {};
  const hh = height * 0.5;
  return (
    <>
      <path
        d={`M 0 ${hh} ${hh} 0 H ${width - hh} a 3 3 0 0 1 3 ${height} H ${hh} z`}
        fill="transparent"
        stroke={PRIMARY}
        strokeWidth={2}
      />
      <Label label={label} />
    </>
  );
}

function ActorShape({ label }: Readonly<BaseElement>) {
  const { width = 0, height = 0 } = useElementSize() ?? {};
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
        stroke={PRIMARY}
        strokeWidth={2}
      />
      <circle cx={cx} cy={cy} r={r} fill="transparent" stroke={PRIMARY} strokeWidth={2} />
      <Label label={label} />
    </>
  );
}

function Parallelogram({ offset = 0, label }: Readonly<OffsetElement>) {
  const { width = 0, height = 0 } = useElementSize() ?? {};
  return (
    <>
      <path
        d={`M 0 ${height} L ${offset} 0 L ${width} 0 L ${width - offset} ${height} Z`}
        fill="transparent"
        stroke={PRIMARY}
        strokeWidth={2}
      />
      <Label label={label} />
    </>
  );
}

function Hexagon({ offset = 0, label }: Readonly<OffsetElement>) {
  const { width = 0, height = 0 } = useElementSize() ?? {};
  const o = Math.max(0, Math.min(offset, width / 2));
  return (
    <>
      <path
        d={`M 0 ${height / 2} L ${o} ${height} L ${width - o} ${height} L ${width} ${height / 2} L ${width - o} 0 L ${o} 0 Z`}
        fill="transparent"
        stroke={PRIMARY}
        strokeWidth={2}
      />
      <Label label={label} />
    </>
  );
}

function StepShape({ offset = 0, label }: Readonly<OffsetElement>) {
  const { width = 0, height = 0 } = useElementSize() ?? {};
  const o = Math.max(0, Math.min(offset, width));
  return (
    <>
      <path
        d={`M 0 0 L ${o} ${height / 2} L 0 ${height} L ${width - o} ${height} L ${width} ${height / 2} L ${width - o} 0 Z`}
        fill="transparent"
        stroke={PRIMARY}
        strokeWidth={2}
      />
      <Label label={label} />
    </>
  );
}

function TrapezoidShape({ offset = 0, label }: Readonly<OffsetElement>) {
  const { width = 0, height = 0 } = useElementSize() ?? {};
  const o = Math.max(0, Math.min(offset, width / 2));
  return (
    <>
      <path
        d={`M 0 ${height} L ${width} ${height} L ${width - o} 0 L ${o} 0 Z`}
        fill="transparent"
        stroke={PRIMARY}
        strokeWidth={2}
      />
      <Label label={label} />
    </>
  );
}

function DocumentShape({ offset = 0, label }: Readonly<OffsetElement>) {
  const { width = 0, height = 0 } = useElementSize() ?? {};
  const o = Math.max(0, Math.min(offset, height / 2));
  return (
    <>
      <path
        d={`M 0 0 L 0 ${height - o} C ${0.16 * width} ${height} ${0.33 * width} ${height} ${0.5 * width} ${height - o} S ${0.75 * width} ${height - 2 * o} ${width} ${height - o} L ${width} 0 Z`}
        fill="transparent"
        stroke={PRIMARY}
        strokeWidth={2}
      />
      <Label label={label} />
    </>
  );
}

function ShipmentShape({ label }: Readonly<BaseElement>) {
  const { width = 0, height = 0 } = useElementSize() ?? {};
  const scale = Math.min(width / 256, height / 256);
  const tx = (width - 256 * scale) / 2;
  const ty = (height - 256 * scale) / 2;
  return (
    <>
      <rect width={width} height={height} fill="transparent" />
      <g transform={`translate(${tx},${ty}) scale(${scale})`}>
        <path
          d="M248,119.9v-.2a1.7,1.7,0,0,0-.1-.7v-.3c0-.2-.1-.4-.1-.6v-.2l-.2-.8h-.1l-14-34.8A15.7,15.7,0,0,0,218.6,72H184V64a8,8,0,0,0-8-8H24A16,16,0,0,0,8,72V184a16,16,0,0,0,16,16H37a32,32,0,0,0,62,0h58a32,32,0,0,0,62,0h13a16,16,0,0,0,16-16V120ZM184,88h34.6l9.6,24H184ZM24,72H168v64H24ZM68,208a16,16,0,1,1,16-16A16,16,0,0,1,68,208Zm120,0a16,16,0,1,1,16-16A16,16,0,0,1,188,208Z"
          fill={PRIMARY}
        />
      </g>
      <Label label={label} />
    </>
  );
}

function PlusShape({ offset = 0, label }: Readonly<OffsetElement>) {
  const { width = 0, height = 0 } = useElementSize() ?? {};
  const o = Math.max(0, Math.min(offset, width / 2));
  return (
    <>
      <path
        d={`M ${o} 0 L ${width - o} 0 v ${o} h ${o} V ${height - o} h ${-o} v ${o} H ${o} v ${-o} h ${-o} V ${o} H ${o} z`}
        fill="transparent"
        stroke={PRIMARY}
        strokeWidth={2}
      />
      <Label label={label} />
    </>
  );
}

function Arrow({ label, arrowHeight = 0, thickness = 0 }: Readonly<ArrowElement>) {
  const { width = 0, height = 0 } = useElementSize() ?? {};
  return (
    <>
      <path
        d={`M ${width - arrowHeight} 0 L ${width} ${height / 2} L ${width - arrowHeight} ${height} v -${height / 2 - thickness / 2} H 0 v -${thickness} H ${width - arrowHeight} z`}
        fill="transparent"
        stroke={PRIMARY}
        strokeWidth={2}
      />
      <Label label={label} />
    </>
  );
}

function NoteShape({ offset = 0, label }: Readonly<OffsetElement>) {
  const { width = 0, height = 0 } = useElementSize() ?? {};
  const o = Math.max(0, Math.min(offset, width));
  return (
    <>
      <path
        d={`M ${o} 0 H ${width} V ${height} H 0 V ${o} Z`}
        fill="transparent"
        stroke={PRIMARY}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <path
        d={`M 0 ${o} H ${o} V 0`}
        fill="none"
        stroke={PRIMARY}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Label label={label} />
    </>
  );
}

function TableShape({ dividerX = 25, dividerY = 25, label }: Readonly<TableElement>) {
  const { width = 0, height = 0 } = useElementSize() ?? {};
  const dx = Math.max(0, Math.min(dividerX, width));
  const dy = Math.max(0, Math.min(dividerY, height));
  return (
    <>
      <rect
        width={width}
        height={height}
        fill="transparent"
        stroke={PRIMARY}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <path
        d={`M 0 ${dy} H ${width} M ${dx} 0 V ${height}`}
        fill="none"
        stroke={PRIMARY}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Label label={label} />
    </>
  );
}

function CubeShape({ cornerX = 33, cornerY = 40, label }: Readonly<CubeElement>) {
  const { width = 0, height = 0 } = useElementSize() ?? {};
  const cx = Math.max(0, Math.min(cornerX, width));
  const cy = Math.max(0, Math.min(cornerY, height));
  return (
    <>
      {/* Background outline */}
      <path
        d={`M 0 0 H ${width - cx} L ${width} ${cy} V ${height} H ${cx} L 0 ${height - cy} Z`}
        fill="transparent"
        stroke={PRIMARY}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {/* Top face */}
      <path
        d={`M 0 0 H ${width - cx} L ${width} ${cy} H ${cx} Z`}
        fill={LIGHT}
        stroke={PRIMARY}
        strokeWidth={2}
        strokeLinejoin="round"
        fillOpacity={0.2}
      />
      {/* Side face */}
      <path
        d={`M 0 0 L ${cx} ${cy} V ${height} L 0 ${height - cy} Z`}
        fill={LIGHT}
        stroke={PRIMARY}
        strokeWidth={2}
        strokeLinejoin="round"
        fillOpacity={0.1}
      />
      {/* Front face */}
      <rect
        x={cx}
        y={cy}
        width={width - cx}
        height={height - cy}
        fill={LIGHT}
        stroke={PRIMARY}
        strokeWidth={2}
        strokeLinejoin="round"
        fillOpacity={0.3}
      />
      <Label label={label} />
    </>
  );
}

function CardShape({ offset = 0, label }: Readonly<OffsetElement>) {
  const { width = 0, height = 0 } = useElementSize() ?? {};
  const o = Math.max(0, Math.min(offset, width));
  return (
    <>
      <path
        d={`M ${o} 0 H ${width} A ${height / 2},${o} 90 0 0 ${width},${height} H ${o} A ${height / 2},${o} 90 0 1 ${o},0 Z`}
        fill="transparent"
        stroke={PRIMARY}
        strokeWidth={2}
      />
      <Label label={label} />
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
function renderElement(data: ControlledElement | undefined) {
  if (!data) return null;
  switch (data.type) {
    case 'linkedProcess': {
      return <LinkedProcess {...data} />;
    }
    case 'input': {
      return <InputShape {...data} />;
    }
    case 'mark': {
      return <MarkShape {...data} />;
    }
    case 'actor': {
      return <ActorShape {...data} />;
    }
    case 'parallelogram': {
      return <Parallelogram {...data} />;
    }
    case 'hexagon': {
      return <Hexagon {...data} />;
    }
    case 'step': {
      return <StepShape {...data} />;
    }
    case 'trapezoid': {
      return <TrapezoidShape {...data} />;
    }
    case 'document': {
      return <DocumentShape {...data} />;
    }
    case 'shipment': {
      return <ShipmentShape {...data} />;
    }
    case 'plus': {
      return <PlusShape {...data} />;
    }
    case 'arrow': {
      return <Arrow {...data} />;
    }
    case 'note': {
      return <NoteShape {...data} />;
    }
    case 'table': {
      return <TableShape {...data} />;
    }
    case 'cube': {
      return <CubeShape {...data} />;
    }
    case 'card': {
      return <CardShape {...data} />;
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

function addElementControls(paper: dia.Paper) {
  const graph = paper.model;
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
  const paperId = useId();

  const handleElementsMeasured = useCallback(
    ({ isInitial, paper }: { isInitial: boolean; paper: dia.Paper }) => {
      if (!isInitial) return;
      addElementControls(paper);
    },
    []
  );

  useNodesMeasuredEffect(paperId, handleElementsMeasured);

  return (
    <Paper
      id={paperId}
      width="100%"
      height={600}
      className={PAPER_CLASSNAME}
      renderElement={renderElement}
      style={PAPER_STYLE}
      drawGrid={false}
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
