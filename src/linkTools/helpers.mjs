import * as connectionStrategies from '../connectionStrategies/index.mjs';

export function getViewBBox(view, useModelGeometry) {
    const { model } = view;
    if (useModelGeometry) return model.getBBox();
    return (model.isLink()) ? view.getConnection().bbox() : view.getNodeUnrotatedBBox(view.el);
}

export function getAnchor(coords, view, magnet) {
    // take advantage of an existing logic inside of the
    // pin relative connection strategy
    var end = connectionStrategies.pinRelative.call(
        this.paper,
        {},
        view,
        magnet,
        coords,
        this.model
    );
    return end.anchor;
}

export function snapAnchor(coords, view, magnet, type, relatedView, toolView) {
    var snapRadius = toolView.options.snapRadius;
    var isSource = (type === 'source');
    var refIndex = (isSource ? 0 : -1);
    var ref = this.model.vertex(refIndex) || this.getEndAnchor(isSource ? 'target' : 'source');
    if (ref) {
        if (Math.abs(ref.x - coords.x) < snapRadius) coords.x = ref.x;
        if (Math.abs(ref.y - coords.y) < snapRadius) coords.y = ref.y;
    }
    return coords;
}
