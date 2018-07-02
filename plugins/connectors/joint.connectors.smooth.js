(function(joint, g) {

    var OUT_VECTOR_NAME = 'outDirection';
    var IN_VECTOR_NAME = 'inDirection'
    var SOURCE_VECTOR_PATH = ['source', 'direction'];
    var TARGET_VECTOR_PATH = ['target', 'direction'];

    function customizeCurves(curves, sourceVector, targetVector, route) {

        for (var i = 0, n = curves.length; i < n; i++) {

            var curve = curves[i];

            var outVector = (i === 0) ? sourceVector : route[i - 1][OUT_VECTOR_NAME];
            if (outVector) {
                curve.controlPoint1 = curve.start.clone().offset(outVector);
            }

            var inVector = (i === n - 1) ? targetVector : route[i][IN_VECTOR_NAME];
            if (inVector) {
                curve.controlPoint2 = curve.end.clone().offset(inVector);
            }
        }
    }

    function curvesThroughtPoints(sourcePoint, targetPoint, route) {

        var points = [sourcePoint].concat(route).concat([targetPoint]);
        return g.Curve.throughPoints(points);
    }

    function curveDirect(sourcePoint, targetPoint) {

        // if we have no route, use a default cubic bezier curve
        // cubic bezier requires two control points
        // the control points have `x` midway between source and target
        // this produces an S-like curve
        var controlPoint1, controlPoint2;

        if ((Math.abs(sourcePoint.x - targetPoint.x)) >= (Math.abs(sourcePoint.y - targetPoint.y))) {
            var controlPointX = (sourcePoint.x + targetPoint.x) / 2;
            controlPoint1 = new g.Point(controlPointX, sourcePoint.y);
            controlPoint2 = new g.Point(controlPointX, targetPoint.y);
        } else {
            var controlPointY = (sourcePoint.y + targetPoint.y) / 2;
            controlPoint1 = new g.Point(sourcePoint.x, controlPointY);
            controlPoint2 = new g.Point(targetPoint.x, controlPointY);
        }

        return new g.Curve(sourcePoint, controlPoint1, controlPoint2, targetPoint);
    }


    function smoothConnector(sourcePoint, targetPoint, route, opt) {

        var options = opt || {};
        var points = route || [];

        var curves = (points.length !== 0)
            ? curvesThroughtPoints(sourcePoint, targetPoint, points)
            : [curveDirect(sourcePoint, targetPoint)];

        if (options.directions) {
            if (!(this instanceof joint.dia.LinkView)) throw new Error('method requires a LinkView context');
            var link = this.model;
            var sourceVector = link.prop(SOURCE_VECTOR_PATH);
            var targetVector = link.prop(TARGET_VECTOR_PATH);
            customizeCurves(curves, sourceVector, targetVector, points);
        }

        var path = new g.Path(curves);
        return (options.raw) ? path : path.serialize();
    }

    joint.connectors.smooth = smoothConnector;

})(joint, g);

