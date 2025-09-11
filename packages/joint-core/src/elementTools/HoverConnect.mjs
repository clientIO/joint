import { HoverConnect as LinkHoverConnect } from '../cellTools/HoverConnect.mjs';
import V from '../V/index.mjs';
import * as g from '../g/index.mjs';
import { isCalcExpression, evalCalcExpression } from '../util/calc.mjs';
import { getToolOptions, getViewBBox } from '../cellTools/helpers.mjs';

export const HoverConnect = LinkHoverConnect.extend({

    getTrackPath() {
        const { relatedView: view } = this;
        let {
            useModelGeometry,
            relative,
            trackPath = 'M 0 0 H calc(w) V calc(h) H 0 Z'
        } = getToolOptions(this);
        if (typeof trackPath === 'function') {
            trackPath = trackPath.call(this, view);
        }
        if (isCalcExpression(trackPath)) {
            const bbox = getViewBBox(view, { useModelGeometry, relative });
            trackPath = evalCalcExpression(trackPath, bbox);
        }
        return new g.Path(V.normalizePathData(trackPath));
    },

    getTrackMatrix() {
        if (this.isOverlay()) return this.getTrackMatrixAbsolute();
        return V.createSVGMatrix();
    },

    getTrackMatrixAbsolute() {
        const { relatedView: view } = this;
        let { useModelGeometry, rotate } = getToolOptions(this);
        let bbox = getViewBBox(view, { useModelGeometry });
        const angle = view.model.angle();
        if (!rotate) bbox = bbox.bbox(angle);
        let matrix = V.createSVGMatrix().translate(bbox.x + bbox.width / 2, bbox.y + bbox.height / 2);
        if (rotate) matrix = matrix.rotate(angle);
        matrix = matrix.translate(- bbox.width / 2, - bbox.height / 2);
        return matrix;
    }

});
