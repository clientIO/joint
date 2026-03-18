// @joint/react/internal — Extension API
// For plugin authors and @joint/react-plus.
// Not part of the public API — may change without notice.

// Internal Hooks
export { useGraphStore } from './hooks/use-graph-store';
export { useStore, useData, useInternalData } from './hooks/use-stores';
export { useImperativeApi } from './hooks/use-imperative-api';
export { useElementViews } from './hooks/use-element-views';
export type { OnPaperRenderElement } from './hooks/use-element-views';
export { useCreatePortalPaper } from './hooks/use-create-portal-paper';
export { useCreateFeature } from './hooks/use-create-features';
export { useCombinedRef } from './hooks/use-combined-ref';
export { useRefValue } from './hooks/use-ref-value';
export { usePaperStore, useResolvePaperId } from './hooks/use-paper';

// Feature System
export type {
  FeatureTarget,
  Feature,
  FeaturesContext as FeaturesContextType,
  OnAddFeature,
  OnUpdateFeature,
  OnLoadFeature,
  OnAddFeatureOptions,
  OnUpdateFeatureOptions,
  OnLoadFeatureOptions,
  AddFeatureOptions,
} from './hooks/use-create-features';
export { FeaturesProvider } from './components';

// Store Classes
export { GraphStore, DEFAULT_CELL_NAMESPACE } from './store/graph-store';
export type {
  GraphDataState,
  GraphStoreInternalSnapshot,
  GraphLayoutState as GraphStoreLayoutSnapshot,
} from './state/state.types';
export type { GraphStoreOptions } from './store/graph-store';
export { PaperStore } from './store/paper-store';
export type { PaperStoreState } from './state/state.types';
export type { PaperStoreOptions, AddPaperOptions } from './store/paper-store';

// Graph State
export type { GraphState } from './state/graph-state';

// Contexts
export {
  GraphStoreContext,
  PaperStoreContext,
  CellIdContext,
  PaperFeaturesContext,
  GraphFeaturesContext,
} from './context';

// State Primitives
export { createState } from './utils/create-state';
export type { ExternalStoreLike, State } from './utils/create-state';

// Data-Mapping Internals
export { convertLabel } from './state/data-mapping/convert-labels';
export { mergeLabelsFromAttributes } from './state/data-mapping/convert-labels-reverse';
export { convertPorts, createPortDefaults } from './state/data-mapping/convert-ports';
export {
  toLinkEndAttribute,
  toLinkEndData,
  buildLinkPresentationAttributes,
  SOURCE_KEYS,
  TARGET_KEYS,
  assignEndDataProperties,
} from './state/data-mapping/link-attributes';
export { resolveCellDefaults } from './state/data-mapping/resolve-cell-defaults';

// Render Internals
export { PaperHTMLContainer } from './components/paper/render-element/paper-html-container';
export {
  SVGElementItem,
  HTMLElementItem,
} from './components/paper/render-element/paper-element-item';

// Utility Functions
export { assignOptions, pickValues } from './utils/object-utilities';
export { resolvePaper, resolvePaperId } from './types';

// Constants
export { PORTAL_ELEMENT_TYPE, PORTAL_SELECTOR } from './models/portal-element';
export { PORTAL_LINK_TYPE } from './models/portal-link';

// Internal Selectors
export {
  selectResetVersion,
  createSelectPaperVersion,
  selectGraphFeaturesVersion,
} from './selectors';

// Internal Types (used by react-plus)
export type {
  Optional,
  Mutable,
  RemoveIndexSignature,
  OmitWithoutIndexSignature,
  PaperTarget,
} from './types';
export type { PortalSelector } from './models/portal-paper.types';
export type { MeasureNodeOptions } from './hooks/use-measure-node';

// Event internals
export { buildEventContext, subscribeToPaperEvents } from './hooks/use-paper-events';
export type { PaperEventsContext } from './hooks/use-paper-events';
