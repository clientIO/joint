 
 
import { render, waitFor } from '@testing-library/react';
import { GraphProvider, Paper } from '../../components';
import { FeaturesProvider } from '../../components/features-provider/features-provider';
import { ELEMENT_MODEL_TYPE } from '../../models/element-model';
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
        <Paper id="features-paper" width={100} height={100} renderElement={noopRender}>
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
        <Paper id="features-cleanup-paper" width={100} height={100} renderElement={noopRender}>
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
        <Paper id="features-onload-paper" width={100} height={100} renderElement={noopRender}>
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
          <Paper id="features-update-paper" width={100} height={100} renderElement={noopRender}>
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
          <Paper
            id="features-deferred-paper"
            width={100}
            height={100}
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
});
