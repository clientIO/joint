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
  LinksLayoutState as LinksLayoutSnapshot,
} from './state/state.types';
export { useLinkLayout } from './hooks/use-link-layout';
export type { LinkLayout } from './hooks/use-link-layout';
export { useMeasureNode } from './hooks/use-measure-node';
export type { OnTransformElement, TransformOptions } from './store/create-elements-size-observer';
export { useElementsLayout, useLinksLayout } from './hooks/use-stores';
export { useNodesMeasuredEffect } from './hooks/use-nodes-measured-effect';

// Hooks — Mappers
export { useFlatElementData } from './hooks/use-flat-element-data';
export { useFlatLinkData } from './hooks/use-flat-link-data';

// Hooks — Events
export { usePaperEvents } from './hooks/use-paper-events';
export { useGraphEvents } from './hooks/use-graph-events';

// Hooks — Context
export { useElementId } from './hooks/use-element-id';
export { useLinkId } from './hooks/use-link-id';
export { useMarkup } from './hooks/use-markup';

// Utilities
export { jsx } from './utils/joint-jsx/jsx-to-markup';
export { flatElementDataToAttributes, flatAttributesToElementData } from './state/data-mapping/element-mapper';
export { flatLinkDataToAttributes, flatAttributesToLinkData } from './state/data-mapping/link-mapper';

// Types
export type { FlatCellData, FlatElementData, FlatElementPort, FlatLinkData, FlatLinkEnd, FlatLinkLabel, FlatLinkPresentationData } from './types/data-types';
export type { PortShape as PortShape } from './theme/element-theme';
export type { CellId } from './types/cell-id';
export type { PaperEventMap } from './types/event.types';
export type { IncrementalStateChanges, IncrementalStateChange } from './state/incremental.types';

// Theme
export type { LinkMarkerName, LinkMarker } from './theme/markers';

// Models
export { PortalElement, PORTAL_ELEMENT_TYPE } from './models/portal-element';
export { PortalLink, PORTAL_LINK_TYPE } from './models/portal-link';
export { PortalPaper } from './models/portal-paper';

// Selectors (public)
export { selectAreElementsMeasured, selectElementSizes } from './selectors';

// Data mapping types
export type { CellAttributes } from './state/data-mapping';
export type {
  ToElementAttributesOptions,
  ToElementDataOptions,
} from './state/data-mapping/element-mapper';
export type {
  ToLinkAttributesOptions,
  ToLinkDataOptions,
} from './state/data-mapping/link-mapper';
