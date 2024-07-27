import { HoverConnect as LinkHoverConnect } from '../cellTools/HoverConnect.mjs';
import V from '../V/index.mjs';
import * as g from '../g/index.mjs';
import { isCalcExpression, evalCalcExpression } from '../util/calc.mjs';
import { getViewBBox } from '../cellTools/helpers.mjs';

export const HoverConnect = LinkHoverConnect.extend({

    getTrackPath() {
        const { relatedView: view, options } = this;
        let {
            useModelGeometry,
            trackPath =  'M 0 0 H calc(w) V calc(h) H 0 Z'
        } = options;
        if (typeof trackPath === 'function') {
            trackPath = trackPath.call(this, view);
        }
        if (isCalcExpression(trackPath)) {
            const bbox = getViewBBox(view, useModelGeometry);
            trackPath = evalCalcExpression(trackPath, bbox);
        }
        return new g.Path(V.normalizePathData(trackPath));
    },

    getTrackMatrix() {
        const { relatedView: view, options } = this;
        let { useModelGeometry, rotate } = options;
        let bbox = getViewBBox(view, useModelGeometry);
        const angle = view.model.angle();
        if (!rotate) bbox = bbox.bbox(angle);
        let matrix = V.createSVGMatrix().translate(bbox.x + bbox.width / 2, bbox.y + bbox.height / 2);
        if (rotate) matrix = matrix.rotate(angle);
        matrix = matrix.translate(- bbox.width / 2, - bbox.height / 2);
        return matrix;
    }

});
