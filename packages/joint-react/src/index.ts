// @joint/react — Public API
// For internal/extension API, use '@joint/react/internal'.

// Components
// ----------

/**
 * <GraphProvider/>
 * @group Components
 */
export { GraphProvider } from './components/graph/graph-provider';
/** @group Types */
export type { GraphProviderProps } from './components/graph/graph-provider';
/** @group Types */
export type { AutoSizeOrigin } from './store/graph-store';
/** @group Types */
export type { IncrementalCellsChange } from './store/graph-projection';

/**
 * <Paper/>
 * @group Components
 */
export { Paper } from './components/paper/paper';
/** @group Types */
export type {
  PaperProps,
  PaperOptions,
  PaperTransform,
  RenderElement,
  RenderLink,
  DefaultLink,
  DefaultLinkParams,
} from './components/paper/paper.types';
/** @group Types */
export type { PortalHostCell, PortalSelector, PortalSelectorParams } from './mvc/paper.types';
/** @group Types */
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
  CellVisibility,
  CellVisibilityParams,
  CellInteractivity,
  CellInteractivityParams,
} from './presets';

/**
 * <SVGText/>
 * @group Components
 */
export { SVGText } from './components/svg-text/svg-text';
/** @group Types */
export type { SVGTextProps } from './components/svg-text/svg-text';

/**
 * <HTMLHost/>
 * @group Components
 */
export { HTMLHost } from './components/html-host';
/** @group Types */
export type { HTMLHostProps } from './components/html-host';

/**
 * <HTMLBox/>
 * @group Components
 */
export { HTMLBox } from './components/html-box';
/** @group Types */
export type { HTMLBoxProps } from './components/html-box';

// Hooks
// -----

/**
 * useGraph()
 * @group Hooks
 */
export { useGraph } from './hooks/use-graph';
/** @group Types */
export type { GraphApi, GraphJSON, ExportToJSONOptions } from './hooks/use-graph';

/**
 * useSetCellData()
 * @group Hooks
 */
export { useSetCellData } from './hooks/use-cell-setters';

/**
 * usePaper()
 * @group Hooks
 */
export { usePaper } from './hooks/use-paper';
/** @group Types */
export type { PaperApi } from './hooks/use-paper';
/** @group Types */
export type { PaperTarget } from './types/paper.types';

/**
 * useCells()
 * @group Hooks
 */
export { useCells } from './hooks/use-cells';

/**
 * useCell()
 * @group Hooks
 */
export { useCell } from './hooks/use-cell';

/**
 * useCellId()
 * @group Hooks
 */
export { useCellId } from './hooks/use-cell-id';

/**
 * useMeasureElement()
 * @group Hooks
 */
export { useMeasureElement } from './hooks/use-measure-element';
/** @group Types */
export type { MeasureElementOptions } from './hooks/use-measure-element';
/** @group Types */
export type {
  TransformElementLayout,
  TransformElementLayoutParams,
} from './store/create-elements-size-observer';

/**
 * useOnElementsMeasured()
 * @group Hooks
 */
export { useOnElementsMeasured } from './hooks/use-on-elements-measured';
/** @group Types */
export type { ElementsMeasuredParams, OnElementsMeasured } from './hooks/use-on-elements-measured';

/**
 * useOnPaperEvents()
 * @group Hooks
 */
export { useOnPaperEvents } from './hooks/use-on-paper-events';
/** @group Types */
export type { PaperEventMap, PaperEventHandler } from './presets';

/**
 * useOnGraphEvents()
 * @group Hooks
 */
export { useOnGraphEvents } from './hooks/use-on-graph-events';
/** @group Types */
export type { GraphEventMap } from './hooks/use-on-graph-events';

/**
 * useCellDrag()
 * @group Hooks
 */
export { useCellDrag } from './hooks/use-cell-drag';
/** @group Types */
export type { CellDragState } from './hooks/use-cell-drag';

/**
 * useMarkup()
 * @group Hooks
 */
export { useMarkup } from './hooks/use-markup';
/** @group Types */
export type { MarkupApi, MagnetRefOptions } from './hooks/use-markup';

// Selectors
// ---------

/**
 * Cell selectors — pass to `useCell` / `useCells`
 * @group Selectors
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
 * @group Types
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
 * @group Types
 */
export type { InferElement } from './utils/create';
/** @group Presets */
export { elementPort, elementPorts, elementAttributes } from './presets';
/** @group Types */
export type { ElementRecord, ElementPosition, ElementSize } from './types/cell.types';
/** @group Types */
export type { ElementPort, ElementPortShape } from './presets';

/**
 * Link types and utilities
 * @group Types
 */
export type { InferLink } from './utils/create';
/** @group Presets */
export { resolveLinkMarker } from './theme/named-link-markers';
/** @group Presets */
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
/** @group Types */
export type { LinkRecord } from './types/cell.types';
/** @group Types */
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
/** @group Types */
export type { LinkMarkerName, LinkMarker } from './theme/named-link-markers';

// MVC
// ---

/**
 * Cell models
 * @group MVC
 */
export { ElementModel, ELEMENT_MODEL_TYPE } from './mvc/element-model';
/** @group MVC */
export { LinkModel, LINK_MODEL_TYPE } from './mvc/link-model';

// Utilities
// ---------

/**
 * jsx() - Utility to create JointJS markup from JSX syntax
 * @group Utils
 */
export { jsx } from './utils/joint-jsx/jsx-to-markup';

// Experimental
// ------------

/**
 * useLinkLayout()
 * @group Hooks
 */
export { useLinkLayout } from './hooks/use-link-layout';
/** @group Types */
export type { LinkLayout } from './types/cell.types';
