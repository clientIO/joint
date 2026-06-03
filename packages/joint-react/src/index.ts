// @joint/react — Public API
// For internal/extension API, use '@joint/react/internal'.

// Components
// ----------

/**
 * <GraphProvider/>
 */
export { GraphProvider } from './components/graph/graph-provider';
export type { GraphProviderProps as GraphProps } from './components/graph/graph-provider';
export type { AutoSizeOrigin } from './store/graph-store';

/**
 * <Paper/>
 */
export { Paper } from './components/paper/paper';
export type {
  PaperTransform,
  PaperProps,
  RenderElement,
  RenderLink,
  DefaultLink,
  DefaultLinkContext,
} from './components/paper/paper.types';
export type {
  PortalHostCell,
  PortalSelector,
  PortalSelectorContext,
} from './models/react-paper.types';
export type {
  ConnectionEnd,
  ValidateConnectionContext,
  ValidateEmbeddingContext,
  ValidateUnembeddingContext,
  CanConnectOptions,
} from './presets';


/**
 * <SVGText/>
 */
export { SVGText } from './components/svg-text/svg-text';
export type { SVGTextProps } from './components/svg-text/svg-text';

/**
 * <HTMLHost/>
 */
export { HTMLHost } from './components/html-host';
export type { HTMLHostProps } from './components/html-host';

/**
 * <HTMLBox/>
 */
export { HTMLBox } from './components/html-box';

// Hooks
// -----

// useGraph()
export { useGraph } from './hooks/use-graph';
export type { GraphHandle, ExportToJSONOptions } from './hooks/use-graph';


// usePaper()
export { usePaper } from './hooks/use-paper';

/**
 * useCells()
 */
export { useCells } from './hooks/use-cells';

/**
 * useCell()
 */
export { useCell } from './hooks/use-cell';

/**
 * useCellId()
 */
export { useCellId } from './hooks/use-cell-id';

/**
 * useLinkLayout()
 * @experimental
 */
export { useLinkLayout } from './hooks/use-link-layout';

/**
 * useMeasureNode()
 */
export { useMeasureNode } from './hooks/use-measure-node';
export type { MeasureNodeOptions } from './hooks/use-measure-node';
export type { OnTransformElement, TransformOptions } from './store/create-elements-size-observer';

/**
 * useNodesMeasuredEffect()
 */
export { useNodesMeasuredEffect } from './hooks/use-nodes-measured-effect';
export type { OnElementsMeasuredOptions } from './hooks/use-nodes-measured-effect';

/**
 * usePaperEvents()
 */
export { usePaperEvents } from './hooks/use-paper-events';
export type { PaperEventMap } from './presets';

/**
 * useGraphEvents()
 */
export { useGraphEvents } from './hooks/use-graph-events';
// @todo add GraphEventMap

/**
 * useCellDrag()
 */
export { useCellDrag } from './hooks/use-cell-drag';
export type { CellDragState } from './hooks/use-cell-drag';

/**
 * useMarkup()
 */
export { useMarkup } from './hooks/use-markup';
export type { MarkupHandle, MagnetRefOptions } from './hooks/use-markup';


// Selectors
// ---------

/**
 * Cell selectors — pass to `useCell` / `useCells`
 */
export {
  selectElementPosition,
  selectElementSize,
  selectElementAngle,
  selectElementData,
  selectCellId,
  selectCellType,
  selectCellParent,
  selectCellLayer,
  selectCellZIndex,
} from './selectors/cell-selectors';


export type { CellInput, CellRef } from './utils/normalize-cell-input';


// Utilities
// ---------

/**
 * jsx() - Utility to create JointJS markup from JSX syntax
 */
export { jsx } from './utils/joint-jsx/jsx-to-markup';




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
export type { ElementPort, PortShape, LinkStyle, LinkLabel } from './presets';

// Theme
export { resolveLinkMarker } from './theme/named-link-markers';
export type { LinkMarkerName, LinkMarker } from './theme/named-link-markers';
export type { LinkMarkerRecord } from './presets';

// MVC
export { ElementModel, ELEMENT_MODEL_TYPE } from './models/element-model';
export { LinkModel, LINK_MODEL_TYPE } from './models/link-model';
export { LinkView } from './presets';
export { ReactPaper } from './models/react-paper';

// Store types
export type { IncrementalCellsChange } from './store/graph-projection';
