/* eslint-disable unicorn/prevent-abbreviations */
/* eslint-disable unicorn/consistent-function-scoping */
/* eslint-disable no-shadow */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable sonarjs/no-nested-functions */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { render, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { GraphProvider, Paper } from '../../components';
import { PaperFeaturesProvider, useCreatePaperFeature } from '../use-paper-features';
import type { Feature, OnAddFeature } from '../use-paper-features';
import { usePaperStore } from '../use-paper';

const EMPTY_ELEMENTS = {};
const EMPTY_LINKS = {};

function renderTestElement() {
  return <rect width={10} height={10} />;
}

function createWrapper(paperId = 'test-paper') {
  return ({ children }: { children: ReactNode }) => (
    <GraphProvider elements={EMPTY_ELEMENTS} links={EMPTY_LINKS}>
      <Paper id={paperId} width={100} height={100} renderElement={renderTestElement}>
        {children}
      </Paper>
    </GraphProvider>
  );
}

describe('use-paper-features', () => {
  describe('useCreatePaperFeature', () => {
    it('registers a feature with the paper store', async () => {
      const mockInstance = { doSomething: jest.fn() };
      let capturedFeatures: Record<string, Feature> | null = null;

      function TestComponent() {
        useCreatePaperFeature({
          id: 'test-feature',
          onAddFeature: ({ graphStore: _graphStore, paperStore: _paperStore }) => ({
            id: 'test-feature',
            instance: mockInstance,
          }),
        });

        const paperStore = usePaperStore();
        capturedFeatures = paperStore.features;
        return null;
      }

      const Wrapper = createWrapper();
      render(<TestComponent />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(capturedFeatures).toBeDefined();
        expect(capturedFeatures?.['test-feature']).toBeDefined();
      });

      expect((capturedFeatures?.['test-feature'] as Feature | undefined)?.instance).toBe(
        mockInstance
      );
    });

    it('cleans up feature on unmount', async () => {
      const cleanFn = jest.fn();
      let capturedFeatures: Record<string, Feature> | null = null;

      function TestComponent({ showFeature }: Readonly<{ showFeature: boolean }>) {
        return (
          <>
            {showFeature && <FeatureComponent cleanFn={cleanFn} />}
            <CaptureFeatures onCapture={(f) => (capturedFeatures = f)} />
          </>
        );
      }

      function FeatureComponent({ cleanFn }: Readonly<{ cleanFn: () => void }>) {
        useCreatePaperFeature({
          id: 'removable-feature',
          onAddFeature: () => ({
            id: 'removable-feature',
            instance: { value: 42 },
            clean: cleanFn,
          }),
        });
        return null;
      }

      function CaptureFeatures({ onCapture }: { onCapture: (f: Record<string, Feature>) => void }) {
        const paperStore = usePaperStore();
        onCapture(paperStore.features);
        return null;
      }

      const Wrapper = createWrapper();
      const { rerender } = render(<TestComponent showFeature />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(capturedFeatures?.['removable-feature']).toBeDefined();
      });

      rerender(<TestComponent showFeature={false} />);

      await waitFor(() => {
        expect(cleanFn).toHaveBeenCalled();
      });
    });

    it('calls onLoad when feature instance becomes available', async () => {
      const onLoad = jest.fn();
      const mockInstance = { loaded: true };

      function TestComponent() {
        useCreatePaperFeature({
          id: 'loadable-feature',
          onAddFeature: () => ({
            id: 'loadable-feature',
            instance: mockInstance,
          }),
          onLoad,
        });
        return null;
      }

      const Wrapper = createWrapper();
      render(<TestComponent />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(onLoad).toHaveBeenCalled();
      });

      expect(onLoad).toHaveBeenCalledWith(
        expect.objectContaining({
          graphStore: expect.any(Object),
          paperStore: expect.any(Object),
          instance: mockInstance,
        })
      );
    });

    it('calls onUpdateFeature when dependencies change', async () => {
      const onUpdateFeature = jest.fn();
      const mockInstance = { count: 0 };

      function TestComponent({ dep }: { dep: number }) {
        useCreatePaperFeature(
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

      const Wrapper = createWrapper();
      const { rerender } = render(<TestComponent dep={1} />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(onUpdateFeature).toHaveBeenCalled();
      });

      const callsAfterMount = onUpdateFeature.mock.calls.length;
      rerender(<TestComponent dep={2} />);

      await waitFor(() => {
        expect(onUpdateFeature.mock.calls.length).toBeGreaterThan(callsAfterMount);
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

  describe('PaperFeaturesProvider', () => {
    it('renders children and registers feature', async () => {
      let capturedFeatures: Record<string, Feature> | null = null;
      const mockInstance = { type: 'scroller' };

      const onAddFeature: OnAddFeature<typeof mockInstance> = () => ({
        id: 'scroller',
        instance: mockInstance,
      });

      function CaptureFeatures() {
        const paperStore = usePaperStore();
        capturedFeatures = paperStore.features;
        return null;
      }

      render(
        <GraphProvider elements={EMPTY_ELEMENTS} links={EMPTY_LINKS}>
          <Paper id="feat-paper" width={100} height={100} renderElement={renderTestElement}>
            <PaperFeaturesProvider id="scroller" onAddFeature={onAddFeature}>
              <CaptureFeatures />
            </PaperFeaturesProvider>
          </Paper>
        </GraphProvider>
      );

      await waitFor(() => {
        expect(capturedFeatures?.['scroller']).toBeDefined();
      });

      expect((capturedFeatures?.['scroller'] as Feature | undefined)?.instance).toBe(mockInstance);
    });
  });
});
