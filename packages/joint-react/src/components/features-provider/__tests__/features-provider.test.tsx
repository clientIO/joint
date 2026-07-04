/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { render, waitFor } from '@testing-library/react';
import { FeaturesProvider } from '../features-provider';
import { GraphProvider } from '../../graph/graph-provider';
import type { CellRecord } from '../../../types/cell.types';

interface DummyFeatureInstance {
  readonly tag: string;
}

const EMPTY_CELLS: readonly CellRecord[] = [];

const onAddFeature2 = () => ({
  id: 'graph-feat-2',
  instance: { tag: 'with-ref' } as DummyFeatureInstance,
});

const onAddFeature3 = () => ({
  id: 'graph-feat-3',
  instance: { tag: 'load-test' } as DummyFeatureInstance,
});

const onAddFeature4 = () => ({
  id: 'graph-feat-4',
  instance: { tag: 'update-test' } as DummyFeatureInstance,
});

interface UpdateAppProps {
  readonly value: number;
  readonly onUpdate: jest.Mock;
}

function UpdateApp({ value, onUpdate }: Readonly<UpdateAppProps>) {
  return (
    <GraphProvider initialCells={EMPTY_CELLS}>
      <FeaturesProvider
        target="graph"
        id="graph-feat-4"
        onAddFeature={onAddFeature4}
        onUpdateFeature={onUpdate}
        value={value}
      >
        <span>child</span>
      </FeaturesProvider>
    </GraphProvider>
  );
}

describe('FeaturesProvider', () => {
  it('registers a graph-scoped feature and renders its children', async () => {
    const onAdd = jest.fn(() => ({
      id: 'graph-feat-1',
      instance: { tag: 'graph' } as DummyFeatureInstance,
    }));
    const { getByTestId } = render(
      <GraphProvider initialCells={EMPTY_CELLS}>
        <FeaturesProvider target="graph" id="graph-feat-1" onAddFeature={onAdd}>
          <div data-testid="child">child</div>
        </FeaturesProvider>
      </GraphProvider>
    );
    expect(getByTestId('child').textContent).toBe('child');
    await waitFor(() => {
      expect(onAdd).toHaveBeenCalled();
    });
  });

  it('forwards the feature instance through forwardedRef', async () => {
    const refHolder: { current: DummyFeatureInstance | null } = { current: null };
    render(
      <GraphProvider initialCells={EMPTY_CELLS}>
        <FeaturesProvider
          target="graph"
          id="graph-feat-2"
          onAddFeature={onAddFeature2}
          forwardedRef={refHolder}
        >
          <span>child</span>
        </FeaturesProvider>
      </GraphProvider>
    );
    await waitFor(() => {
      expect(refHolder.current?.tag).toBe('with-ref');
    });
  });

  it('fires onLoad when the feature instance becomes available', async () => {
    const onLoad = jest.fn();
    render(
      <GraphProvider initialCells={EMPTY_CELLS}>
        <FeaturesProvider
          target="graph"
          id="graph-feat-3"
          onAddFeature={onAddFeature3}
          onLoad={onLoad}
        >
          <span>child</span>
        </FeaturesProvider>
      </GraphProvider>
    );
    await waitFor(() => {
      expect(onLoad).toHaveBeenCalled();
    });
  });

  it('passes through additional props to pickValues for onUpdateFeature', async () => {
    const onUpdate = jest.fn();
    const { rerender } = render(<UpdateApp value={1} onUpdate={onUpdate} />);
    rerender(<UpdateApp value={2} onUpdate={onUpdate} />);
    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalled();
    });
  });
});
