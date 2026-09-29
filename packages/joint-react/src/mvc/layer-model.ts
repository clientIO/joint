import { dia } from '@joint/core';

/**
 * The `type` of a plain graph layer: joint-core's `'GraphLayer'`, which
 * {@link LayerModel} keeps so that a graph's JSON is unchanged by it.
 * @group MVC
 */
export const LAYER_MODEL_TYPE = 'GraphLayer';

/**
 * Attributes of a {@link LayerModel}: joint-core's `id` and `type` plus the
 * attributes the `@joint/react` layers API interprets.
 * @group MVC
 */
export interface LayerModelAttributes extends dia.GraphLayer.Attributes {
  /** Whether the layer is painted. See {@link LayerRecord.visible}. */
  readonly visible?: boolean;
}

/**
 * The layer class `@joint/react` registers for plain graph layers: it replaces
 * joint-core's `GraphLayer` under the same `type`, so the default `cells` layer
 * and every layer declared without a `type` are instances of it and their JSON
 * is unchanged. It declares the attributes the layers API interprets (today
 * `visible`), so further layer options live here and in {@link LayerView}
 * rather than on the paper. Extend it, or register your own `dia.GraphLayer`
 * subclass under another `type` through the `layerNamespace` prop.
 * @group MVC
 * @example
 * ```ts
 * import { LayerModel } from '@joint/react';
 *
 * const notes = new LayerModel({ id: 'notes', visible: false });
 * ```
 */
export class LayerModel extends dia.GraphLayer<dia.CellCollection, LayerModelAttributes> {}
