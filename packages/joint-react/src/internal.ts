// @joint/react/internal — Extension API
// For plugin authors and @joint/react-plus.
// Not part of the public API — may change without notice.

// Internal Hooks
export { useGraphStore } from './hooks/use-graph-store';
export { useInternalData } from './hooks/use-stores';
export { useImperativeApi } from './hooks/use-imperative-api';
export { useCreatePortalPaper } from './hooks/use-create-portal-paper';
export { useCreateFeature } from './hooks/use-create-features';
export { useCombinedRef } from './hooks/use-combined-ref';
export { usePaperStore, useResolvePaperId } from './hooks/use-paper';

// Feature System
export type {
  FeatureTarget,
  OnAddFeature,
  OnUpdateFeature,
  OnLoadFeature,
  OnAddFeatureOptions,
  OnUpdateFeatureOptions,
  OnLoadFeatureOptions,
  AddFeatureOptions,
} from './hooks/use-create-features';
export type { Feature } from './types/feature.types';
export type { FeaturesContext as FeaturesContextType } from './context';
export { FeaturesProvider } from './components';

// Store Classes
export { GraphStore, DEFAULT_CELL_NAMESPACE } from './store/graph-store';
export type { GraphStoreInternalSnapshot, PaperStoreState } from './store/graph-store';
export type { GraphStoreOptions } from './store/graph-store';
export { PaperStore } from './store/paper-store';
export type { PaperStoreOptions, AddPaperOptions } from './store/paper-store';

// Contexts
export {
  GraphStoreContext,
  PaperStoreContext,
  CellIdContext,
  PaperFeaturesContext,
  GraphFeaturesContext,
} from './context';

// State Primitives
export { createAtom, type Atom } from './store/state-container';

// Dragging Internals
export { getCellDragState } from './hooks/use-cell-drag.utils';

// Data-Mapping Defaults
export * from './state/data-mapping/element-mapper';
export * from './state/data-mapping/link-mapper';

// Render Internals
export { PaperHTMLContainer } from './components/paper/render-element/paper-html-container';
export {
  SVGElementItem,
  HTMLElementItem,
} from './components/paper/render-element/paper-element-item';

// Cell Type Internals
export type { ElementJSONInit, LinkJSONInit } from './types/cell.types';

// Utility Functions
export { assignOptions, pickValues, makeOptions } from './utils/object-utilities';
export { resolvePaper, resolvePaperId, isPaperTarget } from './utils/resolve-paper-target';
export { isRecord } from './utils/is';

// Constants
export { ELEMENT_MODEL_TYPE, PORTAL_SELECTOR } from './mvc/element-model';
export { LINK_MODEL_TYPE } from './mvc/link-model';
export { PaperView } from './mvc/paper';

// Internal Selectors
export {
  selectResetVersion,
  createSelectPaperVersion,
  selectGraphFeaturesVersion,
} from './selectors';

// Internal Types (used by react-plus)
export type { OmitWithoutIndexSignature, PaperTarget } from './types';
export type { PortalSelector } from './mvc/paper.types';
export type { MeasureElementOptions } from './hooks/use-measure-element';

// Event internals
export { subscribeToPaperEvents } from './hooks/use-paper-events';
