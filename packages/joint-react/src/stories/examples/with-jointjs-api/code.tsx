/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { dia, linkTools, mvc, shapes } from '@joint/core';
import {
  GraphProvider,
  Paper,
  ReactElement,
  useGraph,
  useNodeSize,
  useCellId,
  type GraphElement,
  type PaperStore,
} from '@joint/react';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';

import '../index.css';

const COLORS = ['#ED2637', '#FF9505', '#3498db', '#2ecc71', '#9b59b6', '#1abc9c'];

interface ElementData extends GraphElement {
  readonly label: string;
  readonly color: string;
}

function createGraph(): dia.Graph {
  const graph = new dia.Graph({}, { cellNamespace: { ...shapes, ReactElement } });

  const element1 = new ReactElement({
    id: 'el1',
    position: { x: 50, y: 50 },
    size: { width: 180, height: 70 },
    data: { label: 'Element A', color: PRIMARY },
  });

  const element2 = new ReactElement({
    id: 'el2',
    position: { x: 350, y: 200 },
    size: { width: 180, height: 70 },
    data: { label: 'Element B', color: '#3498db' },
  });

  const link = new shapes.standard.Link({
    id: 'link1',
    source: { id: 'el1' },
    target: { id: 'el2' },
    attrs: {
      line: {
        stroke: '#DDE6ED',
        strokeWidth: 2,
      },
    },
  });

  graph.resetCells([element1, element2, link]);

  return graph;
}

function Node({ label, color }: Readonly<Partial<ElementData>>) {
  const ref = useRef<HTMLDivElement>(null);
  const { width, height } = useNodeSize(ref);
  const id = useCellId();
  const graph = useGraph();

  const handleClick = () => {
    const element = graph.getCell(id);
    if (!element) return;
    const currentColor = element.prop('data/color') as string;
    const currentIndex = COLORS.indexOf(currentColor);
    const nextColor = COLORS[(currentIndex + 1) % COLORS.length];
    element.prop('data/color', nextColor);
  };

  return (
    <foreignObject width={width} height={height}>
      <div
        ref={ref}
        style={{
          width: 180,
          height: 70,
          backgroundColor: color ?? PRIMARY,
          borderRadius: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          color: '#fff',
          fontFamily: 'sans-serif',
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600 }}>{label}</span>
        <button
          onClick={handleClick}
          style={{
            padding: '4px 12px',
            fontSize: 12,
            cursor: 'pointer',
            borderRadius: 4,
            border: '1px solid rgba(255,255,255,0.5)',
            backgroundColor: 'rgba(255,255,255,0.2)',
            color: '#fff',
          }}
        >
          Change Color
        </button>
      </div>
    </foreignObject>
  );
}

function Main() {
  const listenerRef = useRef<mvc.Listener<[]> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => listenerRef.current?.stopListening();
  }, []);

  // Callback ref: called by React when useImperativeHandle sets the PaperStore
  const paperRef = useCallback((store: PaperStore | null) => {
    // Tear down previous listener (if any)
    listenerRef.current?.stopListening();
    listenerRef.current = null;

    const paper = store?.paper;
    if (!paper) return;

    const listener = new mvc.Listener<[]>();

    listener.listenTo<dia.Paper.EventMap['link:mouseenter']>(
      paper,
      'link:mouseenter',
      (linkView: dia.LinkView) => {
        linkView.addTools(
          new dia.ToolsView({
            tools: [
              new linkTools.Remove({ distance: 20 }),
              new linkTools.TargetArrowhead(),
              new linkTools.SourceArrowhead(),
            ],
          })
        );
      }
    );

    listener.listenTo<dia.Paper.EventMap['link:mouseleave']>(
      paper,
      'link:mouseleave',
      (linkView: dia.LinkView) => {
        linkView.removeTools();
      }
    );

    listenerRef.current = listener;
  }, []);

  const renderElement = (data: ElementData) => {
    return <Node label={data.label} color={data.color} />;
  };

  return (
    <Paper
      ref={paperRef}
      className={PAPER_CLASSNAME}
      height={380}
      renderElement={renderElement}
    />
  );
}

export default function App() {
  const graph = useMemo(() => createGraph(), []);

  return (
    <GraphProvider graph={graph}>
      <Main />
    </GraphProvider>
  );
}
