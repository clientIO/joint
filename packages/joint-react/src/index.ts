// @joint/react — Public API
// For internal/extension API, use '@joint/react/internal'.

// Components
export { GraphProvider } from './components/graph/graph-provider';
export type { GraphProviderProps as GraphProps } from './components/graph/graph-provider';
export { Paper } from './components/paper/paper';
export type {
  PaperProps,
  RenderElement,
  RenderLink,
  DefaultLinkContext,
} from './components/paper/paper.types';
export type { ValidateEmbeddingContext, ValidateUnembeddingContext } from './presets/can-embed';
export type {
  ConnectionEnd,
  ValidateConnectionContext,
  CanConnectOptions,
} from './presets/can-connect';
export { SVGText } from './components/svg-text/svg-text';
export type { SVGTextProps } from './components/svg-text/svg-text';
export { HTMLHost } from './components/html-host';
export type { HTMLHostProps } from './components/html-host';
export { HTMLBox } from './components/html-box';

// Hooks — cells API (primary)
export { useCells } from './hooks/use-cells';
export { useCell } from './hooks/use-cell';
export { useCellId } from './hooks/use-cell-id';
export { useLinkLayout } from './hooks/use-link-layout';
export { useGraph } from './hooks/use-graph';
export type { UseGraphResult, ExportToJSONOptions } from './hooks/use-graph';
export { useGraphStore } from './hooks/use-graph-store';
export { usePaper, usePaperStore } from './hooks/use-paper';

// Hooks — Measurement
export { useMeasureNode } from './hooks/use-measure-node';
export type { OnTransformElement, TransformOptions } from './store/create-elements-size-observer';
export { useNodesMeasuredEffect } from './hooks/use-nodes-measured-effect';

// Hooks — Events
export { usePaperEvents } from './hooks/use-paper-events';
export { useGraphEvents } from './hooks/use-graph-events';

// Hooks — Misc
export { useMarkup } from './hooks/use-markup';

// Cell selectors — pass to `useCell` / `useCells`
export {
  selectElementPosition,
  selectElementSize,
  selectElementAngle,
  selectElementData,
  selectCellId,
  selectCellType,
  selectCellParent,
} from './selectors/cell-selectors';

// Utilities
export { jsx } from './utils/joint-jsx/jsx-to-markup';
export { toSVGMatrix } from './utils/transform';
export type { PaperTransform } from './components/paper/paper.types';
export * from './state/data-mapping/element-mapper';
export * from './state/data-mapping/link-mapper';
export * from './state/data-mapping/cell-mapper';

// Types — unified cells
export type {
  CellRecord,
  CellId,
  ElementRecord,
  LinkRecord,
  Computed,
  AnyCellRecord,
} from './types/cell.types';

// Types — geometry / presets
export type { ElementPosition, ElementSize, LinkLayout } from './types/cell.types';
export type { ElementPort, PortShape } from './presets/element-ports';
export type { LinkStyle } from './presets/link-style';
export type { LinkLabel } from './presets/link-labels';
export type { PaperEventMap } from './types/event.types';

// Theme
export type { LinkMarkerName, LinkMarker } from './theme/named-link-markers';
export { resolveLinkMarker } from './theme/named-link-markers';
export type { LinkMarkerRecord } from './presets/link-markers';

// Models
export { ElementModel, ELEMENT_MODEL_TYPE } from './models/element-model';
export { LinkModel, LINK_MODEL_TYPE } from './models/link-model';
export { LinkView } from './presets/link-view';
export { PortalPaper } from './models/portal-paper';
export type {
  PortalHostCell,
  PortalSelector,
  PortalSelectorContext,
} from './models/portal-paper.types';

// Store types
export type { IncrementalCellsChange } from './store/graph-view';
