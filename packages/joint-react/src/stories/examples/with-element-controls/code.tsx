import type { PaperStore} from '@joint/react';
import { GraphProvider, Paper, useGraph, type GraphElement } from '@joint/react';
import '../index.css';
import { PAPER_CLASSNAME, PRIMARY, TEXT } from 'storybook-config/theme';
import { useEffect, useMemo, useState } from 'react';
import { dia } from '@joint/core';
import { elementTools, g } from '@joint/core';

const initialElements = [
  {
    id: '1',
    label: 'Node 1',
    x: 100,
    y: 50,
    width: 80,
    height: 60,
    offset: 10,
  }
] satisfies GraphElement[];

type BaseElementWithData = (typeof initialElements)[number];

// ----------------------------------------------------------------------------
// Shapes
// ----------------------------------------------------------------------------
function Parallelogram({ width, height, offset }: Readonly<BaseElementWithData>) {
  const svgPath = useMemo(() => {
    return `
      M 0 ${height}
      L ${offset} 0
      L ${width} 0
      L ${width - offset} ${height}
      Z
    `;
  }, [width, height, offset]);

  return (
    <g>
      <path
        d={svgPath}
        fill={PRIMARY}
        stroke={PRIMARY}
      />
      <text
        textAnchor="middle"
        dominantBaseline="hanging"
        fontFamily="sans-serif"
        fontSize="13"
        fill={TEXT}
        y={height + 10}
        x={width / 2}
      >
        Parallelogram
      </text>
    </g>
  );
}

// ----------------------------------------------------------------------------
// Controls
// ----------------------------------------------------------------------------
export class ParallelogramOffsetControl extends elementTools.Control {
  get element() {
    return this.relatedView.model;
  }

  protected getPosition(view: dia.ElementView) {
    const { model } = view;
    const { width, height } = model.size();
    const controlLevel = height * 1 / 3;
    const offsetSide = new g.Line(new g.Point(this.element.prop('data/offset'), 0), new g.Point(0, height));
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
    this.element.prop('data/offset', offset);
  }
}

// ----------------------------------------------------------------------------
// Application Components
// ----------------------------------------------------------------------------
function Main() {
  const [paperStore, setPaperStore] = useState<PaperStore | null>(null);
  const graph = useGraph();

  useEffect(() => {
    if (paperStore) {
      const { paper } = paperStore;
      for (const element of graph.getElements()) {
        const toolsView = new dia.ToolsView({
          tools: [new ParallelogramOffsetControl()],
        });
        element.findView(paper).addTools(toolsView);
      }
    }

    return () => {
      paperStore?.paper.removeTools();
    };
  }, [paperStore, graph]);

  return (
    <Paper
      ref={setPaperStore}
      width="100%"
      className={PAPER_CLASSNAME}
      renderElement={Parallelogram}
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
