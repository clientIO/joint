(function(joint, util) {

    function bboxWrapper(method) {
        return function (cellView, magnet, ref, opt) {
            var bbox = cellView.getMagnetBBox(magnet);
            var anchor = bbox[method]();
            var dx = opt.dx;
            if (dx) {
                var dxPercentage = util.isPercentage(dx);
                dx = parseFloat(dx);
                if (isFinite(dx)) {
                    if (dxPercentage) {
                        dx /= 100;
                        dx *= bbox.width;
                    }
                    anchor.x += dx;
                }
            }
            var dy = opt.dy;
            if (dy) {
                var dyPercentage = util.isPercentage(dy);
                dy = parseFloat(dy);
                if (isFinite(dy)) {
                    if (dyPercentage) {
                        dy /= 100;
                        dy *= bbox.height;
                    }
                    anchor.y += dy;
                }
            }
            return anchor;
        }
    }

    function resolveRefAsBBoxCenter(fn) {
        return function(cellView, magnet, ref, opt, linkView) {
            if (ref instanceof Element) {
                var refView = this.paper.findView(ref);
                var refPoint = refView.getMagnetBBox(ref).center();
                return fn.call(this, cellView, magnet, refPoint, opt, linkView)
            }
            return fn.apply(this, arguments);
        }
    }


    joint.anchors = {

        center: bboxWrapper('center'),

        top: bboxWrapper('topMiddle'),

        bottom: bboxWrapper('bottomMiddle'),

        left: bboxWrapper('leftMiddle'),

        right: bboxWrapper('rightMiddle'),

        topLeft: bboxWrapper('origin'),

        topRight: bboxWrapper('topRight'),

        bottomLeft: bboxWrapper('bottomLeft'),

        bottomRight: bboxWrapper('corner'),

        perpendicular: resolveRefAsBBoxCenter(function(cellView, magnet, refPoint, opt) {
            var cell = cellView.model;
            var angle = cell.angle();
            var bbox = cellView.getMagnetBBox(magnet);
            var anchor = bbox.center();
            var topLeft = bbox.origin();
            var bottomRight = bbox.corner();
            var padding = opt.padding
            if (!isFinite(padding)) padding = 0;
            if ((topLeft.y + padding) <= refPoint.y && refPoint.y <= (bottomRight.y - padding)) {
                anchor.x += (refPoint.y - anchor.y) * Math.tan(g.toRad(angle));
                anchor.y = refPoint.y;
            } else if ((topLeft.x + padding) <= refPoint.x && refPoint.x <= (bottomRight.x - padding)) {
                anchor.y += (refPoint.x - anchor.x) * Math.tan(g.toRad(angle));
                anchor.x = refPoint.x;
            }
            return anchor;

            // var cell = cellView.model;
            // var angle = cell.angle();
            // var bbox = cellView.getMagnetUnrotatedBBox(magnet);
            // var center = bbox.center();
            // var topLeft = bbox.origin();
            // var bottomRight = bbox.corner();
            // var padding = opt.padding
            // var refPoint = ref.clone().rotate(center, angle);
            // var anchor = center.clone();

            // if (!isFinite(padding)) padding = 0;
            // if ((topLeft.y + padding) <= refPoint.y && refPoint.y <= (bottomRight.y - padding)) {
            //     anchor.x += (refPoint.y - anchor.y) * Math.tan(g.toRad(angle));
            //     anchor.y = refPoint.y;
            // } else if ((topLeft.x + padding) <= refPoint.x && refPoint.x <= (bottomRight.x - padding)) {
            //     anchor.y += (refPoint.x - anchor.x) * Math.tan(g.toRad(angle));
            //     anchor.x = refPoint.x;
            // }

            // if (typeof xxx === 'undefined') xxx = V('line', { stroke: 'red' }).appendTo(this.paper.viewport);
            // xxx.attr({  x1: refPoint.x, y1: refPoint.y, x2: anchor.x, y2: anchor.y });

            // return anchor.rotate(center, -angle);
        }),

        midSide: resolveRefAsBBoxCenter(function(cellView, magnet, refPoint, opt) {
            var bbox = cellView.getMagnetBBox(magnet);
            var padding = opt.padding;
            if (isFinite(padding)) bbox.inflate(padding);
            var side = bbox.sideNearestToPoint(refPoint);
            switch (side) {
                case 'left': return bbox.leftMiddle();
                case 'right': return bbox.rightMiddle();
                case 'top': return bbox.topMiddle();
                case 'bottom': return bbox.bottomMiddle();
            }
        }),

        // vertex: function (cellView, magnet, refPoint, opt) {
        //     var bbox = cellView.getMagnetBBox(magnet);
        //     if (bbox.containsPoint(refBBox.center())) {
        //         return refPoint;
        //     }
        //     return bbox.center();
        // },

        // parallel: function (cellView, magnet, ref, opt) {
        //     var bbox = cellView.getMagnetBBox(magnet);
        //     var distance = opt.distance;
        //     if (!isFinite(distance)) distance = 5;
        //     var link = this.model;
        //     var source = link.get('source');
        //     var target = link.get('target');
        //     var anchor = bbox.center();
        //     if (source.id && target.id) {
        //         var graph = this.paper.model;
        //         var sourceModel = link.getSourceElement();
        //         if (sourceModel) {
        //             var connectedLinks = graph.getConnectedLinks(sourceModel, { outbound: true });
        //             var sameLinks = connectedLinks.filter(function (_link) {
        //                 var _source = _link.get('source');
        //                 var _target = _link.get('target');
        //                 return _source && _source.id === source.id &&
        //                     (!_source.port || (_source.port === source.port)) &&
        //                     _target && _target.id === target.id &&
        //                     (!_target.port || (_target.port === target.port));
        //             });
        //             var linksCount = sameLinks.length;
        //             if (linksCount <= 1) return anchor;
        //             if (refBBox.width > 0) sameLinks.reverse();
        //             var linkIndex = sameLinks.indexOf(link);
        //             anchor.move(refBBox.center().rotate(anchor, 90 * Math.pow(-1, linkIndex)), distance);
        //         }
        //     }
        //     return anchor;
        // }
    }

})(joint, joint.util);
