(function(joint, util) {

    function bboxWrapper(method) {
        return function (bbox, refBBox, opt) {
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

        perpendicular: function (bbox, refBBox, opt) {
            var anchor = bbox.center();
            var ref = refBBox.center();
            var topLeft = bbox.origin();
            var bottomRight = bbox.corner();
            var padding = opt.padding
            if (!isFinite(padding)) padding = 0;
            if ((topLeft.y + padding) <= ref.y && ref.y <= (bottomRight.y - padding)) {
                anchor.y = ref.y;
            } else if ((topLeft.x + padding) <= ref.x && ref.x <= (bottomRight.x - padding)) {
                anchor.x = ref.x;
            }
            return anchor;
        },

        midSide: function (bbox, refBBox, opt) {
            var padding = opt.padding;
            if (isFinite(padding)) bbox.inflate(padding);
            var side = bbox.sideNearestToPoint(refBBox.center());
            switch (side) {
                case 'left': return bbox.leftMiddle();
                case 'right': return bbox.rightMiddle();
                case 'top': return bbox.topMiddle();
                case 'bottom': return bbox.bottomMiddle();
            }
        },

        vertex: function (bbox, refBBox, opt) {
            if (bbox.containsPoint(refBBox.center())) {
                return refBBox.center();
            }
            return bbox.center();
        },

        parallel: function (bbox, refBBox, opt) {
            var distance = opt.distance;
            if (!isFinite(distance)) distance = 5;
            var link = this.model;
            var source = link.get('source');
            var target = link.get('target');
            var anchor = bbox.center();
            if (source.id && target.id) {
                var graph = this.paper.model;
                var sourceModel = link.getSourceElement();
                if (sourceModel) {
                    var connectedLinks = graph.getConnectedLinks(sourceModel, { outbound: true });
                    var sameLinks = connectedLinks.filter(function (_link) {
                        var _source = _link.get('source');
                        var _target = _link.get('target');
                        return _source && _source.id === source.id &&
                            (!_source.port || (_source.port === source.port)) &&
                            _target && _target.id === target.id &&
                            (!_target.port || (_target.port === target.port));
                    });
                    var linksCount = sameLinks.length;
                    if (linksCount <= 1) return anchor;
                    if (refBBox.width > 0) sameLinks.reverse();
                    var linkIndex = sameLinks.indexOf(link);
                    anchor.move(refBBox.center().rotate(anchor, 90 * Math.pow(-1, linkIndex)), distance);
                }
            }
            return anchor;
        }
    }

})(joint, joint.util);
