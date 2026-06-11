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
  PaperOptions,
  PaperTransform,
  RenderElement,
  RenderLink,
  DefaultLink,
  DefaultLinkParams,
} from './components/paper/paper.types';
export type {
  PortalHostCell,
  PortalSelector,
  PortalSelectorParams,
} from './mvc/react-paper.types';
export type {
  ValidateConnection,
  ValidateConnectionParams,
  ValidateEmbedding,
  ValidateEmbeddingParams,
  ValidateUnembedding,
  ValidateUnembeddingParams,
  ConnectionStrategy,
  ConnectionStrategyParams,
  ConnectionStrategyOptions,
  ConnectionStrategyPin,
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
export type { HTMLBoxProps } from './components/html-box';

// Hooks
// -----

/**
 * useGraph()
 */
export { useGraph } from './hooks/use-graph';
export type { GraphHandle, GraphJSON, ExportToJSONOptions } from './hooks/use-graph';

/**
 * usePaper()
 */
export { usePaper } from './hooks/use-paper';
export type { PaperHandle } from './hooks/use-paper';
export type { PaperTarget } from './types/paper.types';

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
 * useMeasureNode()
 */
export { useMeasureNode } from './hooks/use-measure-node';
export type { MeasureNodeOptions } from './hooks/use-measure-node';
export type {
  TransformElementLayout,
  TransformElementLayoutParams,
} from './store/create-elements-size-observer';

/**
 * useNodesMeasuredEffect()
 */
export { useNodesMeasuredEffect } from './hooks/use-nodes-measured-effect';

/**
 * usePaperEvents()
 */
export { usePaperEvents } from './hooks/use-paper-events';
export type { PaperEventMap, PaperEventHandler } from './presets';

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

// Data
// ----

/**
 * Cell types and utilities
 */
export type {
  CellId,
  CellInput,
  CellRef,
  CellRecord,
  AnyCellRecord,
  Computed,
} from './types/cell.types';

/**
 * Element types and utilities
 */
export { elementPort, elementPorts, elementAttributes } from './presets';
export type { ElementRecord, ElementPosition, ElementSize } from './types/cell.types';
export type {
  ElementPort,
  ElementPortShape
} from './presets';

/**
 * Link types and utilities
 */
export { resolveLinkMarker } from './theme/named-link-markers';
export {
  linkRoutingStraight,
  linkRoutingOrthogonal,
  linkRoutingSmooth,
  linkLabel,
  linkLabels,
  linkStyle,
  linkStyleLine,
  linkStyleWrapper,
  linkAttributes,
  linkMarkerArrow,
  linkMarkerArrowOpen,
  linkMarkerArrowSunken,
  linkMarkerArrowQuill,
  linkMarkerArrowDouble,
  linkMarkerCircle,
  linkMarkerDiamond,
  linkMarkerLine,
  linkMarkerCross,
  linkMarkerFork,
  linkMarkerForkClose,
  linkMarkerMany,
  linkMarkerManyOptional,
  linkMarkerOne,
  linkMarkerOneOptional,
  linkMarkerOneOrMany,
} from './presets';
export type { LinkRecord } from './types/cell.types';
export type {
  LinkStyle,
  LinkLabel,
  LinkMarkerRecord,
  LinkMarkerOptions,
  LinkMode,
  LinkRoutingStraightOptions,
  LinkRoutingOrthogonalOptions,
  LinkRoutingSmoothOptions,
} from './presets';
export type { LinkMarkerName, LinkMarker } from './theme/named-link-markers';


// MVC
// ---

/**
 * Cell models
 */
export { ElementModel, ELEMENT_MODEL_TYPE } from './mvc/element-model';
export { LinkModel, LINK_MODEL_TYPE } from './mvc/link-model';

// Utilities
// ---------

/**
 * jsx() - Utility to create JointJS markup from JSX syntax
 */
export { jsx } from './utils/joint-jsx/jsx-to-markup';

// Experimental
// ------------

/**
 * useLinkLayout()
 */
export { useLinkLayout } from './hooks/use-link-layout';
export type { LinkLayout } from './types/cell.types';
