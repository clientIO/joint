// @joint/react — Public API
// For internal/extension API, use '@joint/react/internal'.

// Components
// ----------

/**
 * <GraphProvider/>
 */
export { GraphProvider } from './components/graph/graph-provider';
export type { GraphProviderProps } from './components/graph/graph-provider';
export type { AutoSizeOrigin } from './store/graph-store';
export type { IncrementalCellsChange } from './store/graph-projection';

/**
 * <Paper/>
 */
export { Paper } from './components/paper/paper';
export type {
  PaperProps,
  PaperTransform,
  RenderElement,
  RenderLink,
  DefaultLink,
  DefaultLinkContext,
} from './components/paper/paper.types';
export type {
  PortalHostCell,
  PortalSelector,
  PortalSelectorContext,
} from './mvc/react-paper.types';
export type {
  ValidateConnectionContext,
  ValidateEmbeddingContext,
  ValidateUnembeddingContext,
  CanConnectOptions,
  ConnectionEnd,
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
export type { HTMLHostProps as HTMLBoxProps } from './components/html-host';

// Hooks
// -----

// useGraph()
export { useGraph } from './hooks/use-graph';
export type { GraphHandle, GraphJSON, ExportToJSONOptions } from './hooks/use-graph';


// usePaper()
export { usePaper } from './hooks/use-paper';
export type { PaperHandle } from './hooks/use-paper';

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
export type { LinkLayout } from './types/cell.types';

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
export type { GraphEventMap } from './hooks/use-graph-events';

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

// Utilities
// ---------

/**
 * jsx() - Utility to create JointJS markup from JSX syntax
 */
export { jsx } from './utils/joint-jsx/jsx-to-markup';


// Cells
// -----

export type {
  CellId,
  CellInput,
  CellRef,
  CellRecord,
  ElementRecord,
  LinkRecord,
  AnyCellRecord,
  Computed,
  ElementPosition,
  ElementSize
} from './types/cell.types';
export type {
  ElementPort,
  PortShape,
  LinkStyle,
  LinkLabel,
  LinkMarkerRecord,
} from './presets';


// Theme
export { resolveLinkMarker } from './theme/named-link-markers';
export type { LinkMarkerName, LinkMarker } from './theme/named-link-markers';

// MVC
// ---

export { ElementModel, ELEMENT_MODEL_TYPE } from './mvc/element-model';
export { LinkModel, LINK_MODEL_TYPE } from './mvc/link-model';
export { LinkView } from './presets';
export { ReactPaper } from './mvc/react-paper';

