import type { OnLoadOptions } from '@joint/react';
import { GraphProvider, Paper, type GraphElement } from '@joint/react';
import '../index.css';
import { PAPER_CLASSNAME, PRIMARY, TEXT } from 'storybook-config/theme';
import { dia } from '@joint/core';
import { elementTools, g } from '@joint/core';

interface BaseElement extends GraphElement {
  type: 'parallelogram' | 'arrow';
  label: string;
  width: number;
  height: number;
}

interface ParallelogramElement extends BaseElement {
  type: 'parallelogram';
  offset: number;
}

interface ArrowElement extends BaseElement {
  type: 'arrow';
  arrowHeight: number;
  thickness: number;
}

type ControlledElement = ParallelogramElement | ArrowElement;

const initialElements: Record<string, ControlledElement> = {
  '1': {
    type: 'parallelogram',
    label: 'Parallelogram',
    x: 300,
    y: 250,
    width: 80,
    height: 60,
    offset: 10,
  },
  '2': {
    type: 'arrow',
    label: 'Arrow',
    x: 500,
    y: 250,
    width: 100,
    height: 60,
    arrowHeight: 30,
    thickness: 20,
  },
};

// ----------------------------------------------------------------------------
// Shapes
// ----------------------------------------------------------------------------
function Parallelogram({ width, height, offset = 0, label }: Readonly<ParallelogramElement>) {
  return (
    <>
      <path
        d={`
          M 0 ${height}
          L ${offset} 0
          L ${width} 0
          L ${width - offset} ${height}
          Z
        `}
        fill={PRIMARY}
        stroke={PRIMARY}
      />
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
    </>
  );
}

function Arrow({ width, height, label, arrowHeight = 0, thickness = 0 }: Readonly<ArrowElement>) {
  return (
    <>
      <path
        d={`
          M ${width - arrowHeight} 0
          L ${width} ${height / 2}
          L ${width - arrowHeight} ${height}
          v -${height / 2 - thickness / 2}
          H 0
          v -${thickness}
          H ${width - arrowHeight}
          z`}
        fill={PRIMARY}
        stroke={PRIMARY}
        strokeWidth="2"
      />
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

// ----------------------------------------------------------------------------
// Helper Functions
// ----------------------------------------------------------------------------
function renderElement(element: ControlledElement) {
  switch (element.type) {
    case 'parallelogram': {
      return <Parallelogram {...element} />;
    }
    case 'arrow': {
      return <Arrow {...element} />;
    }
    default: {
      return null;
    }
  }
}

function addElementControls({ paper, graph }: OnLoadOptions) {
  for (const element of graph.getElements()) {
    const type = element.prop('data/type');
    const tools = [];

    switch (type) {
      case 'parallelogram': {
        tools.push(new ParallelogramOffsetControl());
        break;
      }
      case 'arrow': {
        tools.push(new ArrowOffsetControl());
        break;
      }
    }

    const toolsView = new dia.ToolsView({ tools });
    element.findView(paper).addTools(toolsView);
  }
}

// ----------------------------------------------------------------------------
// Application Components
// ----------------------------------------------------------------------------
function Main() {
  return (
    <Paper
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
