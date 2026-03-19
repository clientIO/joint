/* eslint-disable react-hooks/exhaustive-deps */
import { useContext, useLayoutEffect, useRef } from 'react';
import { useGraphStore } from './use-graph-store';
import { useInternalData } from './use-stores';
import { usePaperStore } from './use-paper';
import { setForwardRef } from './use-combined-ref';
import type { GraphStore } from '../store/graph-store';
import type { PaperStore } from '../store/paper-store';
import {
  PaperFeaturesContext,
  GraphFeaturesContext,
} from '../context';
import type { FeaturesContext } from '../context';
import type { Feature } from '../types/feature.types';
import { selectGraphFeaturesVersion } from '../selectors';
import { OPTIONAL } from '../types';

// Re-export so consumers can import from hooks
export type { Feature } from '../types/feature.types';
export type { FeaturesContext, DeferredFeatureCallback } from '../context';

const EMPTY_DEPENDENCIES: unknown[] = [];

/**
 * Discriminator for feature lifecycle — determines where the feature is stored and managed.
 * @internal
 */
export type FeatureTarget = 'paper' | 'graph';

// --- Callback option types based on target ---

interface PaperStoreOptions {
  readonly graphStore: GraphStore;
  readonly paperStore: PaperStore;
  readonly asChildren: boolean;
}

interface GraphStoreOptions {
  readonly graphStore: GraphStore;
}

export type OnAddFeatureOptions<Target extends FeatureTarget = 'paper'> = Target extends 'paper'
  ? PaperStoreOptions
  : GraphStoreOptions;

export type OnUpdateFeatureOptions<
  T,
  Target extends FeatureTarget = 'paper',
> = OnAddFeatureOptions<Target> & { readonly instance: T };

export type OnLoadFeatureOptions<
  T,
  Target extends FeatureTarget = 'paper',
> = OnAddFeatureOptions<Target> & { readonly instance: T };

export type OnAddFeature<T, Target extends FeatureTarget = 'paper'> = (
  options: OnAddFeatureOptions<Target>
) => Feature<T>;

export type OnUpdateFeature<T, Target extends FeatureTarget = 'paper'> = (
  options: OnUpdateFeatureOptions<T, Target>
) => void;

export type OnLoadFeature<T, Target extends FeatureTarget = 'paper'> = (
  options: OnLoadFeatureOptions<T, Target>
) => void;

export interface AddFeatureOptions<T, Target extends FeatureTarget = 'paper'> {
  readonly onAddFeature: OnAddFeature<T, Target>;
  readonly onLoad?: OnLoadFeature<T, Target>;
  readonly onUpdateFeature?: OnUpdateFeature<T, Target>;
  readonly id: string;
  readonly forwardedRef?: React.Ref<unknown>;
}

// --- Internal helpers to avoid type assertions ---

/**
 * Checks if the target is paper and the paper store is available.
 */
function isPaperReady(
  target: FeatureTarget,
  paperStore: PaperStore | null
): paperStore is PaperStore {
  return target === 'paper' && paperStore !== null;
}

/**
 * Creates a feature and registers it with the appropriate store.
 */
function createAndRegisterFeature<T>(
  target: FeatureTarget,
  onAddFeature: OnAddFeature<T, FeatureTarget>,
  graphStore: GraphStore,
  paperStore: PaperStore | null,
  asChildren: boolean
): Feature<T> {
  if (isPaperReady(target, paperStore)) {
    return onAddFeature({ graphStore, paperStore, asChildren });
  }
  return onAddFeature({ graphStore });
}

function registerFeature(
  target: FeatureTarget,
  graphStore: GraphStore,
  paperStore: PaperStore | null,
  feature: Feature
) {
  if (isPaperReady(target, paperStore)) {
    graphStore.setPaperFeature(paperStore.paperId, feature);
    return;
  }
  graphStore.setGraphFeature(feature);
}

function unregisterFeature(
  target: FeatureTarget,
  graphStore: GraphStore,
  paperStore: PaperStore | null,
  featureId: string
) {
  if (isPaperReady(target, paperStore)) {
    graphStore.removePaperFeature(paperStore.paperId, featureId);
    return;
  }
  graphStore.removeGraphFeature(featureId);
}

function resolveExistingFeature(
  target: FeatureTarget,
  graphStore: GraphStore,
  paperStore: PaperStore | null,
  id: string
): Feature | undefined {
  if (target === 'paper' && paperStore) {
    return paperStore.features[id];
  }
  return graphStore.features[id];
}

// Feature instances are stored as `unknown` but callbacks expect `T`.
// This boundary requires a cast — no runtime guard exists for generic type parameters.
function fireOnLoad<T>(
  target: FeatureTarget,
  onLoad: OnLoadFeature<T, FeatureTarget>,
  graphStore: GraphStore,
  paperStore: PaperStore | null,
  instance: unknown,
  asChildren: boolean
) {
  const typedInstance = instance as T;
  if (isPaperReady(target, paperStore)) {
    onLoad({ graphStore, paperStore, instance: typedInstance, asChildren });
    return;
  }
  onLoad({ graphStore, instance: typedInstance });
}

function fireOnUpdate<T>(
  target: FeatureTarget,
  onUpdateFeature: OnUpdateFeature<T, FeatureTarget>,
  graphStore: GraphStore,
  paperStore: PaperStore | null,
  instance: unknown,
  asChildren: boolean
) {
  const typedInstance = instance as T;
  if (isPaperReady(target, paperStore)) {
    onUpdateFeature({ graphStore, paperStore, instance: typedInstance, asChildren });
    return;
  }
  onUpdateFeature({ graphStore, instance: typedInstance });
}

/**
 * Creates and manages a feature lifecycle for either paper or graph scope.
 *
 * Paper features are deferred until a PaperStore is available and stored per-paper.
 * Graph features are created immediately and stored on the GraphStore.
 * @param target - Where the feature lives: 'paper' (per-paper) or 'graph' (global).
 * @param options - Feature configuration including callbacks and id.
 * @param dependencies - Optional dependency array to trigger feature updates.
 * @returns The features context for nesting child features.
 * @internal
 */
export function useCreateFeature<T>(
  target: 'paper',
  options: AddFeatureOptions<T, 'paper'>,
  dependencies?: unknown[]
): FeaturesContext;
export function useCreateFeature<T>(
  target: 'graph',
  options: AddFeatureOptions<T, 'graph'>,
  dependencies?: unknown[]
): FeaturesContext;
export function useCreateFeature<T, Target extends FeatureTarget>(
  target: Target,
  options: AddFeatureOptions<T, Target>,
  dependencies?: unknown[]
): FeaturesContext;
export function useCreateFeature<T>(
  target: FeatureTarget,
  options: AddFeatureOptions<T, FeatureTarget>,
  dependencies: unknown[] = EMPTY_DEPENDENCIES
): FeaturesContext {
  const { onAddFeature, onUpdateFeature, onLoad, id, forwardedRef } = options;
  const isPaperTarget = target === 'paper';
  const graphStore = useGraphStore();
  // Always called — returns null when no PaperStoreContext is above
  const paperStore = usePaperStore(OPTIONAL);
  const featuresRef = useRef<FeaturesContext>({ features: new Map() });

  // Subscribe to paper feature changes (resolves paper feature instances)
  const paperFeatureInstance = useInternalData(() => {
    if (!paperStore) return null;
    return paperStore.features[id]?.instance ?? null;
  });

  // Subscribe to graph feature version (resolves graph feature instances)
  useInternalData(selectGraphFeaturesVersion);

  const resolvedFeature = isPaperTarget
    ? paperFeatureInstance
    : (graphStore.features[id]?.instance ?? null);

  const paperCtx = useContext(PaperFeaturesContext);
  const graphCtx = useContext(GraphFeaturesContext);
  const featureContext = (isPaperTarget ? paperCtx : graphCtx) ?? featuresRef.current;

  // Paper-specific: deferred registration when paper is not yet mounted
  if (isPaperTarget && !featureContext.features.has(id) && !paperStore) {
    featureContext.features.set(id, onAddFeature);
  }

  const asChildren = !!paperStore;

  // Guard: skip onUpdateFeature on initial mount — it must only fire on dependency changes
  const isMountedRef = useRef(false);
  // Holds the created feature to survive strict-mode cleanup/re-mount without re-calling onAddFeature
  const featureRef = useRef<Feature | null>(null);

  // Create and register the feature (fires onAddFeature exactly once)
  useLayoutEffect(() => {
    if (isPaperTarget && !paperStore) return;

    // Re-register cached feature if it was removed by strict-mode cleanup
    if (featureRef.current) {
      registerFeature(target, graphStore, paperStore, featureRef.current);
      setForwardRef(forwardedRef, featureRef.current.instance);
      return () => unregisterFeature(target, graphStore, paperStore, featureRef.current!.id);
    }

    const feature = createAndRegisterFeature(target, onAddFeature, graphStore, paperStore, asChildren);
    featureRef.current = feature;
    registerFeature(target, graphStore, paperStore, feature);
    setForwardRef(forwardedRef, feature.instance);
    return () => {
      isMountedRef.current = false;
      unregisterFeature(target, graphStore, paperStore, feature.id);
    };
  }, [graphStore, paperStore]);

  // Fire onLoad when feature instance becomes available
  useLayoutEffect(() => {
    if (!onLoad) return;
    if (isPaperTarget && !paperStore) return;
    if (!resolvedFeature) return;
    fireOnLoad(target, onLoad, graphStore, paperStore, resolvedFeature, asChildren);
  }, [resolvedFeature]);

  // Fire onUpdateFeature ONLY when dependencies change after mount.
  // Never fires on initial mount — onAddFeature handles creation.
  // resolvedFeature is intentionally NOT in deps to prevent spurious fires
  // when the feature instance first resolves (null → instance).
  useLayoutEffect(() => {
    if (!onUpdateFeature) return;
    if (isPaperTarget && !paperStore) return;
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }
    const existingFeature = resolveExistingFeature(target, graphStore, paperStore, id);
    fireOnUpdate(target, onUpdateFeature, graphStore, paperStore, existingFeature?.instance, asChildren);
    if (existingFeature) {
      registerFeature(target, graphStore, paperStore, existingFeature);
    }
  }, [graphStore, paperStore, ...dependencies]);

  return featureContext;
}
