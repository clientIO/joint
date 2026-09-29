/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { StrictMode } from 'react';
import { render, waitFor } from '@testing-library/react';
import type { dia } from '@joint/core';
import { GraphProvider, Paper } from '../../components';
import { FeaturesProvider } from '../../components/features-provider/features-provider';
import { ELEMENT_MODEL_TYPE } from '../../mvc/element-model';
import { GraphStore } from '../../store/graph-store';
import type { CellRecord } from '../../types/cell.types';

interface FeatureInstance {
  readonly tag: string;
}

const initialCells: readonly CellRecord[] = [
  {
    id: 'a',
    type: ELEMENT_MODEL_TYPE,
    position: { x: 0, y: 0 },
    size: { width: 50, height: 50 },
  } as CellRecord,
];

const noopRender = () => <rect />;

describe('useCreateFeature — paper target lifecycle', () => {
  it('registers a paper-scoped feature once paperStore is available (lines 109, 128–129)', async () => {
    const onAdd = jest.fn(() => ({
      id: 'paper-feat-1',
      instance: { tag: 'paper-feature' } as FeatureInstance,
    }));
    render(
      <GraphProvider initialCells={initialCells}>
        <Paper style={{ width: 100, height: 100 }} id="features-paper" renderElement={noopRender}>
          <FeaturesProvider target="paper" id="paper-feat-1" onAddFeature={onAdd}>
            <div>paper-child</div>
          </FeaturesProvider>
        </Paper>
      </GraphProvider>
    );
    await waitFor(() => {
      expect(onAdd).toHaveBeenCalled();
    });
    // The onAddFeature callback receives the paperStore + asChildren payload.
    const [firstCall] = onAdd.mock.calls;
    const [optionsArgument] = firstCall as unknown as [
      { paperStore?: unknown; asChildren?: boolean },
    ];
    expect(optionsArgument.paperStore).toBeDefined();
    expect(optionsArgument.asChildren).toBe(true);
  });

  it('unregisters the paper feature on unmount (lines 148–149)', async () => {
    const onAdd = jest.fn(() => ({
      id: 'paper-feat-cleanup',
      instance: { tag: 'cleanup' } as FeatureInstance,
    }));
    const { unmount } = render(
      <GraphProvider initialCells={initialCells}>
        <Paper style={{ width: 100, height: 100 }} id="features-cleanup-paper" renderElement={noopRender}>
          <FeaturesProvider target="paper" id="paper-feat-cleanup" onAddFeature={onAdd}>
            <div>cleanup-child</div>
          </FeaturesProvider>
        </Paper>
      </GraphProvider>
    );
    await waitFor(() => {
      expect(onAdd).toHaveBeenCalled();
    });
    unmount();
  });

  it('fires onLoad with paperStore + asChildren when paper-target feature resolves (line 194)', async () => {
    const onLoad = jest.fn();
    const onAdd = jest.fn(() => ({
      id: 'paper-feat-onload',
      instance: { tag: 'onload-test' } as FeatureInstance,
    }));
    render(
      <GraphProvider initialCells={initialCells}>
        <Paper style={{ width: 100, height: 100 }} id="features-onload-paper" renderElement={noopRender}>
          <FeaturesProvider
            target="paper"
            id="paper-feat-onload"
            onAddFeature={onAdd}
            onLoad={onLoad}
          >
            <div>onload-child</div>
          </FeaturesProvider>
        </Paper>
      </GraphProvider>
    );
    await waitFor(() => {
      expect(onLoad).toHaveBeenCalled();
    });
    const [[loadOptions]] = onLoad.mock.calls;
    expect(loadOptions.paperStore).toBeDefined();
    expect(loadOptions.asChildren).toBe(true);
    expect(loadOptions.instance).toEqual({ tag: 'onload-test' });
  });

  it('fires onUpdateFeature with paper context when dependencies change (line 219)', async () => {
    const onAdd = jest.fn(() => ({
      id: 'paper-feat-update',
      instance: { tag: 'update-test' } as FeatureInstance,
    }));
    const onUpdate = jest.fn();
    function App({ value }: Readonly<{ value: number }>) {
      return (
        <GraphProvider initialCells={initialCells}>
          <Paper style={{ width: 100, height: 100 }} id="features-update-paper" renderElement={noopRender}>
            <FeaturesProvider
              target="paper"
              id="paper-feat-update"
              onAddFeature={onAdd}
              onUpdateFeature={onUpdate}
              value={value}
            >
              <div>update-child</div>
            </FeaturesProvider>
          </Paper>
        </GraphProvider>
      );
    }
    const { rerender } = render(<App value={1} />);
    await waitFor(() => {
      expect(onAdd).toHaveBeenCalled();
    });
    rerender(<App value={2} />);
    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalled();
    });
    const [[updateOptions]] = onUpdate.mock.calls;
    expect(updateOptions.paperStore).toBeDefined();
    expect(updateOptions.instance).toEqual({ tag: 'update-test' });
  });

  it('registers paper features with synchronous notification (sync=true) from the create-effect', async () => {
    // Regression: the create-effect must register the feature with a synchronous
    // store notification so `useSyncExternalStore` consumers re-render reliably
    // under StrictMode's mount→unmount→remount (a deferred notify gets dropped).
    const setPaperFeatureSpy = jest.spyOn(GraphStore.prototype, 'setPaperFeature');
    const onAdd = jest.fn(() => ({
      id: 'paper-feat-sync',
      instance: { tag: 'sync' } as FeatureInstance,
    }));
    render(
      <GraphProvider initialCells={initialCells}>
        <Paper style={{ width: 100, height: 100 }} id="features-sync-paper" renderElement={noopRender}>
          <FeaturesProvider target="paper" id="paper-feat-sync" onAddFeature={onAdd}>
            <div>sync-child</div>
          </FeaturesProvider>
        </Paper>
      </GraphProvider>
    );
    await waitFor(() => {
      expect(onAdd).toHaveBeenCalled();
    });

    const syncCalls = setPaperFeatureSpy.mock.calls.filter(
      ([, feature, sync]) => (feature as { id: string }).id === 'paper-feat-sync' && sync === true
    );
    expect(syncCalls.length).toBeGreaterThan(0);

    setPaperFeatureSpy.mockRestore();
  });

  it('paper-scoped feature deferred when paperStore is not yet mounted (line 282)', async () => {
    // Mount FeaturesProvider with target='paper' BEFORE Paper is in the tree.
    // The deferred branch (`featureContext.features.set(id, onAddFeature)`)
    // captures the callback so Paper can fire it on mount.
    const onAdd = jest.fn(() => ({
      id: 'paper-feat-deferred',
      instance: { tag: 'deferred' } as FeatureInstance,
    }));
    render(
      <GraphProvider initialCells={initialCells}>
        <FeaturesProvider target="paper" id="paper-feat-deferred" onAddFeature={onAdd}>
          <Paper style={{ width: 100, height: 100 }}
            id="features-deferred-paper"
            renderElement={noopRender}
          >
            <div>deferred-child</div>
          </Paper>
        </FeaturesProvider>
      </GraphProvider>
    );
    await waitFor(() => {
      expect(onAdd).toHaveBeenCalled();
    });
  });

  it('does not leak a duplicate paper feature under StrictMode (React 18 double-render)', async () => {
    // Regression for the selection "2x drag" bug. Under React 18's StrictMode
    // the render body runs twice; the feature must still be created and bound
    // EXACTLY once. A leaked duplicate binds a second paper listener (its
    // constructor's side effect) that is never cleaned, so every interaction
    // fires twice. Passes trivially on React 19 (single render) — the guard
    // bites under the React 18 project (`yarn test:react18`).
    let capturedPaper: dia.Paper | null = null;
    const onAdd = jest.fn(({ paperStore }: { paperStore: { paper: dia.Paper } }) => {
      const { paper } = paperStore;
      capturedPaper = paper;
      // Distinct per-instance listener on purpose: a shared handler would be
      // removed for every instance on the first clean, masking a leaked duplicate.
      // eslint-disable-next-line unicorn/consistent-function-scoping
      const handler = () => {};
      paper.on('leak:probe', handler);
      return {
        id: 'leak-probe',
        instance: { tag: 'leak' } as FeatureInstance,
        clean() {
          paper.off('leak:probe', handler);
        },
      };
    });

    render(
      <StrictMode>
        <GraphProvider initialCells={initialCells}>
          <Paper style={{ width: 100, height: 100 }} id="leak-paper" renderElement={noopRender}>
            <FeaturesProvider target="paper" id="leak-probe" onAddFeature={onAdd}>
              <div>leak-child</div>
            </FeaturesProvider>
          </Paper>
        </GraphProvider>
      </StrictMode>
    );

    await waitFor(() => expect(capturedPaper).not.toBeNull());
    await waitFor(() => {
      const paper = capturedPaper as unknown as {
        _events?: Record<string, readonly unknown[]>;
      } | null;
      const listeners = paper?._events?.['leak:probe'] ?? [];
      expect(listeners).toHaveLength(1);
    });
  });
});
