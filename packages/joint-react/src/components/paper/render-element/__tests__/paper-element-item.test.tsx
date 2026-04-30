/* eslint-disable react-perf/jsx-no-new-function-as-prop */
 
import { render, waitFor } from '@testing-library/react';
import { useContext, type ComponentType } from 'react';
import { GraphProvider } from '../../../graph/graph-provider';
import { Paper } from '../../paper';
import { SVGElementItem, HTMLElementItem, ElementHitArea } from '../paper-element-item';
import { CellIdContext, GraphStoreContext, PaperStoreContext } from '../../../../context';
import { ELEMENT_MODEL_TYPE } from '../../../../models/element-model';
import type { CellRecord, CellId } from '../../../../types/cell.types';

const RenderEmpty: ComponentType<Record<string, unknown>> = () => <span data-testid="render-empty" />;

const CELLS: readonly CellRecord[] = [
  {
    id: 'one',
    type: ELEMENT_MODEL_TYPE,
    position: { x: 5, y: 7 },
    size: { width: 30, height: 40 },
    data: { label: 'one' },
  } as CellRecord,
];

/**
 * Captures the live graph + paper store from inside a Paper, so the harness
 * can re-mount SVG / HTML element items with `portalElement={null}` for the
 * defensive guard branches.
 */
function StoreCapture({ onCapture }: { readonly onCapture: (graph: unknown, paper: unknown) => void }) {
  const graphStore = useContext(GraphStoreContext);
  const paperStore = useContext(PaperStoreContext);
  if (graphStore && paperStore) onCapture(graphStore, paperStore);
  return null;
}

describe('paper-element-item exports', () => {
  it('SVGElementItem returns null when portalElement is null', async () => {
    let capturedGraph: unknown = null;
    let capturedPaper: unknown = null;
    const { rerender, container } = render(
      <GraphProvider initialCells={CELLS}>
        <Paper width={100} height={100} renderElement={() => <rect />}>
          <StoreCapture
            onCapture={(graph, paper) => {
              capturedGraph = graph;
              capturedPaper = paper;
            }}
          />
        </Paper>
      </GraphProvider>
    );
    await waitFor(() => {
      expect(capturedGraph).not.toBeNull();
      expect(capturedPaper).not.toBeNull();
    });
    // Now mount SVGElementItem standalone with portalElement={null}
    rerender(
      <GraphStoreContext.Provider
        value={capturedGraph as React.ContextType<typeof GraphStoreContext>}
      >
        <PaperStoreContext.Provider
          value={capturedPaper as React.ContextType<typeof PaperStoreContext>}
        >
          <CellIdContext.Provider value={'one' as CellId}>
            <SVGElementItem
              renderElement={RenderEmpty}
              portalElement={null}
              areElementsMeasured
            />
          </CellIdContext.Provider>
        </PaperStoreContext.Provider>
      </GraphStoreContext.Provider>
    );
    expect(container.querySelector('[data-testid="render-empty"]')).toBeNull();
  });

  it('HTMLElementItem returns null when portalElement is null', async () => {
    let capturedGraph: unknown = null;
    let capturedPaper: unknown = null;
    const { rerender, container } = render(
      <GraphProvider initialCells={CELLS}>
        <Paper width={100} height={100} useHTMLOverlay renderElement={() => <rect />}>
          <StoreCapture
            onCapture={(graph, paper) => {
              capturedGraph = graph;
              capturedPaper = paper;
            }}
          />
        </Paper>
      </GraphProvider>
    );
    await waitFor(() => {
      expect(capturedGraph).not.toBeNull();
    });
    rerender(
      <GraphStoreContext.Provider
        value={capturedGraph as React.ContextType<typeof GraphStoreContext>}
      >
        <PaperStoreContext.Provider
          value={capturedPaper as React.ContextType<typeof PaperStoreContext>}
        >
          <CellIdContext.Provider value={'one' as CellId}>
            <HTMLElementItem
              renderElement={RenderEmpty}
              portalElement={null}
              areElementsMeasured
            />
          </CellIdContext.Provider>
        </PaperStoreContext.Provider>
      </GraphStoreContext.Provider>
    );
    expect(container.querySelector('[data-testid="render-empty"]')).toBeNull();
  });

  it('HTMLElementItem renders a placeholder wrapper when the cell is missing from the store', async () => {
    let capturedGraph: unknown = null;
    let capturedPaper: unknown = null;
    const { rerender, container } = render(
      <GraphProvider initialCells={CELLS}>
        <Paper width={100} height={100} useHTMLOverlay renderElement={() => <rect />}>
          <StoreCapture
            onCapture={(graph, paper) => {
              capturedGraph = graph;
              capturedPaper = paper;
            }}
          />
        </Paper>
      </GraphProvider>
    );
    await waitFor(() => {
      expect(capturedGraph).not.toBeNull();
    });

    const portalTarget = document.createElement('div');
    document.body.append(portalTarget);

    rerender(
      <GraphStoreContext.Provider
        value={capturedGraph as React.ContextType<typeof GraphStoreContext>}
      >
        <PaperStoreContext.Provider
          value={capturedPaper as React.ContextType<typeof PaperStoreContext>}
        >
          <CellIdContext.Provider value={'missing-cell-id' as CellId}>
            <HTMLElementItem
              renderElement={RenderEmpty}
              portalElement={portalTarget}
              areElementsMeasured
            />
          </CellIdContext.Provider>
        </PaperStoreContext.Provider>
      </GraphStoreContext.Provider>
    );

    // Placeholder wrapper should still be created with id and zero geometry.
    const wrapper = portalTarget.querySelector('div[model-id="missing-cell-id"]') as HTMLDivElement | null;
    expect(wrapper).toBeTruthy();
    expect(wrapper?.style.width).toBe('0px');
    expect(wrapper?.style.height).toBe('0px');
    expect(wrapper?.style.transform).toContain('translate(0px, 0px)');
    portalTarget.remove();
    container.remove();
  });

  it('ElementHitArea renders a transparent rectangle sized to the cell', async () => {
    let capturedGraph: unknown = null;
    let capturedPaper: unknown = null;
    const { rerender, container } = render(
      <GraphProvider initialCells={CELLS}>
        <Paper width={100} height={100} renderElement={() => <rect />}>
          <StoreCapture
            onCapture={(graph, paper) => {
              capturedGraph = graph;
              capturedPaper = paper;
            }}
          />
        </Paper>
      </GraphProvider>
    );
    await waitFor(() => {
      expect(capturedGraph).not.toBeNull();
    });

    rerender(
      <svg>
        <GraphStoreContext.Provider
          value={capturedGraph as React.ContextType<typeof GraphStoreContext>}
        >
          <PaperStoreContext.Provider
            value={capturedPaper as React.ContextType<typeof PaperStoreContext>}
          >
            <CellIdContext.Provider value={'one' as CellId}>
              <ElementHitArea />
            </CellIdContext.Provider>
          </PaperStoreContext.Provider>
        </GraphStoreContext.Provider>
      </svg>
    );

    const rect = container.querySelector('rect[fill="transparent"]') as SVGRectElement | null;
    expect(rect).toBeTruthy();
    expect(rect?.getAttribute('width')).toBe('30');
    expect(rect?.getAttribute('height')).toBe('40');
  });
});
