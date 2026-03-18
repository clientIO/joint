/* eslint-disable react-hooks/exhaustive-deps */
import { useContext, useLayoutEffect, useRef } from 'react';
import { setForwardRef, useGraphStore, useInternalData, usePaperStore } from '.';
import type { GraphStore } from '../store/graph-store';
import type { PaperStore } from '../store/paper-store';
import { PaperFeaturesContext } from '../context';
const EMPTY_DEPENDENCIES: unknown[] = [];

export interface OnAddFeatureOptions {
  readonly graphStore: GraphStore;
  readonly paperStore: PaperStore;
  readonly asChildren: boolean;
}
export interface OnUpdateFeatureOptions<T> {
  readonly graphStore: GraphStore;
  readonly paperStore: PaperStore;
  readonly instance: T;
  readonly asChildren: boolean;
}
export interface OnLoadFeatureOptions<T> {
  readonly graphStore: GraphStore;
  readonly paperStore: PaperStore;
  readonly instance: T;
  readonly asChildren: boolean;
}

export interface Feature<T = unknown> {
  readonly id: string;
  readonly instance: T;
  readonly clean?: () => void;
}
export type OnAddFeature<T> = (options: OnAddFeatureOptions) => Feature<T>;
export type OnUpdateFeature<T> = (options: OnUpdateFeatureOptions<T>) => void;
export type OnLoadFeature<T> = (options: OnLoadFeatureOptions<T>) => void;

export interface AddFeatureOptions<T> {
  onAddFeature: OnAddFeature<T>;
  onLoad?: OnLoadFeature<T>;
  onUpdateFeature?: OnUpdateFeature<T>;
  id: string;
  forwardedRef?: React.Ref<unknown>;
}

/**
 * Creates and manages a paper feature lifecycle.
 * @param options - Feature configuration including callbacks and id.
 * @param dependencies - Optional dependency array to trigger feature updates.
 * @returns The paper features context.
 */
export function useCreatePaperFeature<T>(
  options: AddFeatureOptions<T>,
  dependencies: unknown[] = EMPTY_DEPENDENCIES
): PaperFeaturesContext {
  const { onAddFeature, onUpdateFeature, onLoad, id, forwardedRef } = options;
  const graphStore = useGraphStore();
  const paperStore = usePaperStore({ optional: true });
  const featuresRef = useRef<PaperFeaturesContext>({
    features: new Map(),
  });

  const resolvedFeature = useInternalData(() => {
    // this is reactive in react, so we get a feature correctly,
    if (!paperStore) return null;
    return paperStore.features[id]?.instance ?? null;
  });
  const featureContext = useContext(PaperFeaturesContext) ?? featuresRef.current;
  const { features } = featureContext;

  if (!features.has(id) && !paperStore) {
    features.set(id, onAddFeature);
  }
  const asChildren = !!paperStore;
  useLayoutEffect(() => {
    if (!paperStore) return;
    const { paperId } = paperStore;
    const feature = onAddFeature({ graphStore, paperStore, asChildren });
    graphStore.setPaperFeature(paperId, feature);
    setForwardRef(forwardedRef, feature.instance);
    return () => {
      graphStore.removePaperFeature(paperId, feature.id);
    };
  }, [graphStore, paperStore]);

  useLayoutEffect(() => {
    if (!onLoad) return;
    if (!paperStore) return;
    if (!resolvedFeature) return;
    onLoad({ graphStore, paperStore, instance: resolvedFeature as T, asChildren });
  }, [resolvedFeature]);

  useLayoutEffect(() => {
    if (!onUpdateFeature) return;
    if (!paperStore) return;
    const existingFeature = paperStore.features[id];
    onUpdateFeature({
      graphStore,
      paperStore,
      instance: existingFeature?.instance as T,
      asChildren,
    });

    if (!existingFeature) {
      return;
    }
    graphStore.setPaperFeature(paperStore.paperId, existingFeature);
  }, [graphStore, resolvedFeature, paperStore, ...dependencies]);

  return featureContext;
}
