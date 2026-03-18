// @joint/react — Public API
// For internal/extension API, use '@joint/react/internal'.

// Components
export { GraphProvider } from './components/graph/graph-provider';
export type { GraphProviderProps as GraphProps } from './components/graph/graph-provider';
export { Paper } from './components/paper/paper';
export type { PaperProps, RenderElement, RenderLink } from './components/paper/paper.types';
export { SVGText } from './components/svg-text/svg-text';
export type { SVGTextProps } from './components/svg-text/svg-text';

// Hooks — Get Data
export { useGraph } from './hooks/use-graph';
export { usePaper } from './hooks/use-paper';
export { useElements } from './hooks/use-elements';
export { useLinks } from './hooks/use-links';
export { useElement } from './hooks/use-element';
export { useLink } from './hooks/use-link';

// Hooks — Layout & Measurement
export { useElementLayout } from './hooks/use-element-layout';
export type {
  ElementLayout,
  ElementsLayoutState as ElementsLayoutSnapshot,
  LinksLayoutSnapshot,
} from './state/state.types';
export { useLinkLayout } from './hooks/use-link-layout';
export type { LinkLayout } from './hooks/use-link-layout';
export { useMeasureNode } from './hooks/use-measure-node';
export type { OnTransformElement, TransformOptions } from './store/create-elements-size-observer';
export { useElementsLayout, useLinksLayout } from './hooks/use-stores';
export { useNodesMeasuredEffect } from './hooks/use-nodes-measured-effect';

// Hooks — Events
export { usePaperEvents } from './hooks/use-paper-events';
export { useGraphEvents } from './hooks/use-graph-events';

// Hooks — Context
export { useElementId } from './hooks/use-element-id';
export { useLinkId } from './hooks/use-link-id';
export { useMarkup } from './hooks/use-markup';

// Utilities
export { jsx } from './utils/joint-jsx/jsx-to-markup';

// Types
export type { FlatElementData, FlatElementPort } from './types/element-types';
export type { FlatLinkData, FlatLinkEnd, FlatLinkLabel } from './types/link-types';
export type { CellId } from './types/cell-id';
export type {
  PaperEventMap,
  PaperEventHandlers,
  PaperEventType,
  GraphEventMap,
  GraphBaseEventName,
  GraphEventHandlers,
} from './types/event.types';
export type { IncrementalStateChanges, IncrementalStateChange } from './state/incremental.types';

// Theme
export { defaultLinkTheme } from './theme/link-theme';
export type { LinkTheme } from './theme/link-theme';
export { defaultMarkers, resolveMarker } from './theme/markers';
export type { MarkerPreset } from './theme/markers';
export { LINK_ARROWS, getLinkArrow } from './components/link/link.arrows';
export type { LinkArrowName } from './components/link/link.arrows';

// Models
export { PortalElement, PORTAL_ELEMENT_TYPE } from './models/portal-element';
export { PortalLink, PORTAL_LINK_TYPE } from './models/portal-link';
export { PortalPaper } from './models/portal-paper';

// Selectors (public)
export { selectAreElementsMeasured, selectElementSizes } from './selectors';

// Data mapping (public defaults)
export {
  defaultMapDataToElementAttributes,
  defaultMapElementAttributesToData,
} from './state/data-mapping/element-mapper';
export {
  defaultMapDataToLinkAttributes,
  defaultMapLinkAttributesToData,
} from './state/data-mapping/link-mapper';
export type {
  ElementToGraphOptions,
  GraphToElementOptions,
} from './state/data-mapping/element-mapper';
export type {
  LinkToGraphOptions,
  GraphToLinkOptions,
  ToLinkAttributesOptions,
} from './state/data-mapping/link-mapper';
