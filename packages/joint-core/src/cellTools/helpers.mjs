import * as connectionStrategies from '../connectionStrategies/index.mjs';

/**
 * Common helper for getting a cell view’s bounding box,
 * configurable with `useModelGeometry`, `relative`, and `el`.
 */
export function getViewBBox(view, {
    useModelGeometry = false,
    relative = false,
    el = view.el
} = {}) {
    const { model } = view;
    let bbox;
    if (useModelGeometry) {
        // cell model bbox
        bbox = model.getBBox();
    } else if (model.isLink()) {
        // link view bbox
        bbox = view.getConnection().bbox();
    } else {
        // element view bbox
        bbox = view.getNodeUnrotatedBBox(el);
    }
    if (relative) {
        // Relative to the element position.
        const position = model.position();
        bbox.x -= position.x;
        bbox.y -= position.y;
    }
    return bbox;
}

/**
 * Retrieves the tool options.
 * Automatically overrides `useModelGeometry` and `rotate`
 * if the tool is positioned relative to the element.
 */
export function getToolOptions(toolView) {
    // Positioning is relative if the tool is drawn within the element view.
    const relative = !toolView.isOverlay();
    const { useModelGeometry, rotate, ...otherOptions } = toolView.options;
    return {
        ...otherOptions,
        useModelGeometry: useModelGeometry || relative,
        rotate: rotate || relative,
        relative,
    };
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
