import { createContext } from 'react';
import type { CellId } from '../types/cell-id';
import type { GraphStore, PaperStore } from '../store';
import type { Feature } from '../types/feature.types';

export type { Feature } from '../types/feature.types';

export const GraphStoreContext = createContext<GraphStore<any, any> | null>(null);
export const PaperStoreContext = createContext<PaperStore | null>(null);

export const CellIdContext = createContext<CellId | undefined>(undefined);

/**
 * Callback stored in the features context for deferred feature creation.
 * @internal
 */
export type DeferredFeatureCallback = (
  options:
    | {
        readonly graphStore: GraphStore;
        readonly paperStore: PaperStore;
        readonly asChildren: boolean;
      }
    | { readonly graphStore: GraphStore }
) => Feature;

/**
 * Context returned by useCreateFeature and provided by FeaturesProvider.
 * Stores deferred feature registrations before their target store is available.
 * @internal
 */
export interface FeaturesContext {
  readonly features: Map<string, DeferredFeatureCallback>;
}

/** Context for paper-scoped deferred feature registrations. */
export const PaperFeaturesContext = createContext<FeaturesContext | null>(null);

/** Context for graph-scoped feature registrations. */
export const GraphFeaturesContext = createContext<FeaturesContext | null>(null);
