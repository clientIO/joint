/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import { render, waitFor } from '@testing-library/react';
import { dia, g } from '@joint/core';
import { GraphProvider } from '../graph-provider';
import { useGraph } from '../../../hooks/use-graph';
import { elementPorts } from '../../../presets/element-ports';
import type { CellRecord } from '../../../types/cell.types';

const initialCells: readonly CellRecord[] = [
  {
    id: 'a',
    type: 'element',
    position: { x: 0, y: 0 },
    size: { width: 100, height: 60 },
    ports: elementPorts({ out: { cx: 100, cy: 30, width: 20, height: 20 } }),
  },
];

function GraphProbe({ onGraph }: Readonly<{ onGraph: (graph: dia.Graph) => void }>) {
  const { graph } = useGraph();
  onGraph(graph);
  return null;
}

const ellipseGeometry: dia.Graph.ElementGeometryCallback = ({ model, port }) => {
  if (port !== null) return null;
  const { width, height } = model.size();
  return g.Ellipse.fromRect(new g.Rect(0, 0, width, height));
};

const polygonGeometry: dia.Graph.ElementGeometryCallback = ({ port }) => {
  if (port !== null) return null;
  return new g.Polygon([new g.Point(0, 0), new g.Point(100, 30), new g.Point(0, 60)]);
};

async function renderGraph(elementGeometry?: dia.Graph.ElementGeometryCallback) {
  let graph: dia.Graph | null = null;
  const onGraph = (currentGraph: dia.Graph) => {
    graph = currentGraph;
  };
  const view = render(
    <GraphProvider initialCells={initialCells} elementGeometry={elementGeometry}>
      <GraphProbe onGraph={onGraph} />
    </GraphProvider>
  );
  await waitFor(() => {
    expect(graph).not.toBeNull();
  });
  const rerender = (nextElementGeometry?: dia.Graph.ElementGeometryCallback) => {
    view.rerender(
      <GraphProvider initialCells={initialCells} elementGeometry={nextElementGeometry}>
        <GraphProbe onGraph={onGraph} />
      </GraphProvider>
    );
  };
  return { getGraph: () => graph as unknown as dia.Graph, rerender };
}

describe('GraphProvider — elementGeometry', () => {
  it('uses the default geometry without the prop', async () => {
    const { getGraph } = await renderGraph();
    const element = getGraph().getCell('a') as dia.Element;
    expect(getGraph().getElementGeometry(element).type).toBe(g.types.Rect);
    expect(getGraph().getPortGeometry(element, 'out').type).toBe(g.types.Ellipse);
  });

  it('uses the geometry returned by the prop and the default for null', async () => {
    const { getGraph } = await renderGraph(ellipseGeometry);
    const element = getGraph().getCell('a') as dia.Element;
    expect(getGraph().getElementGeometry(element).type).toBe(g.types.Ellipse);
    expect(getGraph().getPortGeometry(element, 'out').type).toBe(g.types.Ellipse);
  });

  it('reads the latest prop on the same graph', async () => {
    const { getGraph, rerender } = await renderGraph(ellipseGeometry);
    const graph = getGraph();
    const element = graph.getCell('a') as dia.Element;
    rerender(polygonGeometry);
    expect(getGraph()).toBe(graph);
    expect(graph.getElementGeometry(element).type).toBe(g.types.Polygon);
    rerender();
    expect(graph.getElementGeometry(element).type).toBe(g.types.Rect);
  });

  it('does not set the geometry of a graph passed in', async () => {
    const externalGraph = new dia.Graph({}, { cellNamespace: {} });
    let graph: dia.Graph | null = null;
    render(
      <GraphProvider graph={externalGraph} elementGeometry={ellipseGeometry}>
        <GraphProbe
          onGraph={(currentGraph) => {
            graph = currentGraph;
          }}
        />
      </GraphProvider>
    );
    await waitFor(() => {
      expect(graph).toBe(externalGraph);
    });
    const element = new dia.Element({ id: 'b', type: 'element', size: { width: 100, height: 60 } });
    expect(externalGraph.getElementGeometry(element).type).toBe(g.types.Rect);
  });
});
