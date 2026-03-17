// @joint/react/internal — Extension API
// For plugin authors and @joint/react-plus.
// Not part of the public API — may change without notice.

// Internal Hooks
export { useGraphStore } from './hooks/use-graph-store';
export { useStore, useData, useInternalData, useLayouts } from './hooks/use-stores';
export { useImperativeApi } from './hooks/use-imperative-api';
export { useElementViews } from './hooks/use-element-views';
export type { OnPaperRenderElement } from './hooks/use-element-views';
export { useCreatePortalPaper } from './hooks/use-create-portal-paper';
export type { UseCreatePortalPaperOptions, UseCreatePortalPaperResult } from './hooks/use-create-portal-paper';
export { useCreatePaperFeature } from './hooks/use-create-paper-features';
export { useCombinedRef } from './hooks/use-combined-ref';
export { useRefValue } from './hooks/use-ref-value';

// Feature System
export type {
  Feature,
  OnAddFeature,
  OnUpdateFeature,
  OnLoadFeature,
  OnAddFeatureOptions,
  OnUpdateFeatureOptions,
  OnLoadFeatureOptions,
} from './hooks/use-create-paper-features';
export { PaperFeaturesProvider } from './hooks/use-create-paper-features';

// Store Classes
export { GraphStore, DEFAULT_CELL_NAMESPACE } from './store/graph-store';
export type {
  GraphStoreSnapshot,
  GraphStoreInternalSnapshot,
  GraphStoreLayoutSnapshot,
  GraphStoreOptions,
  ElementLayout,
} from './store/graph-store';
export { PaperStore } from './store/paper-store';
export type { PaperStoreSnapshot, PaperStoreOptions, AddPaperOptions } from './store/paper-store';

// Contexts
export { GraphStoreContext, PaperStoreContext, CellIdContext, PaperFeaturesContext } from './context';
export type { PaperFeaturesContext as PaperFeaturesContextType } from './context';

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
export { SVGElementItem, HTMLElementItem } from './components/paper/render-element/paper-element-item';

// Utility Functions
export { pickValues } from './utils/object-utilities';
export { getPaperFromReference, getPaperIdFromReference } from './types';

// Constants
export { PORTAL_ELEMENT_TYPE } from './models/portal-element';
export { PORTAL_LINK_TYPE } from './models/portal-link';

// Internal Selectors
export {
  selectResetVersion,
  createSelectPaperElementViewIds,
  createSelectPaperLinkViewIds,
  createSelectPaperVersion,
} from './selectors';

// Internal Utility Types
export type { AnyString, Nullable, Mutable, RemoveIndexSignature, OmitWithoutIndexSignature, PaperReference } from './types';
export type { PortalSelector } from './models/portal-paper.types';
export type { MeasureNodeOptions } from './hooks/use-measure-node';
export type { PaperProps as ReactPaperOptions } from './components/paper/paper.types';

// Event internals
export { buildEventContext, subscribeToPaperEvents } from './hooks/use-paper-events';
export type { PaperEventsContext } from './hooks/use-paper-events';
