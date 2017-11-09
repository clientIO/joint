var graph = new joint.dia.Graph;

var paper = new joint.dia.Paper({
    el: document.getElementById('paper'),
    width: 1000,
    height: 400,
    gridSize: 10,
    model: graph
});

var Path = joint.shapes.basic.Generic.define('custom.Path', {
    // default attributes

    attrs: {
        path: {
            ref: 'rect',
            strokeMiterlimit: 4,
            strokeLinejoin: 'miter',
            strokeLinecap: 'butt',
            strokeOpacity: 1,
            strokeDasharray: 'none',
            fillOpacity: 1,
            fillRule: 'nonzero'//,
            //resetOffset: true
        },
        rect: {
            x: 10,
            y: 10,
            width: 20,
            height: 20
        }
    }
}, {
    // instance properties

    markup: '<g class="rotatable"><path/><rect/><text/></g>', // no scalable group

    // Set model position and size based on calculated path bbox
    resetModel: function() {

        var modelBBox = V.pathBBox(this.attr('path/refD'));

        this.position(modelBBox.x, modelBBox.y);
        this.size(modelBBox.width, modelBBox.height);
    }

}, {
    // object properties

    // Take a path data string
    // Return a new instance of Path with correct model position and size
    createFromPathData: function(d) {
        // creates model based on provided d
        // does not trigger change:attrs

        var m = new this({
            attrs: { path: { refD: d }}
        });

        m.resetModel();

        return m;
    },

    // attribute setters

    attributes: {
        refD: {
            set: function(refD, refBBox, el) {
                // triggered when any attribute is changed

                var $el = $(el);
                var cacheName = 'joint-refD';
                var cache = $el.data(cacheName);

                if (cache && cache.refD === refD && cache.refBBox.equals(refBBox)) {
                    // neither refD nor refBBox has changed
                    // do nothing

                    return;
                }

                if (!cache || cache.refD !== refD) {
                    // only recalculate if refD has changed

                    var cachedNormalizedD = V.normalizePathData(refD);
                    var cachedPathBBox = V.normalizedPathBBox(cachedNormalizedD);

                    cache = { refD: refD, refBBox: refBBox, normalizedD: cachedNormalizedD, pathBBox: cachedPathBBox };

                    $el.data(cacheName, cache);
                }

                var normalizedD = cache.normalizedD;
                var pathBBox = cache.pathBBox;

                // TODO wrong:
                var tx = refBBox.x - pathBBox.x;
                var ty = refBBox.y - pathBBox.y;

                var origin = refBBox.origin();
                pathBBox.x = origin.x;
                pathBBox.y = origin.y;
                var fitScale = refBBox.maxRectScaleToFit(pathBBox, origin); // can give Infinity if width or height is 0

                var sx = isFinite(fitScale.sx) ? fitScale.sx : 1;
                var sy = isFinite(fitScale.sy) ? fitScale.sy : 1;
                var scaledPathData = V.scaleNormalizedPathData(normalizedD, sx, sy, origin);

                var translatedPathData = V.translateNormalizedPathData(scaledPathData, tx, ty);

                return { d: translatedPathData };
            }
        }
    }
});

var fill = '#c6c7e2';
var stroke = '#6a6c8a';
var strokeWidth = 2;

var d = 'M285.8,83V52.7h8.3v31c0,3.2-1,5.8-3,7.7c-2,1.9-4.4,2.8-7.2,2.8c-2.9,0-5.6-1.2-8.1-3.5l3.8-6.1c1.1,1.3,2.3,1.9,3.7,1.9c0.7,0,1.3-0.3,1.8-0.9C285.5,85,285.8,84.2,285.8,83z';

var path = Path.createFromPathData(d).attr({
    path: {
        fill: fill,
        stroke: stroke,
        strokeWidth: strokeWidth
    },
    rect: {
        fill: fill,
        stroke: stroke,
        strokeWidth: strokeWidth
    }
});

path.addTo(graph);
