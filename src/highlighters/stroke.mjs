import * as util from '../util/index.mjs';
import V from '../V/index.mjs';
import * as mvc from '../mvc/index.mjs';

export const HighlighterView = mvc.View.extend({

    tagName: 'g',
    svgElement: true,

    highlight() {

    },

    unhighlight() {

    }

}, {

    _views: {},

    exists(cellView, id) {
        const { cid } = cellView;
        const { _views } = this;
        if (cid in _views) {
            return (id in _views[cid]);
        }
        return false;
    },

    add(cellView, id, opt) {
        const { cid } = cellView;
        this._views[cid] || (this._views[cid] = {});
        const view = this._views[cid][id] = new this(opt);
        return view;
    },

    remove(cellView, id) {
        const { cid } = cellView;
        const { _views } = this;
        const highlighters = _views[cid];
        if (!highlighters) return;
        if (!id) {
            for (let hid in highlighters) {
                highlighters[hid].remove();
                delete _views[cid];
            }
        } else if (highlighters[id]) {
            highlighters[id].remove();
            delete highlighters[id];
        }
    },

    getHighlighterId(magnetEl, opt) {
        return magnetEl.id + JSON.stringify(opt);
    }
});

export const StrokeHighlighterView = HighlighterView.extend({

    className: 'highlight-stroke',

    options: {
        padding: 3,
        rx: 0,
        ry: 0,
        useFirstSubpath: false,
        attrs: {
            'stroke-width': 3,
            'stroke': '#FEB663'
        }
    },

    highlightConnection(cellView, magnetEl) {

        this.setElement(V('g').node);
        this._ensureElClassName();

        const options = this.options;
        const { padding, attrs } = options;

        // const highlightVel = V('path');
        // highlightVel
        //     .attr({
        //         'd': d,
        //         'pointer-events': 'none',
        //         'vector-effect': 'non-scaling-stroke',
        //         'fill': 'none',
        //         'stroke-linecap': 'round',
        //         'stroke-width': strokeWidth + padding * 2 + 4
        //     }).attr(attrs);

        // const strokeWidth = parseFloat(highlightVel.attr('stroke-width'), 10) || 1;

        // const highlightVelBg = V('path').attr({
        //     'd': d,
        //     'fill': 'none',
        //     'stroke': 'white',
        //     'stroke-width': padding * 2 + 2,
        //     'stroke-linecap': 'round'
        // });

        // this.vel.append([
        //     highlightVel,
        //     highlightVelBg
        // ]);

        // cellView.vel.prepend(this.el);


        const bbox = cellView.isNodeConnection(magnetEl)
            ? cellView.getConnection().bbox()
            : cellView.getNodeBBox(magnetEl);

        bbox.inflate(1000);

        const strokeWidth = 5;//parseFloat(highlightVel.attr('stroke-width'), 10) || 1;

        // const highlightVel = V('path');
        // highlightVel
        //     .attr({
        //         'd': d + ' M -10000 -10000 l 1 1',
        //         'pointer-events': 'none',
        //         'vector-effect': 'non-scaling-stroke',
        //         'fill': 'none',
        //         'stroke-linecap': 'round',
        //         'stroke': 'red',
        //         'stroke-width': strokeWidth + padding * 2 + 4
        //     });//.attr(attrs);

        const highlightVel = V('rect');
        highlightVel.attr(bbox.toJSON());
        highlightVel.attr({
            'pointer-events': 'none',
            'fill': 'red'
        });

        // const highlightVelBg = V('path').attr({
        //     'd': d,
        //     'fill': 'none',
        //     'stroke': 'white',
        //     'stroke-width': padding * 2 + 2,
        //     'stroke-linecap': 'round'
        // });

        // const p = cellView.findBySelector('line')[0];
        let mask;
        if (!cellView.isNodeConnection(magnetEl)) {
            const magnetVEl = V(magnetEl);

            mask = V('mask').append([

                magnetVEl.clone().attr({
                    'fill': 'none',
                    'stroke': 'white',
                    'stroke-width': strokeWidth + padding * 2 + 4,
                    'stroke-linejoin': 'round',
                    'stroke-linecap': 'round',
                }),
                magnetVEl.clone().attr({
                    'fill': 'black',
                    'stroke': 'black',
                    'stroke-linecap': 'round',
                    'stroke-linejoin': 'round',
                    'stroke-width': padding * 2 + 2
                })
            ]);

        } else {

            const d = cellView.getSerializedConnection();

            mask = V('mask').append([

                V('path').attr({
                    'fill': 'none',
                    'stroke': 'white',
                    'd': d,
                    'stroke-width': strokeWidth + padding * 2 + 4,
                    'stroke-linecap': 'round',
                }),
                V('path').attr({
                    'fill': 'none',
                    'stroke': 'black',
                    'd': d,
                    'stroke-linecap': 'round',
                    'stroke-width': padding * 2 + 2
                })
            ]);
        }

        highlightVel.attr('mask', `url(#${mask.id})`);

        this.vel.append([
            mask,
            highlightVel,
        ]);

        cellView.vel.append(this.el);

    },

    highlightMagnet(cellView, magnetEl) {

        const highlightVel = V('path');

        this.setElement(highlightVel.node);
        this._ensureElClassName();

        const options = this.options;
        const { padding, useFirstSubpath, attrs } = options;

        const magnetVel = V(magnetEl);

        highlightVel.attr({
            'pointer-events': 'none',
            'vector-effect': 'non-scaling-stroke',
            'fill': 'none'
        }).attr(attrs);

        let pathData;
        let magnetBBox;
        try {
            pathData = magnetVel.convertToPathData().trim();
            if (magnetVel.tagName() === 'PATH' && useFirstSubpath) {
                const secondSubpathIndex = pathData.search(/.M/i) + 1;
                if (secondSubpathIndex > 0) {
                    pathData = pathData.substr(0, secondSubpathIndex);
                }
            }
        } catch (error) {
            // Failed to get path data from magnet element.
            // Draw a rectangle around the entire cell view instead.
            magnetBBox = cellView.getNodeBoundingRect(magnetEl);
            pathData = V.rectToPath(util.assign({}, options, magnetBBox));
        }

        highlightVel.attr('d', pathData);

        let highlightMatrix = magnetVel.getTransformToElement(cellView.el);

        // Add padding to the highlight element.
        if (padding) {

            magnetBBox || (magnetBBox = cellView.getNodeBoundingRect(magnetEl));

            const cx = magnetBBox.x + (magnetBBox.width / 2);
            const cy = magnetBBox.y + (magnetBBox.height / 2);

            magnetBBox = V.transformRect(magnetBBox, highlightMatrix);

            const width = Math.max(magnetBBox.width, 1);
            const height = Math.max(magnetBBox.height, 1);
            const sx = (width + padding) / width;
            const sy = (height + padding) / height;

            var paddingMatrix = V.createSVGMatrix({
                a: sx,
                b: 0,
                c: 0,
                d: sy,
                e: cx - sx * cx,
                f: cy - sy * cy
            });

            highlightMatrix = highlightMatrix.multiply(paddingMatrix);
        }

        highlightVel.transform(highlightMatrix);
        cellView.vel.append(this.el);
    },

    highlight(cellView, magnetEl) {

        //if (cellView.isNodeConnection(magnetEl)) {
        // if (cellView.model.isLink()) {
        this.highlightConnection(cellView, magnetEl);
        // } else {
        //     this.highlightMagnet(cellView, magnetEl);
        // }
    }

});


export const stroke = {

    /**
     * @param {joint.dia.CellView} cellView
     * @param {Element} magnetEl
     * @param {object=} opt
     */
    highlight: function(cellView, magnetEl, opt) {

        const id = StrokeHighlighterView.getHighlighterId(magnetEl, opt);
        // Only highlight once.
        if (StrokeHighlighterView.exists(cellView, id)) return;

        const highlightView = StrokeHighlighterView.add(cellView, id, opt);
        highlightView.highlight(cellView, magnetEl, opt);
    },

    /**
     * @param {joint.dia.CellView} cellView
     * @param {Element} magnetEl
     * @param {object=} opt
     */
    unhighlight: function(cellView, magnetEl, opt) {

        StrokeHighlighterView.remove(cellView, HighlighterView.getHighlighterId(magnetEl, opt));
    }
};
