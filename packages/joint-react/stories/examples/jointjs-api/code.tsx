import { useCallback, useEffect, useMemo, type CSSProperties } from 'react';
import { dia, linkTools, mvc, shapes } from '@joint/core';
import {
  GraphProvider,
  HTMLHost,
  Paper,
  ElementModel,
  LinkModel,
  useCellId,
  useGraph,
  usePaper,
} from '@joint/react';

const PRIMARY = '#ED2637';
const LINK_COLOR = '#8697A6';
// The color cycle is the point of the demo — these stay vivid on purpose.
const COLORS = [PRIMARY, '#FF9505', '#3498db', '#2ecc71', '#9b59b6', '#1abc9c'];

interface ElementData {
  readonly [key: string]: unknown;
  readonly label: string;
  readonly color: string;
}

function createGraph(): dia.Graph {
  const graph = new dia.Graph({}, { cellNamespace: { ...shapes, ElementModel, LinkModel } });

  const elementA = new ElementModel({
    id: 'el1',
    position: { x: 50, y: 50 },
    data: { label: 'Element A', color: PRIMARY },
  });

  const elementB = new ElementModel({
    id: 'el2',
    position: { x: 350, y: 200 },
    data: { label: 'Element B', color: '#3498db' },
  });

  const link = new shapes.standard.Link({
    id: 'link1',
    source: { id: 'el1' },
    target: { id: 'el2' },
    attrs: { line: { stroke: LINK_COLOR, strokeWidth: 2 } },
  });

  graph.resetCells([elementA, elementB, link]);

  return graph;
}

function Node({ label, color }: Readonly<ElementData>) {
  const id = useCellId();
  const { graph } = useGraph();

  const cycleColor = useCallback(() => {
    const element = graph.getCell(id);
    if (!element) return;
    const currentIndex = COLORS.indexOf(element.prop('data/color') as string);
    element.prop('data/color', COLORS[(currentIndex + 1) % COLORS.length]);
  }, [graph, id]);

  const style = useMemo<CSSProperties>(
    () => ({
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      padding: '12px 16px',
      borderRadius: 10,
      background: color ?? PRIMARY,
      color: '#fff',
      fontWeight: 600,
    }),
    [color]
  );

  return (
    <HTMLHost style={style}>
      <span>{label}</span>
      <button type="button" className="jj-btn jj-btn--sm" onClick={cycleColor}>
        Change color
      </button>
    </HTMLHost>
  );
}

function Main() {
  const { paper } = usePaper('my-paper');

  useEffect(() => {
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

    return () => {
      listener.stopListening();
    };
  }, [paper]);

  const renderElement = useCallback(
    (data: ElementData) => <Node label={data.label} color={data.color} />,
    []
  );

  return <Paper id="my-paper" className="size-full" renderElement={renderElement} />;
}

export default function App() {
  const graph = useMemo(() => createGraph(), []);

  return (
    <GraphProvider graph={graph}>
      <Main />
    </GraphProvider>
  );
}
