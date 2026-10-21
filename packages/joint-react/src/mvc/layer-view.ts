import { dia } from '@joint/core';
import type { LayerModel } from './layer-model';

/**
 * The layer view `@joint/react` registers for plain graph layers (see
 * {@link LayerModel}). It mirrors the layer's `visible` attribute onto its group
 * as `visibility: hidden`, one style write per toggle: the cell views stay
 * mounted, keep their bounding boxes and so stay measurable, and only the
 * painting and pointer events stop. Extend it, or register your own view for
 * a custom layer type through the paper's `layerViewNamespace`.
 * @group MVC
 */
export class LayerView extends dia.GraphLayerView<LayerModel> {
  /**
   * Subscribes to the layer's own `visible` changes (its model events carry the
   * `layer:` prefix) and applies the current value; the base class stops
   * listening to the model when the paper reference is unset.
   * @param paper - The paper this view was added to.
   */
  protected afterPaperReferenceSet(paper: dia.Paper): void {
    super.afterPaperReferenceSet(paper);
    this.listenTo(this.model, 'layer:change:visible', this.updateVisibility);
    this.updateVisibility();
  }

  /** Writes the layer's `visible` attribute to the group's `visibility` style. */
  protected updateVisibility(): void {
    this.el.style.visibility = this.model.get('visible') === false ? 'hidden' : '';
  }
}
