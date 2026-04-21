/* eslint-disable sonarjs/no-identical-functions */
/* eslint-disable unicorn/prevent-abbreviations */
 
 
 
/* eslint-disable react-perf/jsx-no-new-function-as-prop */

import { render, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { GraphProvider } from '../../components/graph/graph-provider';
import { Paper } from '../../components/paper';
import { FeaturesProvider } from '../../components/features-provider/features-provider';
import { useCreateFeature } from '../../hooks';
import type { Feature } from '../../types/feature.types';
import type { OnAddFeature } from '../use-create-features';
import { usePaperStore } from '../use-paper';
import { useGraphStore } from '../use-graph-store';
import type { GraphStore } from '../../store/graph-store';

const EMPTY_ELEMENTS = {};
const EMPTY_LINKS = {};

function renderTestElement() {
  return <rect width={10} height={10} />;
}

function createPaperWrapper(paperId = 'test-paper') {
  return ({ children }: { children: ReactNode }) => (
    <GraphProvider initialElements={EMPTY_ELEMENTS} initialLinks={EMPTY_LINKS}>
      <Paper id={paperId} width={100} height={100} renderElement={renderTestElement}>
        {children}
      </Paper>
    </GraphProvider>
  );
}

function createGraphWrapper() {
  return ({ children }: { children: ReactNode }) => (
    <GraphProvider initialElements={EMPTY_ELEMENTS} initialLinks={EMPTY_LINKS}>
      {children}
    </GraphProvider>
  );
}

function getFeatureInstance(features: Record<string, Feature>, id: string): unknown {
  return features[id]?.instance;
}

/**
 * Shared test wrapper that toggles a feature component on/off.
 */
function ToggleFeatureTestComponent({
  showFeature,
  featureSlot,
  captureSlot,
}: Readonly<{
  showFeature: boolean;
  featureSlot: ReactNode;
  captureSlot: ReactNode;
}>) {
  return (
    <>
      {showFeature && featureSlot}
      {captureSlot}
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Paper target
// ────────────────────────────────────────────────────────────────────────────

describe('useCreateFeature (target: paper)', () => {
  it('registers a feature with the paper store', async () => {
    const mockInstance = { doSomething: jest.fn() };
    let capturedFeatures: Record<string, Feature> | null = null;

    function TestComponent() {
      useCreateFeature('paper', {
        id: 'test-feature',
        onAddFeature: () => ({
          id: 'test-feature',
          instance: mockInstance,
        }),
      });

      const paperStore = usePaperStore();
      capturedFeatures = paperStore.features;
      return null;
    }

    const Wrapper = createPaperWrapper();
    render(<TestComponent />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(capturedFeatures).toBeDefined();
      expect(capturedFeatures?.['test-feature']).toBeDefined();
      expect(getFeatureInstance(capturedFeatures!, 'test-feature')).toBe(mockInstance);
    });
  });

  it('cleans up feature on unmount', async () => {
    const cleanFn = jest.fn();
    let capturedFeatures: Record<string, Feature> | null = null;

    function PaperFeatureComponent() {
      useCreateFeature('paper', {
        id: 'removable-feature',
        onAddFeature: () => ({
          id: 'removable-feature',
          instance: { value: 42 },
          clean: cleanFn,
        }),
      });
      return null;
    }

    function CapturePaperFeatures() {
      const paperStore = usePaperStore();
      capturedFeatures = paperStore.features;
      return null;
    }

    const Wrapper = createPaperWrapper();
    const { rerender } = render(
      <ToggleFeatureTestComponent
        showFeature
        featureSlot={<PaperFeatureComponent />}
        captureSlot={<CapturePaperFeatures />}
      />,
      { wrapper: Wrapper }
    );

    await waitFor(() => {
      expect(capturedFeatures?.['removable-feature']).toBeDefined();
    });

    rerender(
      <ToggleFeatureTestComponent
        showFeature={false}
        featureSlot={<PaperFeatureComponent />}
        captureSlot={<CapturePaperFeatures />}
      />
    );

    await waitFor(() => {
      expect(cleanFn).toHaveBeenCalled();
    });
  });

  it('calls onLoad when feature instance becomes available', async () => {
    const onLoad = jest.fn();
    const mockInstance = { loaded: true };

    function TestComponent() {
      useCreateFeature('paper', {
        id: 'loadable-feature',
        onAddFeature: () => ({
          id: 'loadable-feature',
          instance: mockInstance,
        }),
        onLoad,
      });
      return null;
    }

    const Wrapper = createPaperWrapper();
    render(<TestComponent />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(onLoad).toHaveBeenCalledWith(
        expect.objectContaining({
          graphStore: expect.any(Object),
          paperStore: expect.any(Object),
          instance: mockInstance,
        })
      );
    });
  });

  it('calls onUpdateFeature when dependencies change (not on initial mount)', async () => {
    const onUpdateFeature = jest.fn();
    const mockInstance = { count: 0 };

    function TestComponent({ dep }: { dep: number }) {
      useCreateFeature(
        'paper',
        {
          id: 'updatable-feature',
          onAddFeature: () => ({
            id: 'updatable-feature',
            instance: mockInstance,
          }),
          onUpdateFeature,
        },
        [dep]
      );
      return null;
    }

    const Wrapper = createPaperWrapper();
    const { rerender } = render(<TestComponent dep={1} />, { wrapper: Wrapper });

    // onUpdateFeature should NOT be called on initial mount
    await waitFor(() => {
      expect(onUpdateFeature).not.toHaveBeenCalled();
    });

    // Trigger a dependency change
    rerender(<TestComponent dep={2} />);

    await waitFor(() => {
      expect(onUpdateFeature).toHaveBeenCalledTimes(1);
      expect(onUpdateFeature).toHaveBeenLastCalledWith(
        expect.objectContaining({
          graphStore: expect.any(Object),
          paperStore: expect.any(Object),
          instance: expect.any(Object),
        })
      );
    });
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Graph target
// ────────────────────────────────────────────────────────────────────────────

// ────────────────────────────────────────────────────────────────────────────
// onAddFeature call count
// ────────────────────────────────────────────────────────────────────────────

describe('onAddFeature is called exactly once', () => {
  it('paper target: onAddFeature fires once on mount', async () => {
    const onAddFeature = jest.fn(() => ({
      id: 'once-paper',
      instance: { value: 1 },
    }));

    function TestComponent() {
      useCreateFeature('paper', { id: 'once-paper', onAddFeature });
      return null;
    }

    const Wrapper = createPaperWrapper();
    render(<TestComponent />, { wrapper: Wrapper });

    // Wait for feature to be registered
    await waitFor(() => {
      expect(onAddFeature).toHaveBeenCalled();
    });

    expect(onAddFeature).toHaveBeenCalledTimes(1);
  });

  it('graph target: onAddFeature fires once on mount', async () => {
    const onAddFeature = jest.fn(() => ({
      id: 'once-graph',
      instance: { value: 1 },
    }));

    function TestComponent() {
      useCreateFeature('graph', { id: 'once-graph', onAddFeature });
      return null;
    }

    const Wrapper = createGraphWrapper();
    render(<TestComponent />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(onAddFeature).toHaveBeenCalled();
    });

    expect(onAddFeature).toHaveBeenCalledTimes(1);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Graph target
// ────────────────────────────────────────────────────────────────────────────

describe('useCreateFeature (target: graph)', () => {
  it('registers a feature with the graph store', async () => {
    const mockInstance = { doSomething: jest.fn() };
    let capturedFeatures: Record<string, Feature> | null = null;

    function TestComponent() {
      useCreateFeature('graph', {
        id: 'test-feature',
        onAddFeature: () => ({
          id: 'test-feature',
          instance: mockInstance,
        }),
      });

      const graphStore = useGraphStore();
      capturedFeatures = graphStore.features;
      return null;
    }

    const Wrapper = createGraphWrapper();
    render(<TestComponent />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(capturedFeatures).toBeDefined();
      expect(capturedFeatures?.['test-feature']).toBeDefined();
      expect(getFeatureInstance(capturedFeatures!, 'test-feature')).toBe(mockInstance);
    });
  });

  it('cleans up feature on unmount', async () => {
    const cleanFn = jest.fn();
    let capturedFeatures: Record<string, Feature> | null = null;

    function GraphFeatureComponent() {
      useCreateFeature('graph', {
        id: 'removable-feature',
        onAddFeature: () => ({
          id: 'removable-feature',
          instance: { value: 42 },
          clean: cleanFn,
        }),
      });
      return null;
    }

    function CaptureGraphFeatures() {
      const graphStore = useGraphStore();
      capturedFeatures = graphStore.features;
      return null;
    }

    const Wrapper = createGraphWrapper();
    const { rerender } = render(
      <ToggleFeatureTestComponent
        showFeature
        featureSlot={<GraphFeatureComponent />}
        captureSlot={<CaptureGraphFeatures />}
      />,
      { wrapper: Wrapper }
    );

    await waitFor(() => {
      expect(capturedFeatures?.['removable-feature']).toBeDefined();
    });

    rerender(
      <ToggleFeatureTestComponent
        showFeature={false}
        featureSlot={<GraphFeatureComponent />}
        captureSlot={<CaptureGraphFeatures />}
      />
    );

    await waitFor(() => {
      expect(cleanFn).toHaveBeenCalled();
    });
  });

  it('calls onLoad when feature instance becomes available', async () => {
    const onLoad = jest.fn();
    const mockInstance = { loaded: true };

    function TestComponent() {
      useCreateFeature('graph', {
        id: 'loadable-feature',
        onAddFeature: () => ({
          id: 'loadable-feature',
          instance: mockInstance,
        }),
        onLoad,
      });
      return null;
    }

    const Wrapper = createGraphWrapper();
    render(<TestComponent />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(onLoad).toHaveBeenCalledWith(
        expect.objectContaining({
          graphStore: expect.any(Object),
          instance: mockInstance,
        })
      );
    });
  });

  it('calls onUpdateFeature when dependencies change (not on initial mount)', async () => {
    const onUpdateFeature = jest.fn();
    const mockInstance = { count: 0 };

    function TestComponent({ dep }: { dep: number }) {
      useCreateFeature(
        'graph',
        {
          id: 'updatable-feature',
          onAddFeature: () => ({
            id: 'updatable-feature',
            instance: mockInstance,
          }),
          onUpdateFeature,
        },
        [dep]
      );
      return null;
    }

    const Wrapper = createGraphWrapper();
    const { rerender } = render(<TestComponent dep={1} />, { wrapper: Wrapper });

    // onUpdateFeature should NOT be called on initial mount
    await waitFor(() => {
      expect(onUpdateFeature).not.toHaveBeenCalled();
    });

    // Trigger a dependency change
    rerender(<TestComponent dep={2} />);

    await waitFor(() => {
      expect(onUpdateFeature).toHaveBeenCalledTimes(1);
      expect(onUpdateFeature).toHaveBeenLastCalledWith(
        expect.objectContaining({
          graphStore: expect.any(Object),
          instance: expect.any(Object),
        })
      );
    });
  });
});

// ────────────────────────────────────────────────────────────────────────────
// FeaturesProvider
// ────────────────────────────────────────────────────────────────────────────

describe('FeaturesProvider', () => {
  it('renders children and registers paper feature', async () => {
    let capturedFeatures: Record<string, Feature> | null = null;
    const mockInstance = { type: 'scroller' };

    const onAddFeature: OnAddFeature<typeof mockInstance, 'paper'> = () => ({
      id: 'scroller',
      instance: mockInstance,
    });

    function CaptureFeatures() {
      const paperStore = usePaperStore();
      capturedFeatures = paperStore.features;
      return null;
    }

    render(
      <GraphProvider initialElements={EMPTY_ELEMENTS} initialLinks={EMPTY_LINKS}>
        <Paper id="feat-paper" width={100} height={100} renderElement={renderTestElement}>
          <FeaturesProvider target="paper" id="scroller" onAddFeature={onAddFeature}>
            <CaptureFeatures />
          </FeaturesProvider>
        </Paper>
      </GraphProvider>
    );

    await waitFor(() => {
      expect(capturedFeatures?.['scroller']).toBeDefined();
      expect(getFeatureInstance(capturedFeatures!, 'scroller')).toBe(mockInstance);
    });
  });

  it('renders children and registers graph feature', async () => {
    let capturedFeatures: Record<string, Feature> | null = null;
    const mockInstance = { type: 'command-manager' };

    const onAddFeature: OnAddFeature<typeof mockInstance, 'graph'> = () => ({
      id: 'command-manager',
      instance: mockInstance,
    });

    function CaptureFeatures() {
      const graphStore = useGraphStore();
      capturedFeatures = graphStore.features;
      return null;
    }

    render(
      <GraphProvider initialElements={EMPTY_ELEMENTS} initialLinks={EMPTY_LINKS}>
        <FeaturesProvider target="graph" id="command-manager" onAddFeature={onAddFeature}>
          <CaptureFeatures />
        </FeaturesProvider>
      </GraphProvider>
    );

    await waitFor(() => {
      expect(capturedFeatures?.['command-manager']).toBeDefined();
      expect(getFeatureInstance(capturedFeatures!, 'command-manager')).toBe(mockInstance);
    });
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Cleanup on destroy
// ────────────────────────────────────────────────────────────────────────────

describe('GraphStore.destroy', () => {
  it('cleans all graph features on destroy', async () => {
    const cleanFn1 = jest.fn();
    const cleanFn2 = jest.fn();
    let capturedGraphStore: GraphStore | null = null;

    function TestComponent() {
      const graphStore = useGraphStore();
      capturedGraphStore = graphStore;

      useCreateFeature('graph', {
        id: 'feature-1',
        onAddFeature: () => ({
          id: 'feature-1',
          instance: { name: 'first' },
          clean: cleanFn1,
        }),
      });

      useCreateFeature('graph', {
        id: 'feature-2',
        onAddFeature: () => ({
          id: 'feature-2',
          instance: { name: 'second' },
          clean: cleanFn2,
        }),
      });

      return null;
    }

    const Wrapper = createGraphWrapper();
    render(<TestComponent />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(capturedGraphStore).toBeDefined();
      expect(capturedGraphStore?.features['feature-1']).toBeDefined();
      expect(capturedGraphStore?.features['feature-2']).toBeDefined();
    });

    // Store is captured by ref — destroy is safe to call outside waitFor
    capturedGraphStore!.destroy(true);

    expect(cleanFn1).toHaveBeenCalled();
    expect(cleanFn2).toHaveBeenCalled();
    expect(Object.keys(capturedGraphStore!.features)).toHaveLength(0);
  });
});
