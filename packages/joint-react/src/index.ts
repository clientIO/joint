// @joint/react — Public API
// For internal/extension API, use '@joint/react/internal'.

// Components
export { GraphProvider } from './components/graph/graph-provider';
export type { GraphProviderProps as GraphProps } from './components/graph/graph-provider';
export { Paper } from './components/paper/paper';
export type { PaperProps, RenderElement, RenderLink } from './components/paper/paper.types';
export { SVGText } from './components/svg-text/svg-text';
export type { SVGTextProps } from './components/svg-text/svg-text';
export { DefaultElement } from './components/default-element';

// Hooks — Get Data
export { useGraph } from './hooks/use-graph';
export { usePaper } from './hooks/use-paper';
export { useElements } from './hooks/use-elements';
export { useLinks } from './hooks/use-links';
export { useElement } from './hooks/use-element';
export { useLink } from './hooks/use-link';
export type { ResolvedLink } from './hooks/use-link';

// Hooks — Measurement
export { useMeasureNode } from './hooks/use-measure-node';
export type { OnTransformElement, TransformOptions } from './store/create-elements-size-observer';
export { useNodesMeasuredEffect } from './hooks/use-nodes-measured-effect'; // Hooks — Mappers
export { useElementDefaults as useElementDefaults } from './hooks/use-element-defaults';
export { useLinkDefaults as useLinkDefaults } from './hooks/use-link-defaults';

// Hooks — Events
export { usePaperEvents } from './hooks/use-paper-events';
export { useGraphEvents } from './hooks/use-graph-events';

// Hooks — Data API (v2)
export { useElementData } from './hooks/use-element-data';
export { useElementPosition } from './hooks/use-element-position';
export { useElementSize } from './hooks/use-element-size';
export { useLinkData } from './hooks/use-link-data';

// Hooks — Context
export { useElementId } from './hooks/use-element-id';
export { useLinkId } from './hooks/use-link-id';
export { useMarkup } from './hooks/use-markup';

// Utilities
export { jsx } from './utils/joint-jsx/jsx-to-markup';
export * from './state/data-mapping/element-mapper';
export * from './state/data-mapping/link-mapper';

// Types
export type { ElementPosition, ElementSize } from './types/cell-data';
export type {
  ElementRecord,
  ElementPort,
  LinkRecord,
  LinkStyle,
  LinkLabel,
} from './types/data-types';
export type { PortShape as PortShape } from './theme/element-theme';
export type { CellId } from './types/cell-id';
export type { PaperEventMap } from './types/event.types';

// Theme
export type { LinkMarkerName, LinkMarker } from './theme/markers';

// Models
export { PortalElement, PORTAL_ELEMENT_TYPE } from './models/portal-element';
export { PortalLink, PORTAL_LINK_TYPE } from './models/portal-link';
export { PortalPaper } from './models/portal-paper';

// Data mapping types
export type { CellAttributes } from './state/data-mapping';

// Store types
export type { IncrementalContainerChanges } from './store/graph-view';
