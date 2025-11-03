// Internal tags to identify objects as specific JointJS types.
// Used instead of `instanceof` for performance and cross-frame safety.

// dia.Cell
export const CELL_MARKER = Symbol('joint.cellMarker');

// dia.CellCollection
export const CELL_COLLECTION_MARKER = Symbol('joint.cellCollectionMarker');

// dia.GraphLayer
export const GRAPH_LAYER_MARKER = Symbol('joint.graphLayerMarker');

// dia.GraphLayerCollection
export const GRAPH_LAYER_COLLECTION_MARKER = Symbol('joint.graphLayerCollectionMarker');

// dia.CellView
export const CELL_VIEW_MARKER = Symbol('joint.cellViewMarker');

// dia.LayerView
export const LAYER_VIEW_MARKER = Symbol('joint.layerViewMarker');

// dia.GraphLayerView
export const GRAPH_LAYER_VIEW_MARKER = Symbol('joint.graphLayerViewMarker');

