'use strict';

QUnit.module('path', function(hooks) {

    var $fixture = $('#qunit-fixture');

    var getSvg = function() {
        var svg = V('svg');
        svg.attr('width', 600);
        svg.attr('height', 800);
        $fixture.append(svg.node);

        return svg;
    };

    QUnit.module('constructor', function() {

        QUnit.test('creates a new Path object', function(assert) {

            var path;

            // no arguments (invalid)
            path = new g.Path();
            assert.ok(path instanceof g.Path, 'returns instance of g.Path');
            assert.ok(typeof path.segments !== 'undefined', 'has "segments" property');
            assert.ok(Array.isArray(path.segments));
            assert.equal(path.segments.length, 0);

            // path data string -> g.Path.parse()

            // path segments array
            path = new g.Path([
                g.Path.createSegment('M', 0, 100),
                g.Path.createSegment('L', 100, 100),
                g.Path.createSegment('C', 150, 150, 250, 50, 300, 100),
                g.Path.createSegment('Z')
            ]);
            assert.ok(path instanceof g.Path, 'returns instance of g.Path');
            assert.ok(typeof path.segments !== 'undefined', 'has "segments" property');
            assert.ok(Array.isArray(path.segments));
            assert.equal(path.segments.length, 4);
            assert.ok(path.segments[0] instanceof g.Path.segmentTypes.M);
            assert.ok(path.segments[1] instanceof g.Path.segmentTypes.L);
            assert.ok(path.segments[2] instanceof g.Path.segmentTypes.C);
            assert.ok(path.segments[3] instanceof g.Path.segmentTypes.Z);
            assert.equal(path.segments[0].end.toString(), '0@100');
            assert.equal(path.segments[1].start.toString(), '0@100');
            assert.equal(path.segments[1].end.toString(), '100@100');
            assert.equal(path.segments[2].start.toString(), '100@100');
            assert.equal(path.segments[2].controlPoint1.toString(), '150@150');
            assert.equal(path.segments[2].controlPoint2.toString(), '250@50');
            assert.equal(path.segments[2].end.toString(), '300@100');
            assert.equal(path.segments[3].start.toString(), '300@100');
            assert.equal(path.segments[3].end.toString(), '0@100');

            // array of lines (linked)
            path = new g.Path([
                new g.Line(new g.Point(10, 10), new g.Point(11, 11)),
                new g.Line(new g.Point(11, 11), new g.Point(21, 21))
            ]);
            assert.ok(path instanceof g.Path, 'returns instance of g.Path');
            assert.ok(typeof path.segments !== 'undefined', 'has "segments" property');
            assert.ok(Array.isArray(path.segments));
            assert.equal(path.segments.length, 3);
            assert.ok(path.segments[0] instanceof g.Path.segmentTypes.M);
            assert.ok(path.segments[1] instanceof g.Path.segmentTypes.L);
            assert.ok(path.segments[2] instanceof g.Path.segmentTypes.L);
            assert.equal(path.segments[0].end.toString(), '10@10');
            assert.equal(path.segments[1].start.toString(), '10@10');
            assert.equal(path.segments[1].end.toString(), '11@11');
            assert.equal(path.segments[2].start.toString(), '11@11');
            assert.equal(path.segments[2].end.toString(), '21@21');

            // array of lines (unlinked)
            path = new g.Path([
                new g.Line(new g.Point(10, 10), new g.Point(11, 11)),
                new g.Line(new g.Point(20, 20), new g.Point(21, 21))
            ]);
            assert.ok(path instanceof g.Path, 'returns instance of g.Path');
            assert.ok(typeof path.segments !== 'undefined', 'has "segments" property');
            assert.ok(Array.isArray(path.segments));
            assert.equal(path.segments.length, 4);
            assert.ok(path.segments[0] instanceof g.Path.segmentTypes.M);
            assert.ok(path.segments[1] instanceof g.Path.segmentTypes.L);
            assert.ok(path.segments[2] instanceof g.Path.segmentTypes.M);
            assert.ok(path.segments[3] instanceof g.Path.segmentTypes.L);
            assert.equal(path.segments[0].end.toString(), '10@10');
            assert.equal(path.segments[1].start.toString(), '10@10');
            assert.equal(path.segments[1].end.toString(), '11@11');
            assert.equal(path.segments[2].end.toString(), '20@20');
            assert.equal(path.segments[3].start.toString(), '20@20');
            assert.equal(path.segments[3].end.toString(), '21@21');

            // array of curves (linked)
            path = new g.Path([
                new g.Curve(new g.Point(10, 10), new g.Point(11, 11), new g.Point(12, 12), new g.Point(13, 13)),
                new g.Curve(new g.Point(13, 13), new g.Point(21, 21), new g.Point(22, 22), new g.Point(23, 23))
            ]);
            assert.ok(path instanceof g.Path, 'returns instance of g.Path');
            assert.ok(typeof path.segments !== 'undefined', 'has "segments" property');
            assert.ok(Array.isArray(path.segments));
            assert.equal(path.segments.length, 3);
            assert.ok(path.segments[0] instanceof g.Path.segmentTypes.M);
            assert.ok(path.segments[1] instanceof g.Path.segmentTypes.C);
            assert.ok(path.segments[2] instanceof g.Path.segmentTypes.C);
            assert.equal(path.segments[0].end.toString(), '10@10');
            assert.equal(path.segments[1].start.toString(), '10@10');
            assert.equal(path.segments[1].controlPoint1.toString(), '11@11');
            assert.equal(path.segments[1].controlPoint2.toString(), '12@12');
            assert.equal(path.segments[1].end.toString(), '13@13');
            assert.equal(path.segments[2].start.toString(), '13@13');
            assert.equal(path.segments[2].controlPoint1.toString(), '21@21');
            assert.equal(path.segments[2].controlPoint2.toString(), '22@22');
            assert.equal(path.segments[2].end.toString(), '23@23');

            // array of curves (unlinked)
            path = new g.Path([
                new g.Curve(new g.Point(10, 10), new g.Point(11, 11), new g.Point(12, 12), new g.Point(13, 13)),
                new g.Curve(new g.Point(20, 20), new g.Point(21, 21), new g.Point(22, 22), new g.Point(23, 23))
            ]);
            assert.ok(path instanceof g.Path, 'returns instance of g.Path');
            assert.ok(typeof path.segments !== 'undefined', 'has "segments" property');
            assert.ok(Array.isArray(path.segments));
            assert.equal(path.segments.length, 4);
            assert.ok(path.segments[0] instanceof g.Path.segmentTypes.M);
            assert.ok(path.segments[1] instanceof g.Path.segmentTypes.C);
            assert.ok(path.segments[2] instanceof g.Path.segmentTypes.M);
            assert.ok(path.segments[3] instanceof g.Path.segmentTypes.C);
            assert.equal(path.segments[0].end.toString(), '10@10');
            assert.equal(path.segments[1].start.toString(), '10@10');
            assert.equal(path.segments[1].controlPoint1.toString(), '11@11');
            assert.equal(path.segments[1].controlPoint2.toString(), '12@12');
            assert.equal(path.segments[1].end.toString(), '13@13');
            assert.equal(path.segments[2].end.toString(), '20@20');
            assert.equal(path.segments[3].start.toString(), '20@20');
            assert.equal(path.segments[3].controlPoint1.toString(), '21@21');
            assert.equal(path.segments[3].controlPoint2.toString(), '22@22');
            assert.equal(path.segments[3].end.toString(), '23@23');

            // array of curves from g.Curve.throughPoints (linked)
            path = new g.Path(g.Curve.throughPoints([
                new g.Point(0, 100),
                new g.Point(45.3125, 128.125),
                new g.Point(154.6875, 71.875),
                new g.Point(200, 100)
            ]));
            assert.ok(path instanceof g.Path, 'returns instance of g.Path');
            assert.ok(typeof path.segments !== 'undefined', 'has "segments" property');
            assert.ok(Array.isArray(path.segments));
            assert.equal(path.segments.length, 4);
            assert.ok(path.segments[0] instanceof g.Path.segmentTypes.M);
            assert.ok(path.segments[1] instanceof g.Path.segmentTypes.C);
            assert.ok(path.segments[2] instanceof g.Path.segmentTypes.C);
            assert.ok(path.segments[3] instanceof g.Path.segmentTypes.C);
            assert.equal(path.segments[0].end.toString(), '0@100');
            assert.equal(path.segments[1].start.toString(), '0@100');
            assert.equal(path.segments[1].controlPoint1.toString(), '7.986111111111107@118.75');
            assert.equal(path.segments[1].controlPoint2.toString(), '15.972222222222214@137.5');
            assert.equal(path.segments[1].end.toString(), '45.3125@128.125');
            assert.equal(path.segments[2].start.toString(), '45.3125@128.125');
            assert.equal(path.segments[2].controlPoint1.toString(), '74.65277777777779@118.75');
            assert.equal(path.segments[2].controlPoint2.toString(), '125.34722222222223@81.25');
            assert.equal(path.segments[2].end.toString(), '154.6875@71.875');
            assert.equal(path.segments[3].start.toString(), '154.6875@71.875');
            assert.equal(path.segments[3].controlPoint1.toString(), '184.02777777777777@62.49999999999999');
            assert.equal(path.segments[3].controlPoint2.toString(), '192.01388888888889@81.25');
            assert.equal(path.segments[3].end.toString(), '200@100');

            // array of lines and curves (linked)
            path = new g.Path([
                new g.Curve(new g.Point(10, 10), new g.Point(11, 11), new g.Point(12, 12), new g.Point(13, 13)),
                new g.Line(new g.Point(13, 13), new g.Point(21, 21))
            ]);
            assert.ok(path instanceof g.Path, 'returns instance of g.Path');
            assert.ok(typeof path.segments !== 'undefined', 'has "segments" property');
            assert.ok(Array.isArray(path.segments));
            assert.equal(path.segments.length, 3);
            assert.ok(path.segments[0] instanceof g.Path.segmentTypes.M);
            assert.ok(path.segments[1] instanceof g.Path.segmentTypes.C);
            assert.ok(path.segments[2] instanceof g.Path.segmentTypes.L);
            assert.equal(path.segments[0].end.toString(), '10@10');
            assert.equal(path.segments[1].start.toString(), '10@10');
            assert.equal(path.segments[1].controlPoint1.toString(), '11@11');
            assert.equal(path.segments[1].controlPoint2.toString(), '12@12');
            assert.equal(path.segments[1].end.toString(), '13@13');
            assert.equal(path.segments[2].start.toString(), '13@13');
            assert.equal(path.segments[2].end.toString(), '21@21');

            // array of lines and curves (unlinked)
            path = new g.Path([
                new g.Curve(new g.Point(10, 10), new g.Point(11, 11), new g.Point(12, 12), new g.Point(13, 13)),
                new g.Line(new g.Point(20, 20), new g.Point(21, 21))
            ]);
            assert.ok(path instanceof g.Path, 'returns instance of g.Path');
            assert.ok(typeof path.segments !== 'undefined', 'has "segments" property');
            assert.ok(Array.isArray(path.segments));
            assert.equal(path.segments.length, 4);
            assert.ok(path.segments[0] instanceof g.Path.segmentTypes.M);
            assert.ok(path.segments[1] instanceof g.Path.segmentTypes.C);
            assert.ok(path.segments[2] instanceof g.Path.segmentTypes.M);
            assert.ok(path.segments[3] instanceof g.Path.segmentTypes.L);
            assert.equal(path.segments[0].end.toString(), '10@10');
            assert.equal(path.segments[1].start.toString(), '10@10');
            assert.equal(path.segments[1].controlPoint1.toString(), '11@11');
            assert.equal(path.segments[1].controlPoint2.toString(), '12@12');
            assert.equal(path.segments[1].end.toString(), '13@13');
            assert.equal(path.segments[2].end.toString(), '20@20');
            assert.equal(path.segments[3].start.toString(), '20@20');
            assert.equal(path.segments[3].end.toString(), '21@21');

            // single segment
            path = new g.Path(g.Path.createSegment('L', 100, 100));
            assert.ok(path instanceof g.Path, 'returns instance of g.Path');
            assert.ok(typeof path.segments !== 'undefined', 'has "segments" property');
            assert.ok(Array.isArray(path.segments));
            assert.equal(path.segments.length, 1);
            assert.ok(path.segments[0] instanceof g.Path.segmentTypes.L);
            assert.equal(path.segments[0].end.toString(), '100@100');

            // single line
            path = new g.Path(new g.Line(new g.Point(100, 100), new g.Point(200, 200)));
            assert.ok(path instanceof g.Path, 'returns instance of g.Path');
            assert.ok(typeof path.segments !== 'undefined', 'has "segments" property');
            assert.ok(Array.isArray(path.segments));
            assert.equal(path.segments.length, 2);
            assert.ok(path.segments[0] instanceof g.Path.segmentTypes.M);
            assert.ok(path.segments[1] instanceof g.Path.segmentTypes.L);
            assert.equal(path.segments[0].end.toString(), '100@100');
            assert.equal(path.segments[1].start.toString(), '100@100');
            assert.equal(path.segments[1].end.toString(), '200@200');

            // single curve
            path = new g.Path(new g.Curve(new g.Point(100, 100), new g.Point(100, 200), new g.Point(200, 200), new g.Point(200, 100)));
            assert.ok(path instanceof g.Path, 'returns instance of g.Path');
            assert.ok(typeof path.segments !== 'undefined', 'has "segments" property');
            assert.ok(Array.isArray(path.segments));
            assert.equal(path.segments.length, 2);
            assert.ok(path.segments[0] instanceof g.Path.segmentTypes.M);
            assert.ok(path.segments[1] instanceof g.Path.segmentTypes.C);
            assert.equal(path.segments[0].end.toString(), '100@100');
            assert.equal(path.segments[1].start.toString(), '100@100');
            assert.equal(path.segments[1].controlPoint1.toString(), '100@200');
            assert.equal(path.segments[1].controlPoint2.toString(), '200@200');
            assert.equal(path.segments[1].end.toString(), '200@100');

            // polyline with points
            path = new g.Path(new g.Polyline([
                new g.Point(0, 100),
                new g.Point(50, 200),
                new g.Point(150, 0),
                new g.Point(200, 100)
            ]));
            assert.ok(path instanceof g.Path, 'returns instance of g.Path');
            assert.ok(typeof path.segments !== 'undefined', 'has "segments" property');
            assert.ok(Array.isArray(path.segments));
            assert.equal(path.segments.length, 4);
            assert.ok(path.segments[0] instanceof g.Path.segmentTypes.M);
            assert.ok(path.segments[1] instanceof g.Path.segmentTypes.L);
            assert.ok(path.segments[2] instanceof g.Path.segmentTypes.L);
            assert.ok(path.segments[3] instanceof g.Path.segmentTypes.L);
            assert.equal(path.segments[0].end.toString(), '0@100');
            assert.equal(path.segments[1].start.toString(), '0@100');
            assert.equal(path.segments[1].end.toString(), '50@200');
            assert.equal(path.segments[2].start.toString(), '50@200');
            assert.equal(path.segments[2].end.toString(), '150@0');
            assert.equal(path.segments[3].start.toString(), '150@0');
            assert.equal(path.segments[3].end.toString(), '200@100');

            // polyline with no points (invalid)
            path = new g.Path(new g.Polyline());
            assert.ok(path instanceof g.Path, 'returns instance of g.Path');
            assert.ok(typeof path.segments !== 'undefined', 'has "segments" property');
            assert.ok(Array.isArray(path.segments));
            assert.equal(path.segments.length, 0);
        });
    });

    QUnit.module('parse()', function() {

        QUnit.test('creates a new Path object from string', function(assert) {

            var path;

            // empty string (invalid)
            path = new g.Path('');
            assert.ok(path instanceof g.Path, 'returns instance of g.Path');
            assert.ok(typeof path.segments !== 'undefined', 'has "segments" property');
            assert.ok(Array.isArray(path.segments));
            assert.equal(path.segments.length, 0);

            // normalized path data string
            path = new g.Path('M 0 100 L 100 100 C 150 150 250 50 300 100 Z');
            assert.ok(path instanceof g.Path, 'returns instance of g.Path');
            assert.ok(typeof path.segments !== 'undefined', 'has "segments" property');
            assert.ok(Array.isArray(path.segments));
            assert.equal(path.segments.length, 4);
            assert.ok(path.segments[0] instanceof g.Path.segmentTypes.M);
            assert.ok(path.segments[1] instanceof g.Path.segmentTypes.L);
            assert.ok(path.segments[2] instanceof g.Path.segmentTypes.C);
            assert.ok(path.segments[3] instanceof g.Path.segmentTypes.Z);
            assert.equal(path.segments[0].end.toString(), '0@100');
            assert.equal(path.segments[1].start.toString(), '0@100');
            assert.equal(path.segments[1].end.toString(), '100@100');
            assert.equal(path.segments[2].start.toString(), '100@100');
            assert.equal(path.segments[2].controlPoint1.toString(), '150@150');
            assert.equal(path.segments[2].controlPoint2.toString(), '250@50');
            assert.equal(path.segments[2].end.toString(), '300@100');
            assert.equal(path.segments[3].start.toString(), '300@100');
            assert.equal(path.segments[3].end.toString(), '0@100');

            // path data string without starting moveto (invalid)
            path = new g.Path('L 100 100');
            assert.ok(path instanceof g.Path, 'returns instance of g.Path');
            assert.ok(typeof path.segments !== 'undefined', 'has "segments" property');
            assert.ok(Array.isArray(path.segments));
            assert.equal(path.segments.length, 1);
            assert.ok(path.segments[0] instanceof g.Path.segmentTypes.L);
            assert.equal(path.segments[0].end.toString(), '100@100');

            // valid unnormalized path data string
            path = new g.Path('M100-200L1.6.8ZM10,10C-.6,-.7,4.1 0.2.4-3');
            assert.ok(path instanceof g.Path, 'returns instance of g.Path');
            assert.ok(typeof path.segments !== 'undefined', 'has "segments" property');
            assert.ok(Array.isArray(path.segments));
            assert.equal(path.segments.length, 5);
            assert.ok(path.segments[0] instanceof g.Path.segmentTypes.M);
            assert.ok(path.segments[1] instanceof g.Path.segmentTypes.L);
            assert.ok(path.segments[2] instanceof g.Path.segmentTypes.Z);
            assert.ok(path.segments[3] instanceof g.Path.segmentTypes.M);
            assert.ok(path.segments[4] instanceof g.Path.segmentTypes.C);
            assert.equal(path.segments[0].end.toString(), '100@-200');
            assert.equal(path.segments[1].start.toString(), '100@-200');
            assert.equal(path.segments[1].end.toString(), '1.6@0.8');
            assert.equal(path.segments[2].start.toString(), '1.6@0.8');
            assert.equal(path.segments[2].end.toString(), '100@-200');
            assert.equal(path.segments[3].end.toString(), '10@10');
            assert.equal(path.segments[4].start.toString(), '10@10');
            assert.equal(path.segments[4].controlPoint1.toString(), '-0.6@-0.7');
            assert.equal(path.segments[4].controlPoint2.toString(), '4.1@0.2');
            assert.equal(path.segments[4].end.toString(), '0.4@-3');

            // valid unnormalized path data string with chained coordinates
            path = new g.Path('M 11 11 21 21 C 31 31 32 32 33 33 41 41 42 42 43 43 L 51 51 52 52');
            assert.ok(path instanceof g.Path, 'returns instance of g.Path');
            assert.ok(typeof path.segments !== 'undefined', 'has "segments" property');
            assert.ok(Array.isArray(path.segments));
            assert.equal(path.segments.length, 6);
            assert.ok(path.segments[0] instanceof g.Path.segmentTypes.M);
            assert.ok(path.segments[1] instanceof g.Path.segmentTypes.L);
            assert.ok(path.segments[2] instanceof g.Path.segmentTypes.C);
            assert.ok(path.segments[3] instanceof g.Path.segmentTypes.C);
            assert.ok(path.segments[4] instanceof g.Path.segmentTypes.L);
            assert.ok(path.segments[5] instanceof g.Path.segmentTypes.L);
            assert.equal(path.segments[0].end.toString(), '11@11');
            assert.equal(path.segments[1].start.toString(), '11@11');
            assert.equal(path.segments[1].end.toString(), '21@21');
            assert.equal(path.segments[2].start.toString(), '21@21');
            assert.equal(path.segments[2].controlPoint1.toString(), '31@31');
            assert.equal(path.segments[2].controlPoint2.toString(), '32@32');
            assert.equal(path.segments[2].end.toString(), '33@33');
            assert.equal(path.segments[3].start.toString(), '33@33');
            assert.equal(path.segments[3].controlPoint1.toString(), '41@41');
            assert.equal(path.segments[3].controlPoint2.toString(), '42@42');
            assert.equal(path.segments[3].end.toString(), '43@43');
            assert.equal(path.segments[4].start.toString(), '43@43');
            assert.equal(path.segments[4].end.toString(), '51@51');
            assert.equal(path.segments[5].start.toString(), '51@51');
            assert.equal(path.segments[5].end.toString(), '52@52');
        });
    });

    QUnit.module('createSegment()', function() {

        QUnit.test('incorrect type', function(assert) {

            var error;

            // no type
            try {
                g.Path.createSegment();
            } catch (e) {
                error = e;
            }
            assert.ok(typeof error !== 'undefined', 'Should throw an error when called with no type.');

            // unrecognized type
            try {
                g.Path.createSegment('X');
            } catch (e) {
                error = e;
            }
            assert.ok(typeof error !== 'undefined', 'Should throw an error when called with an unrecognized type.');
        });

        QUnit.test('moveto', function(assert) {

            var segment;
            var path = new g.Path();
            var clonedPath;

            var error;

            // moveto -> lowercase
            try {
                segment = g.Path.createSegment('m');
            } catch (e) {
                error = e;
            }
            assert.ok(typeof error !== 'undefined', 'Should throw an error when called with lowercase `m` as type.');

            // moveto -> no arguments (incorrect)
            try {
                segment = g.Path.createSegment('M');
            } catch (e) {
                error = e;
            }
            assert.ok(typeof error !== 'undefined', 'Should throw an error when M called with no arguments.');

            // moveto -> 1 point (correct)
            segment = g.Path.createSegment('M', new g.Point(10, 10));
            assert.ok(segment instanceof g.Path.segmentTypes.M);
            clonedPath = path.clone();
            clonedPath.appendSegment(segment);
            assert.equal(clonedPath.toString(), 'M 10 10');

            // moveto -> 2 points (correct)
            segment = g.Path.createSegment('M', new g.Point(10, 10), new g.Point(11, 11));
            assert.ok(Array.isArray(segment));
            assert.ok(segment[0] instanceof g.Path.segmentTypes.M);
            assert.ok(segment[1] instanceof g.Path.segmentTypes.L);
            clonedPath = path.clone();
            clonedPath.appendSegment(segment);
            assert.equal(clonedPath.toString(), 'M 10 10 L 11 11');

            // moveto -> 1 string coordinate (incorrect)
            try {
                segment = g.Path.createSegment('M', '10');
            } catch (e) {
                error = e;
            }
            assert.ok(typeof error !== 'undefined', 'Should throw an error when M called with 1 string coordinate.');

            // moveto -> 1 number coordinate (incorrect)
            try {
                segment = g.Path.createSegment('M', 10);
            } catch (e) {
                error = e;
            }
            assert.ok(typeof error !== 'undefined', 'Should throw an error when M called with 1 number coordinate.');

            // moveto -> 2 string coordinates (correct)
            segment = g.Path.createSegment('M', '10', '10');
            assert.ok(segment instanceof g.Path.segmentTypes.M);
            clonedPath = path.clone();
            clonedPath.appendSegment(segment);
            assert.equal(clonedPath.toString(), 'M 10 10');

            // moveto -> 2 number coordinates (correct)
            segment = g.Path.createSegment('M', 10, 10);
            assert.ok(segment instanceof g.Path.segmentTypes.M);
            clonedPath = path.clone();
            clonedPath.appendSegment(segment);
            assert.equal(clonedPath.toString(), 'M 10 10');

            // moveto -> 2 mixed coordinates (correct)
            segment = g.Path.createSegment('M', '10', 10);
            assert.ok(segment instanceof g.Path.segmentTypes.M);
            clonedPath = path.clone();
            clonedPath.appendSegment(segment);
            assert.equal(clonedPath.toString(), 'M 10 10');

            // moveto -> 3 coordinates (incorrect)
            try {
                segment = g.Path.createSegment('M', '10', '10', '10');
            } catch (e) {
                error = e;
            }
            assert.ok(typeof error !== 'undefined', 'Should throw an error when M called with 3 coordinates.');

            // moveto -> 4 coordinates (correct)
            segment = g.Path.createSegment('M', '10', '10', '11', '11');
            assert.ok(Array.isArray(segment));
            assert.ok(segment[0] instanceof g.Path.segmentTypes.M);
            assert.ok(segment[1] instanceof g.Path.segmentTypes.L);
            clonedPath = path.clone();
            clonedPath.appendSegment(segment);
            assert.equal(clonedPath.toString(), 'M 10 10 L 11 11');
        });

        QUnit.test('lineto', function(assert) {

            var segment;
            var path = new g.Path();
            var clonedPath;

            var error;

            // lineto -> lowercase
            try {
                segment = g.Path.createSegment('l');
            } catch (e) {
                error = e;
            }
            assert.ok(typeof error !== 'undefined', 'Should throw an error when called with lowercase `l` as type.');

            // lineto -> no arguments (incorrect)
            try {
                segment = g.Path.createSegment('L');
            } catch (e) {
                error = e;
            }
            assert.ok(typeof error !== 'undefined', 'Should throw an error when L called with no arguments.');

            // lineto -> 1 point (correct)
            segment = g.Path.createSegment('L', new g.Point(10, 10));
            assert.ok(segment instanceof g.Path.segmentTypes.L);
            clonedPath = path.clone();
            clonedPath.appendSegment(segment);
            assert.equal(clonedPath.toString(), 'L 10 10');

            // lineto -> 2 points (correct)
            segment = g.Path.createSegment('L', new g.Point(10, 10), new g.Point(11, 11));
            assert.ok(Array.isArray(segment));
            assert.ok(segment[0] instanceof g.Path.segmentTypes.L);
            assert.ok(segment[1] instanceof g.Path.segmentTypes.L);
            clonedPath = path.clone();
            clonedPath.appendSegment(segment);
            assert.equal(clonedPath.toString(), 'L 10 10 L 11 11');

            // lineto -> 1 string coordinate (incorrect)
            try {
                segment = g.Path.createSegment('L', '10');
            } catch (e) {
                error = e;
            }
            assert.ok(typeof error !== 'undefined', 'Should throw an error when L called with 1 string coordinate.');

            // lineto -> 1 number coordinate (incorrect)
            try {
                segment = g.Path.createSegment('L', 10);
            } catch (e) {
                error = e;
            }
            assert.ok(typeof error !== 'undefined', 'Should throw an error when L called with 1 number coordinate.');

            // lineto -> 2 string coordinates (correct)
            segment = g.Path.createSegment('L', '10', '10');
            assert.ok(segment instanceof g.Path.segmentTypes.L);
            clonedPath = path.clone();
            clonedPath.appendSegment(segment);
            assert.equal(clonedPath.toString(), 'L 10 10');

            // lineto -> 2 number coordinates (correct)
            segment = g.Path.createSegment('L', 10, 10);
            assert.ok(segment instanceof g.Path.segmentTypes.L);
            clonedPath = path.clone();
            clonedPath.appendSegment(segment);
            assert.equal(clonedPath.toString(), 'L 10 10');

            // lineto -> 2 mixed coordinates (correct)
            segment = g.Path.createSegment('L', '10', 10);
            assert.ok(segment instanceof g.Path.segmentTypes.L);
            clonedPath = path.clone();
            clonedPath.appendSegment(segment);
            assert.equal(clonedPath.toString(), 'L 10 10');

            // lineto -> 3 coordinates (incorrect)
            try {
                segment = g.Path.createSegment('L', '10', '10', '10');
            } catch (e) {
                error = e;
            }
            assert.ok(typeof error !== 'undefined', 'Should throw an error when L called with 3 coordinates.');

            // lineto -> 4 coordinates (correct)
            segment = g.Path.createSegment('L', '10', '10', '11', '11');
            assert.ok(Array.isArray(segment));
            assert.ok(segment[0] instanceof g.Path.segmentTypes.L);
            assert.ok(segment[1] instanceof g.Path.segmentTypes.L);
            clonedPath = path.clone();
            clonedPath.appendSegment(segment);
            assert.equal(clonedPath.toString(), 'L 10 10 L 11 11');
        });

        QUnit.test('curveto', function(assert) {

            var segment;
            var path = new g.Path();
            var clonedPath;

            var error;

            // curveto -> lowercase
            try {
                segment = g.Path.createSegment('c');
            } catch (e) {
                error = e;
            }
            assert.ok(typeof error !== 'undefined', 'Should throw an error when called with lowercase `c` as type.');

            // curveto -> no arguments (incorrect)
            try {
                segment = g.Path.createSegment('C');
            } catch (e) {
                error = e;
            }
            assert.ok(typeof error !== 'undefined', 'Should throw an error when C called with no arguments.');

            // curveto -> 2 points (incorrect)
            try {
                segment = g.Path.createSegment('C', new g.Point(10, 10), new g.Point(11, 11));
            } catch (e) {
                error = e;
            }
            assert.ok(typeof error !== 'undefined', 'Should throw an error when C called with 2 points.');

            // curveto -> 3 points (correct)
            segment = g.Path.createSegment('C', new g.Point(10, 10), new g.Point(11, 11), new g.Point(12, 12));
            assert.ok(segment instanceof g.Path.segmentTypes.C);
            clonedPath = path.clone();
            clonedPath.appendSegment(segment);
            assert.equal(clonedPath.toString(), 'C 10 10 11 11 12 12');

            // curveto -> 5 points (incorrect)
            try {
                segment = g.Path.createSegment('C', new g.Point(10, 10), new g.Point(11, 11), new g.Point(12, 12), new g.Point(13, 13), new g.Point(14, 14));
            } catch (e) {
                error = e;
            }
            assert.ok(typeof error !== 'undefined', 'Should throw an error when C called with 5 points.');

            // curveto -> 6 points (correct)
            segment = g.Path.createSegment('C', new g.Point(10, 10), new g.Point(11, 11), new g.Point(12, 12), new g.Point(13, 13), new g.Point(14, 14), new g.Point(15, 15));
            assert.ok(Array.isArray(segment));
            assert.ok(segment[0] instanceof g.Path.segmentTypes.C);
            assert.ok(segment[1] instanceof g.Path.segmentTypes.C);
            clonedPath = path.clone();
            clonedPath.appendSegment(segment);
            assert.equal(clonedPath.toString(), 'C 10 10 11 11 12 12 C 13 13 14 14 15 15');

            // curveto -> 5 string coordinates (incorrect)
            try {
                segment = g.Path.createSegment('C', '1', '2', '3', '4', '5');
            } catch (e) {
                error = e;
            }
            assert.ok(typeof error !== 'undefined', 'Should throw an error when C called with 5 string coordinates.');

            // curveto -> 5 number coordinates (incorrect)
            try {
                segment = g.Path.createSegment('C', 1, 2, 3, 4, 5);
            } catch (e) {
                error = e;
            }
            assert.ok(typeof error !== 'undefined', 'Should throw an error when C called with 5 number coordinates.');

            // curveto -> 6 string coordinates (correct)
            segment = g.Path.createSegment('C', '10', '10', '11', '11', '12', '12');
            assert.ok(segment instanceof g.Path.segmentTypes.C);
            clonedPath = path.clone();
            clonedPath.appendSegment(segment);
            assert.equal(clonedPath.toString(), 'C 10 10 11 11 12 12');

            // curveto -> 6 number coordinates (correct)
            segment = g.Path.createSegment('C', 10, 10, 11, 11, 12, 12);
            assert.ok(segment instanceof g.Path.segmentTypes.C);
            clonedPath = path.clone();
            clonedPath.appendSegment(segment);
            assert.equal(clonedPath.toString(), 'C 10 10 11 11 12 12');

            // curveto -> 6 mixed coordinates (correct)
            segment = g.Path.createSegment('C', 10, '10', '11', '11', 12, 12);
            assert.ok(segment instanceof g.Path.segmentTypes.C);
            clonedPath = path.clone();
            clonedPath.appendSegment(segment);
            assert.equal(clonedPath.toString(), 'C 10 10 11 11 12 12');

            // curveto -> 11 coordinates (incorrect)
            try {
                segment = g.Path.createSegment('C', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11);
            } catch (e) {
                error = e;
            }
            assert.ok(typeof error !== 'undefined', 'Should throw an error when C called with 11 coordinates.');

            // curveto -> 12 coordinates (correct)
            segment = g.Path.createSegment('C', 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15);
            assert.ok(Array.isArray(segment));
            assert.ok(segment[0] instanceof g.Path.segmentTypes.C);
            assert.ok(segment[1] instanceof g.Path.segmentTypes.C);
            clonedPath = path.clone();
            clonedPath.appendSegment(segment);
            assert.equal(clonedPath.toString(), 'C 10 10 11 11 12 12 C 13 13 14 14 15 15');
        })

        QUnit.test('closepath', function(assert) {

            var segment;
            var path = new g.Path();
            var clonedPath;

            var error;

            // closepath -> lowercase
            segment = g.Path.createSegment('z');
            assert.ok(segment instanceof g.Path.segmentTypes.z);
            clonedPath = path.clone();
            clonedPath.appendSegment(segment);
            // lowecase `z` still translates into capital `Z`
            assert.equal(clonedPath.toString(), 'Z');

            // closepath -> no arguments (correct)
            segment = g.Path.createSegment('Z');
            assert.ok(segment instanceof g.Path.segmentTypes.Z);
            clonedPath = path.clone();
            clonedPath.appendSegment(segment);
            assert.equal(clonedPath.toString(), 'Z');

            // closepath -> arguments (incorrect)
            try {
                segment = g.Path.createSegment('Z', 10);
            } catch (e) {
                error = e;
            }
            assert.ok(typeof error !== 'undefined', 'Should throw an error when Z called with any arguments.');
        });
    });

    QUnit.module('prototype', function() {

        QUnit.module('appendSegment()', function() {

            QUnit.test('sanity', function(assert) {

                var path;
                var segment;

                var error;

                try {
                    path = new g.Path();
                    segment = null;
                    path.appendSegment(segment);
                } catch (e) {
                    error = e;
                }
                assert.ok(typeof error !== 'undefined', 'Should throw an error when called with an argument that is not a segment.');

                try {
                    path = new g.Path();
                    segment = 1;
                    path.appendSegment(segment);
                } catch (e) {
                    error = e;
                }
                assert.ok(typeof error !== 'undefined', 'Should throw an error when called with an argument that is not a segment.');

                try {
                    path = new g.Path();
                    segment = 'hello';
                    path.appendSegment(segment);
                } catch (e) {
                    error = e;
                }
                assert.ok(typeof error !== 'undefined', 'Should throw an error when called with an argument that is not a segment.');

                try {
                    path = new g.Path();
                    segment = [null, null];
                    path.appendSegment(segment);
                } catch (e) {
                    error = e;
                }
                assert.ok(typeof error !== 'undefined', 'Should throw an error when called with an argument that is not a segment array.');

                try {
                    path = new g.Path();
                    segment = [1, 1];
                    path.appendSegment(segment);
                } catch (e) {
                    error = e;
                }
                assert.ok(typeof error !== 'undefined', 'Should throw an error when called with an argument that is not a segment array.');

                try {
                    path = new g.Path();
                    segment = ['hello', 'hello'];
                    path.appendSegment(segment);
                } catch (e) {
                    error = e;
                }
                assert.ok(typeof error !== 'undefined', 'Should throw an error when called with an argument that is not a segment array.');
            });

            QUnit.test('append a segment', function(assert) {

                var path = new g.Path();
                var segment = g.Path.createSegment('M', 100, 100);
                path.appendSegment(segment);
                assert.equal(path.toString(), 'M 100 100');
            });

            QUnit.test('append a segment array', function(assert) {

                var path = new g.Path();
                var segment = [
                    g.Path.createSegment('M', 100, 100),
                    g.Path.createSegment('L', 200, 200)
                ];
                path.appendSegment(segment);
                assert.equal(path.toString(), 'M 100 100 L 200 200');
            });
        });

        QUnit.module('bbox()', function() {

            QUnit.test('sanity', function(assert) {

                var path;

                path = new g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z');
                assert.ok(path.bbox() instanceof g.Rect);

                path = new g.Path('M 150 100 M 100 200');
                assert.ok(path.bbox() instanceof g.Rect);

                path = new g.Path();
                assert.equal(path.bbox(), null);
            });

            QUnit.test('returns tight bounding box of the path', function(assert) {

                var path;

                path = new g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z');
                assert.equal(path.bbox().toString(), '55.55555555555556@100 150@200');

                path = new g.Path('M 150 100 M 100 200');
                assert.equal(path.bbox().toString(), '100@200 100@200');
            });
        });

        QUnit.module('clone()', function() {

            QUnit.test('sanity', function(assert) {

                var path = new g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z');
                assert.ok(path.clone() instanceof g.Path);
            });

            QUnit.test('returns a clone', function(assert) {

                var path1 = new g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z');
                var path2 = path1.clone();
                assert.notOk(path1 === path2);
                assert.equal(path1.toString(), path2.toString());
                assert.ok(path1.equals(path2));
            });
        });

        QUnit.module('closestPoint()', function() {

            QUnit.test('sanity', function(assert) {

                var path = new g.Path([
                    g.Path.createSegment('M', 100, 100),
                    g.Path.createSegment('L', 150, 200),
                    g.Path.createSegment('L', 200, 100),
                    g.Path.createSegment('C', 200, -200, 100, -200, 100, 100)
                ]);
                var point;

                point = new g.Point(50, 100); // closest to Moveto
                assert.ok(path.closestPoint(point) instanceof g.Point);
                assert.ok(path.closestPoint(point, { precision: 0 }) instanceof g.Point);
                assert.ok(path.closestPoint(point, { precision: 1 }) instanceof g.Point);
                assert.ok(path.closestPoint(point, { precision: 2 }) instanceof g.Point);
                assert.ok(path.closestPoint(point, { precision: 3 }) instanceof g.Point);

                point = new g.Point(150, 100); // equidistant from two segments
                assert.ok(path.closestPoint(point) instanceof g.Point);
                assert.ok(path.closestPoint(point, { precision: 0 }) instanceof g.Point);
                assert.ok(path.closestPoint(point, { precision: 1 }) instanceof g.Point);
                assert.ok(path.closestPoint(point, { precision: 2 }) instanceof g.Point);
                assert.ok(path.closestPoint(point, { precision: 3 }) instanceof g.Point);

                point = new g.Point(130, -200); // aribitrary point closest to last segment
                assert.ok(path.closestPoint(point) instanceof g.Point);
                assert.ok(path.closestPoint(point, { precision: 0 }) instanceof g.Point);
                assert.ok(path.closestPoint(point, { precision: 1 }) instanceof g.Point);
                assert.ok(path.closestPoint(point, { precision: 2 }) instanceof g.Point);
                assert.ok(path.closestPoint(point, { precision: 3 }) instanceof g.Point);
            });

            QUnit.test('returns point closest to a given point up to precision', function(assert) {

                var path = new g.Path([
                    g.Path.createSegment('M', 100, 100),
                    g.Path.createSegment('L', 150, 200),
                    g.Path.createSegment('L', 200, 100),
                    g.Path.createSegment('C', 200, -200, 100, -200, 100, 100)
                ]);
                var point;

                point = new g.Point(50, 100);
                assert.equal(path.closestPoint(point).toString(), '100@100');
                assert.equal(path.closestPoint(point, { precision: 0 }).toString(), '100@100');
                assert.equal(path.closestPoint(point, { precision: 1 }).toString(), '100@100');
                assert.equal(path.closestPoint(point, { precision: 2 }).toString(), '100@100');
                assert.equal(path.closestPoint(point, { precision: 3 }).toString(), '100@100');

                point = new g.Point(150, 100);
                assert.equal(path.closestPoint(point).toString(), '110@120');
                assert.equal(path.closestPoint(point, { precision: 0 }).toString(), '110@120');
                assert.equal(path.closestPoint(point, { precision: 1 }).toString(), '110@120');
                assert.equal(path.closestPoint(point, { precision: 2 }).toString(), '110@120');
                assert.equal(path.closestPoint(point, { precision: 3 }).toString(), '110@120');

                point = new g.Point(130, -200);
                assert.equal(path.closestPoint(point).toString(), '147.65701293945312@-124.7802734375');
                assert.equal(path.closestPoint(point, { precision: 0 }).toString(), '100@100');
                assert.equal(path.closestPoint(point, { precision: 1 }).toString(), '150@-125');
                assert.equal(path.closestPoint(point, { precision: 2 }).toString(), '145.318603515625@-124.12109375');
                assert.equal(path.closestPoint(point, { precision: 3 }).toString(), '147.65701293945312@-124.7802734375');
            });
        });

        QUnit.module('closestPointLength()', function() {

            QUnit.test('sanity', function(assert) {

                var path = new g.Path([
                    g.Path.createSegment('M', 100, 100),
                    g.Path.createSegment('L', 150, 200),
                    g.Path.createSegment('L', 200, 100),
                    g.Path.createSegment('C', 200, -200, 100, -200, 100, 100)
                ]);
                var point;

                point = new g.Point(50, 100);
                assert.equal(typeof path.closestPointLength(point), 'number');
                assert.equal(typeof path.closestPointLength(point, { precision: 0 }), 'number');
                assert.equal(typeof path.closestPointLength(point, { precision: 1 }), 'number');
                assert.equal(typeof path.closestPointLength(point, { precision: 2 }), 'number');
                assert.equal(typeof path.closestPointLength(point, { precision: 3 }), 'number');

                point = new g.Point(150, 100);
                assert.equal(typeof path.closestPointLength(point), 'number');
                assert.equal(typeof path.closestPointLength(point, { precision: 0 }), 'number');
                assert.equal(typeof path.closestPointLength(point, { precision: 1 }), 'number');
                assert.equal(typeof path.closestPointLength(point, { precision: 2 }), 'number');
                assert.equal(typeof path.closestPointLength(point, { precision: 3 }), 'number');

                point = new g.Point(130, -200);
                assert.equal(typeof path.closestPointLength(point), 'number');
                assert.equal(typeof path.closestPointLength(point, { precision: 0 }), 'number');
                assert.equal(typeof path.closestPointLength(point, { precision: 1 }), 'number');
                assert.equal(typeof path.closestPointLength(point, { precision: 2 }), 'number');
                assert.equal(typeof path.closestPointLength(point, { precision: 3 }), 'number');
            });

            QUnit.test('returns length closest to a given point up to precision', function(assert) {

                var path = new g.Path([
                    g.Path.createSegment('M', 100, 100),
                    g.Path.createSegment('L', 150, 200),
                    g.Path.createSegment('L', 200, 100),
                    g.Path.createSegment('C', 200, -200, 100, -200, 100, 100)
                ]);
                var point;

                point = new g.Point(50, 100);
                assert.equal(path.closestPointLength(point), 0);
                assert.equal(path.closestPointLength(point, { precision: 0 }), 0);
                assert.equal(path.closestPointLength(point, { precision: 1 }), 0);
                assert.equal(path.closestPointLength(point, { precision: 2 }), 0);
                assert.equal(path.closestPointLength(point, { precision: 3 }), 0);

                point = new g.Point(150, 100);
                assert.equal(path.closestPointLength(point), 22.360679774997898);
                assert.equal(path.closestPointLength(point, { precision: 0 }), 22.360679774997898);
                assert.equal(path.closestPointLength(point, { precision: 1 }), 22.360679774997898);
                assert.equal(path.closestPointLength(point, { precision: 2 }), 22.360679774997898);
                assert.equal(path.closestPointLength(point, { precision: 3 }), 22.360679774997898);

                point = new g.Point(130, -200);
                assert.equal(path.closestPointLength(point), 465.192182312319);
                assert.equal(path.closestPointLength(point, { precision: 0 }), 0);
                assert.equal(path.closestPointLength(point, { precision: 1 }), 462.84042498930154);
                assert.equal(path.closestPointLength(point, { precision: 2 }), 467.61976852516966);
                assert.equal(path.closestPointLength(point, { precision: 3 }), 465.192182312319);
            });
        });

        QUnit.module('closestPointNormalizedLength()', function() {

            QUnit.test('sanity', function(assert) {

                var path = new g.Path([
                    g.Path.createSegment('M', 100, 100),
                    g.Path.createSegment('L', 150, 200),
                    g.Path.createSegment('L', 200, 100),
                    g.Path.createSegment('C', 200, -200, 100, -200, 100, 100)
                ]);
                var point;

                point = new g.Point(50, 100);
                assert.equal(typeof path.closestPointNormalizedLength(point), 'number');
                assert.equal(typeof path.closestPointNormalizedLength(point, { precision: 0 }), 'number');
                assert.equal(typeof path.closestPointNormalizedLength(point, { precision: 1 }), 'number');
                assert.equal(typeof path.closestPointNormalizedLength(point, { precision: 2 }), 'number');
                assert.equal(typeof path.closestPointNormalizedLength(point, { precision: 3 }), 'number');

                point = new g.Point(150, 100);
                assert.equal(typeof path.closestPointNormalizedLength(point), 'number');
                assert.equal(typeof path.closestPointNormalizedLength(point, { precision: 0 }), 'number');
                assert.equal(typeof path.closestPointNormalizedLength(point, { precision: 1 }), 'number');
                assert.equal(typeof path.closestPointNormalizedLength(point, { precision: 2 }), 'number');
                assert.equal(typeof path.closestPointNormalizedLength(point, { precision: 3 }), 'number');

                point = new g.Point(130, -200);
                assert.equal(typeof path.closestPointNormalizedLength(point), 'number');
                assert.equal(typeof path.closestPointNormalizedLength(point, { precision: 0 }), 'number');
                assert.equal(typeof path.closestPointNormalizedLength(point, { precision: 1 }), 'number');
                assert.equal(typeof path.closestPointNormalizedLength(point, { precision: 2 }), 'number');
                assert.equal(typeof path.closestPointNormalizedLength(point, { precision: 3 }), 'number');
            });

            QUnit.test('returns normalized length closest to a given point up to precision', function(assert) {

                var path = new g.Path([
                    g.Path.createSegment('M', 100, 100),
                    g.Path.createSegment('L', 150, 200),
                    g.Path.createSegment('L', 200, 100),
                    g.Path.createSegment('C', 200, -200, 100, -200, 100, 100)
                ]);
                var point;

                point = new g.Point(50, 100);
                assert.equal(path.closestPointNormalizedLength(point), 0);
                assert.equal(path.closestPointNormalizedLength(point, { precision: 0 }), 0);
                assert.equal(path.closestPointNormalizedLength(point, { precision: 1 }), 0);
                assert.equal(path.closestPointNormalizedLength(point, { precision: 2 }), 0);
                assert.equal(path.closestPointNormalizedLength(point, { precision: 3 }), 0);

                point = new g.Point(150, 100);
                assert.equal(path.closestPointNormalizedLength(point), 0.03184946047217872);
                assert.equal(path.closestPointNormalizedLength(point, { precision: 0 }), 0.06909830056250527);
                assert.equal(path.closestPointNormalizedLength(point, { precision: 1 }), 0.032201701139867325);
                assert.equal(path.closestPointNormalizedLength(point, { precision: 2 }), 0.031877217183882096);
                assert.equal(path.closestPointNormalizedLength(point, { precision: 3 }), 0.03184946047217872);

                point = new g.Point(130, -200);
                assert.equal(path.closestPointNormalizedLength(point), 0.6625970306631321);
                assert.equal(path.closestPointNormalizedLength(point, { precision: 0 }), 0);
                assert.equal(path.closestPointNormalizedLength(point, { precision: 1 }), 0.6665382801832137);
                assert.equal(path.closestPointNormalizedLength(point, { precision: 2 }), 0.6666352307151587);
                assert.equal(path.closestPointNormalizedLength(point, { precision: 3 }), 0.6625970306631321);
            });
        });

        QUnit.module('closestPointT()', function() {

            QUnit.test('sanity', function(assert) {

                var path = new g.Path([
                    g.Path.createSegment('M', 100, 100),
                    g.Path.createSegment('L', 150, 200),
                    g.Path.createSegment('L', 200, 100),
                    g.Path.createSegment('C', 200, -200, 100, -200, 100, 100)
                ]);
                var point;

                point = new g.Point(50, 100);
                assert.equal(typeof path.closestPointT(point), 'object');
                assert.equal(typeof path.closestPointT(point, { precision: 0 }), 'object');
                assert.equal(typeof path.closestPointT(point, { precision: 1 }), 'object');
                assert.equal(typeof path.closestPointT(point, { precision: 2 }), 'object');
                assert.equal(typeof path.closestPointT(point, { precision: 3 }), 'object');

                point = new g.Point(150, 100);
                assert.equal(typeof path.closestPointT(point), 'object');
                assert.equal(typeof path.closestPointT(point, { precision: 0 }), 'object');
                assert.equal(typeof path.closestPointT(point, { precision: 1 }), 'object');
                assert.equal(typeof path.closestPointT(point, { precision: 2 }), 'object');
                assert.equal(typeof path.closestPointT(point, { precision: 3 }), 'object');

                point = new g.Point(130, -200);
                assert.equal(typeof path.closestPointT(point), 'object');
                assert.equal(typeof path.closestPointT(point, { precision: 0 }), 'object');
                assert.equal(typeof path.closestPointT(point, { precision: 1 }), 'object');
                assert.equal(typeof path.closestPointT(point, { precision: 2 }), 'object');
                assert.equal(typeof path.closestPointT(point, { precision: 3 }), 'object');
            });

            QUnit.test('returns t closest to a given point up to precision', function(assert) {

                var path = new g.Path([
                    g.Path.createSegment('M', 100, 100),
                    g.Path.createSegment('L', 150, 200),
                    g.Path.createSegment('L', 200, 100),
                    g.Path.createSegment('C', 200, -200, 100, -200, 100, 100)
                ]);
                var point;

                point = new g.Point(50, 100);
                assert.deepEqual(path.closestPointT(point), { segmentIndex: 1, value: 0 });
                assert.deepEqual(path.closestPointT(point, { precision: 0 }), { segmentIndex: 1, value: 0 });
                assert.deepEqual(path.closestPointT(point, { precision: 1 }), { segmentIndex: 1, value: 0 });
                assert.deepEqual(path.closestPointT(point, { precision: 2 }), { segmentIndex: 1, value: 0 });
                assert.deepEqual(path.closestPointT(point, { precision: 3 }), { segmentIndex: 1, value: 0 });

                point = new g.Point(150, 100);
                assert.deepEqual(path.closestPointT(point), { segmentIndex: 1, value: 0.2 });
                assert.deepEqual(path.closestPointT(point, { precision: 0 }), { segmentIndex: 1, value: 0.2 });
                assert.deepEqual(path.closestPointT(point, { precision: 1 }), { segmentIndex: 1, value: 0.2 });
                assert.deepEqual(path.closestPointT(point, { precision: 2 }), { segmentIndex: 1, value: 0.2 });
                assert.deepEqual(path.closestPointT(point, { precision: 3 }), { segmentIndex: 1, value: 0.2 });

                point = new g.Point(130, -200);
                assert.deepEqual(path.closestPointT(point), { segmentIndex: 3, value: 0.515625 });
                assert.deepEqual(path.closestPointT(point, { precision: 0 }), { segmentIndex: 1, value: 0 });
                assert.deepEqual(path.closestPointT(point, { precision: 1 }), { segmentIndex: 3, value: 0.5 });
                assert.deepEqual(path.closestPointT(point, { precision: 2 }), { segmentIndex: 3, value: 0.53125 });
                assert.deepEqual(path.closestPointT(point, { precision: 3 }), { segmentIndex: 3, value: 0.515625 });
            });
        });

        QUnit.module('closestPointTangent()', function() {

            QUnit.test('sanity', function(assert) {

                var path = new g.Path([
                    g.Path.createSegment('M', 100, 100),
                    g.Path.createSegment('L', 150, 200),
                    g.Path.createSegment('L', 200, 100),
                    g.Path.createSegment('C', 200, -200, 100, -200, 100, 100)
                ]);
                var point;

                point = new g.Point(50, 100);
                assert.ok(path.closestPointTangent(point) instanceof g.Line);
                assert.ok(path.closestPointTangent(point, { precision: 0 }) instanceof g.Line);
                assert.ok(path.closestPointTangent(point, { precision: 1 }) instanceof g.Line);
                assert.ok(path.closestPointTangent(point, { precision: 2 }) instanceof g.Line);
                assert.ok(path.closestPointTangent(point, { precision: 3 }) instanceof g.Line);

                point = new g.Point(150, 100);
                assert.ok(path.closestPointTangent(point) instanceof g.Line);
                assert.ok(path.closestPointTangent(point, { precision: 0 }) instanceof g.Line);
                assert.ok(path.closestPointTangent(point, { precision: 1 }) instanceof g.Line);
                assert.ok(path.closestPointTangent(point, { precision: 2 }) instanceof g.Line);
                assert.ok(path.closestPointTangent(point, { precision: 3 }) instanceof g.Line);

                point = new g.Point(130, -200);
                assert.ok(path.closestPointTangent(point) instanceof g.Line);
                assert.ok(path.closestPointTangent(point, { precision: 0 }) instanceof g.Line);
                assert.ok(path.closestPointTangent(point, { precision: 1 }) instanceof g.Line);
                assert.ok(path.closestPointTangent(point, { precision: 2 }) instanceof g.Line);
                assert.ok(path.closestPointTangent(point, { precision: 3 }) instanceof g.Line);
            });

            QUnit.test('returns tangent at point closest to a given point up to precision', function(assert) {

                var path = new g.Path([
                    g.Path.createSegment('M', 100, 100),
                    g.Path.createSegment('L', 150, 200),
                    g.Path.createSegment('L', 200, 100),
                    g.Path.createSegment('C', 200, -200, 100, -200, 100, 100)
                ]);
                var point;

                point = new g.Point(50, 100);
                assert.equal(path.closestPointTangent(point).toString(), '100@100 150@200');
                assert.equal(path.closestPointTangent(point, { precision: 0 }).toString(), '100@100 150@200');
                assert.equal(path.closestPointTangent(point, { precision: 1 }).toString(), '100@100 150@200');
                assert.equal(path.closestPointTangent(point, { precision: 2 }).toString(), '100@100 150@200');
                assert.equal(path.closestPointTangent(point, { precision: 3 }).toString(), '100@100 150@200');

                point = new g.Point(150, 100);
                assert.equal(path.closestPointTangent(point).toString(), '110@120 160@220');
                assert.equal(path.closestPointTangent(point, { precision: 0 }).toString(), '110@120 160@220');
                assert.equal(path.closestPointTangent(point, { precision: 1 }).toString(), '110@120 160@220');
                assert.equal(path.closestPointTangent(point, { precision: 2 }).toString(), '110@120 160@220');
                assert.equal(path.closestPointTangent(point, { precision: 3 }).toString(), '110@120 160@220');

                point = new g.Point(130, -200);
                assert.equal(path.closestPointTangent(point).toString(), '147.65701293945312@-124.7802734375 97.70584106445312@-115.4052734375');
                assert.equal(path.closestPointTangent(point, { precision: 0 }).toString(), '100@100 150@200');
                assert.equal(path.closestPointTangent(point, { precision: 1 }).toString(), '150@-125 100@-125');
                assert.equal(path.closestPointTangent(point, { precision: 2 }).toString(), '145.318603515625@-124.12109375 95.513916015625@-105.37109375');
                assert.equal(path.closestPointTangent(point, { precision: 3 }).toString(), '147.65701293945312@-124.7802734375 97.70584106445312@-115.4052734375');
            });
        });

        QUnit.module('equals()', function() {

            QUnit.test('checks whether two paths are exactly the same', function(assert) {

                var path1;
                var path2;

                path1 = new g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z');
                path2 = new g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z');
                assert.equal(path1.equals(path2), true);

                path1 = new g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z');
                path2 = new g.Path('M 100 100');
                assert.equal(path1.equals(path2), false);

                path1 = new g.Path();
                path2 = new g.Path();
                assert.equal(path1.equals(path2), true);
            });
        });

        QUnit.module('getSegment()', function() {

            QUnit.test('sanity', function(assert) {

                var path;
                var segment;

                var error;

                try {
                    path = new g.Path();
                    segment = path.getSegment(0);
                } catch (e) {
                    error = e;
                }
                assert.ok(typeof error !== 'undefined', 'Should throw an error when called on an empty path.');

                try {
                    path = new g.Path(g.Path.createSegment('M', 100, 100));
                    segment = path.getSegment(1);
                } catch (e) {
                    error = e;
                }
                assert.ok(typeof error !== 'undefined', 'Should throw an error when called with an index out of range.');

                try {
                    path = new g.Path();
                    segment = path.getSegment(-2);
                } catch (e) {
                    error = e;
                }
                assert.ok(typeof error !== 'undefined', 'Should throw an error when called with a negative index out of range.');

                path = new g.Path([
                    g.Path.createSegment('M', 100, 100),
                    g.Path.createSegment('L', 200, 200)
                ]);
                segment = path.getSegment(0);
                assert.equal(segment.isSegment, true);
                assert.equal(segment.type, 'M');
                assert.ok(segment instanceof g.Path.segmentTypes.M);

                path = new g.Path([
                    g.Path.createSegment('M', 100, 100),
                    g.Path.createSegment('L', 200, 200)
                ]);
                segment = path.getSegment(-1);
                assert.equal(segment.isSegment, true);
                assert.equal(segment.type, 'L');
                assert.ok(segment instanceof g.Path.segmentTypes.L);
            });

            QUnit.test('get a segment', function(assert) {

                var path;
                var segment;

                path = new g.Path([
                    g.Path.createSegment('M', 100, 100),
                    g.Path.createSegment('L', 200, 200)
                ]);
                segment = path.getSegment(0);
                assert.equal(segment.toString(), 'M 100@100');

                path = new g.Path([
                    g.Path.createSegment('M', 100, 100),
                    g.Path.createSegment('L', 200, 200)
                ]);
                segment = path.getSegment(-1);
                assert.equal(segment.toString(), 'L 100@100 200@200');
            });
        });

        QUnit.module('getSegmentSubdivisions()', function() {

            QUnit.test('sanity', function(assert) {

                var path = new g.Path('M 0 0 L 0 100 C 50 200 150 0 200 100');
                assert.equal(Array.isArray(path.getSegmentSubdivisions()), true);
                assert.equal(Array.isArray(path.getSegmentSubdivisions({ precision: 0 })), true);
                assert.equal(Array.isArray(path.getSegmentSubdivisions({ precision: 1 })), true);
                assert.equal(Array.isArray(path.getSegmentSubdivisions({ precision: 2 })), true);
                assert.equal(Array.isArray(path.getSegmentSubdivisions({ precision: 3 })), true);
                assert.equal(Array.isArray(path.getSegmentSubdivisions({ precision: 4 })), true);
                assert.equal(Array.isArray(path.getSegmentSubdivisions({ precision: 5 })), true);
            });

            QUnit.test('returns an array of segment subdivisions', function(assert) {

                var path = new g.Path('M 0 0 L 0 100 C 50 200 150 0 200 100');
                assert.deepEqual(path.getSegmentSubdivisions({ precision: 0 }), [
                    [],
                    [],
                    [
                        new g.Curve(new g.Point(0, 100), new g.Point(50, 200), new g.Point(150, 0), new g.Point(200, 100))
                    ]
                ]);
                assert.deepEqual(path.getSegmentSubdivisions({ precision: 1 }), [
                    [],
                    [],
                    [
                        new g.Curve(new g.Point(0, 100), new g.Point(6.25, 112.5), new g.Point(13.28125, 120.3125), new g.Point(20.8984375, 124.609375)),
                        new g.Curve(new g.Point(20.8984375, 124.609375), new g.Point(28.515625, 128.90625), new g.Point(36.71875, 129.6875), new g.Point(45.3125, 128.125)),
                        new g.Curve(new g.Point(45.3125, 128.125), new g.Point(53.90625, 126.5625), new g.Point(62.890625, 122.65625), new g.Point(72.0703125, 117.578125)),
                        new g.Curve(new g.Point(72.0703125, 117.578125), new g.Point(81.25, 112.5), new g.Point(90.625, 106.25), new g.Point(100, 100)),
                        new g.Curve(new g.Point(100, 100), new g.Point(109.375, 93.75), new g.Point(118.75, 87.5), new g.Point(127.9296875, 82.421875)),
                        new g.Curve(new g.Point(127.9296875, 82.421875), new g.Point(137.109375, 77.34375), new g.Point(146.09375, 73.4375), new g.Point(154.6875, 71.875)),
                        new g.Curve(new g.Point(154.6875, 71.875), new g.Point(163.28125, 70.3125), new g.Point(171.484375, 71.09375), new g.Point(179.1015625, 75.390625)),
                        new g.Curve(new g.Point(179.1015625, 75.390625), new g.Point(186.71875, 79.6875), new g.Point(193.75, 87.5), new g.Point(200, 100))
                    ]
                ]);
                assert.deepEqual(path.getSegmentSubdivisions({ precision: 2 }), [
                    [],
                    [],
                    [
                        new g.Curve(new g.Point(0, 100), new g.Point(3.125, 106.25), new g.Point(6.4453125, 111.328125), new g.Point(9.9365234375, 115.380859375)),
                        new g.Curve(new g.Point(9.9365234375, 115.380859375), new g.Point(13.427734375, 119.43359375), new g.Point(17.08984375, 122.4609375), new g.Point(20.8984375, 124.609375)),
                        new g.Curve(new g.Point(20.8984375, 124.609375), new g.Point(24.70703125, 126.7578125), new g.Point(28.662109375, 128.02734375), new g.Point(32.7392578125, 128.564453125)),
                        new g.Curve(new g.Point(32.7392578125, 128.564453125), new g.Point(36.81640625, 129.1015625), new g.Point(41.015625, 128.90625), new g.Point(45.3125, 128.125)),
                        new g.Curve(new g.Point(45.3125, 128.125), new g.Point(49.609375, 127.34375), new g.Point(54.00390625, 125.9765625), new g.Point(58.4716796875, 124.169921875)),
                        new g.Curve(new g.Point(58.4716796875, 124.169921875), new g.Point(62.939453125, 122.36328125), new g.Point(67.48046875, 120.1171875), new g.Point(72.0703125, 117.578125)),
                        new g.Curve(new g.Point(72.0703125, 117.578125), new g.Point(76.66015625, 115.0390625), new g.Point(81.298828125, 112.20703125), new g.Point(85.9619140625, 109.228515625)),
                        new g.Curve(new g.Point(85.9619140625, 109.228515625), new g.Point(90.625, 106.25), new g.Point(95.3125, 103.125), new g.Point(100, 100)),
                        new g.Curve(new g.Point(100, 100), new g.Point(104.6875, 96.875), new g.Point(109.375, 93.75), new g.Point(114.0380859375, 90.771484375)),
                        new g.Curve(new g.Point(114.0380859375, 90.771484375), new g.Point(118.701171875, 87.79296875), new g.Point(123.33984375, 84.9609375), new g.Point(127.9296875, 82.421875)),
                        new g.Curve(new g.Point(127.9296875, 82.421875), new g.Point(132.51953125, 79.8828125), new g.Point(137.060546875, 77.63671875), new g.Point(141.5283203125, 75.830078125)),
                        new g.Curve(new g.Point(141.5283203125, 75.830078125), new g.Point(145.99609375, 74.0234375), new g.Point(150.390625, 72.65625), new g.Point(154.6875, 71.875)),
                        new g.Curve(new g.Point(154.6875, 71.875), new g.Point(158.984375, 71.09375), new g.Point(163.18359375, 70.8984375), new g.Point(167.2607421875, 71.435546875)),
                        new g.Curve(new g.Point(167.2607421875, 71.435546875), new g.Point(171.337890625, 71.97265625), new g.Point(175.29296875, 73.2421875), new g.Point(179.1015625, 75.390625)),
                        new g.Curve(new g.Point(179.1015625, 75.390625), new g.Point(182.91015625, 77.5390625), new g.Point(186.572265625, 80.56640625), new g.Point(190.0634765625, 84.619140625)),
                        new g.Curve(new g.Point(190.0634765625, 84.619140625), new g.Point(193.5546875, 88.671875), new g.Point(196.875, 93.75), new g.Point(200, 100))
                    ]
                ]);
            });
        });

        QUnit.module('insertSegment()', function() {

            QUnit.test('sanity', function(assert) {

                var path;
                var segment;

                var error;

                try {
                    path = new g.Path(g.Path.createSegment('M', 100, 100));
                    segment = g.Path.createSegment('L', 200, 200);
                    path.insertSegment(2, segment);
                } catch (e) {
                    error = e;
                }
                assert.ok(typeof error !== 'undefined', 'Should throw an error when called with an index out of range.');

                try {
                    path = new g.Path(g.Path.createSegment('M', 100, 100));
                    segment = g.Path.createSegment('L', 200, 200);
                    path.insertSegment(-3, segment);
                } catch (e) {
                    error = e;
                }
                assert.ok(typeof error !== 'undefined', 'Should throw an error when called with a negative index out of range.');

                try {
                    path = new g.Path(g.Path.createSegment('M', 100, 100));
                    segment = null;
                    path.insertSegment(1, segment);
                } catch (e) {
                    error = e;
                }
                assert.ok(typeof error !== 'undefined', 'Should throw an error when called with an argument that is not a segment.');

                try {
                    path = new g.Path(g.Path.createSegment('M', 100, 100));
                    segment = 1;
                    path.insertSegment(1, segment);
                } catch (e) {
                    error = e;
                }
                assert.ok(typeof error !== 'undefined', 'Should throw an error when called with an argument that is not a segment.');

                try {
                    path = new g.Path(g.Path.createSegment('M', 100, 100));
                    segment = 'hello';
                    path.insertSegment(1, segment);
                } catch (e) {
                    error = e;
                }
                assert.ok(typeof error !== 'undefined', 'Should throw an error when called with an argument that is not a segment.');

                try {
                    path = new g.Path(g.Path.createSegment('M', 100, 100));
                    segment = [null, null];
                    path.insertSegment(1, segment);
                } catch (e) {
                    error = e;
                }
                assert.ok(typeof error !== 'undefined', 'Should throw an error when called with an argument that is not a segment array.');

                try {
                    path = new g.Path(g.Path.createSegment('M', 100, 100));
                    segment = [1, 1];
                    path.insertSegment(1, segment);
                } catch (e) {
                    error = e;
                }
                assert.ok(typeof error !== 'undefined', 'Should throw an error when called with an argument that is not a segment array.');

                try {
                    path = new g.Path(g.Path.createSegment('M', 100, 100));
                    segment = ['hello', 'hello'];
                    path.insertSegment(1, segment);
                } catch (e) {
                    error = e;
                }
                assert.ok(typeof error !== 'undefined', 'Should throw an error when called with an argument that is not a segment array.');
            });

            QUnit.test('insert a segment', function(assert) {

                var path;
                var segment;

                path = new g.Path();
                segment = g.Path.createSegment('M', 100, 100);
                path.insertSegment(0, segment);
                assert.equal(path.toString(), 'M 100 100');

                path = new g.Path(g.Path.createSegment('M', 100, 100));
                segment = g.Path.createSegment('L', 200, 200);
                path.insertSegment(1, segment);
                assert.equal(path.toString(), 'M 100 100 L 200 200');
                assert.equal(path.getSegment(1).start.toString(), '100@100');

                path = new g.Path(g.Path.createSegment('M', 100, 100));
                segment = g.Path.createSegment('L', 200, 200);
                path.insertSegment(-1, segment);
                assert.equal(path.toString(), 'M 100 100 L 200 200');
                assert.equal(path.getSegment(-1).start.toString(), '100@100');

                path = new g.Path(g.Path.createSegment('L', 200, 200));
                segment = g.Path.createSegment('M', 100, 100);
                path.insertSegment(0, segment);
                assert.equal(path.toString(), 'M 100 100 L 200 200');
                assert.equal(path.getSegment(1).start.toString(), '100@100');

                path = new g.Path(g.Path.createSegment('L', 200, 200));
                segment = g.Path.createSegment('M', 100, 100);
                path.insertSegment(-2, segment);
                assert.equal(path.toString(), 'M 100 100 L 200 200');
                assert.equal(path.getSegment(-1).start.toString(), '100@100');

                path = new g.Path([
                    g.Path.createSegment('M', 100, 100),
                    g.Path.createSegment('L', 200, 200),
                    g.Path.createSegment('L', 400, 400),
                    g.Path.createSegment('Z')
                ]);
                segment = g.Path.createSegment('M', 300, 300);
                path.insertSegment(2, segment);
                assert.equal(path.toString(), 'M 100 100 L 200 200 M 300 300 L 400 400 Z');
                assert.equal(path.getSegment(3).start.toString(), '300@300');
                assert.equal(path.getSegment(4).end.toString(), '300@300');

                path = new g.Path([
                    g.Path.createSegment('M', 100, 100),
                    g.Path.createSegment('L', 200, 200),
                    g.Path.createSegment('L', 400, 400),
                    g.Path.createSegment('Z')
                ]);
                segment = g.Path.createSegment('M', 300, 300);
                path.insertSegment(-3, segment);
                assert.equal(path.toString(), 'M 100 100 L 200 200 M 300 300 L 400 400 Z');
                assert.equal(path.getSegment(-2).start.toString(), '300@300');
                assert.equal(path.getSegment(-1).end.toString(), '300@300');
            });

            QUnit.test('insert a segment array', function(assert) {

                var path;
                var segment;

                path = new g.Path();
                segment = [
                    g.Path.createSegment('M', 100, 100),
                    g.Path.createSegment('L', 200, 200)
                ];
                path.insertSegment(0, segment);
                assert.equal(path.toString(), 'M 100 100 L 200 200');

                path = new g.Path(g.Path.createSegment('M', 100, 100));
                segment = [
                    g.Path.createSegment('L', 200, 200),
                    g.Path.createSegment('L', 300, 300)
                ];
                path.insertSegment(1, segment);
                assert.equal(path.toString(), 'M 100 100 L 200 200 L 300 300');
                assert.equal(path.getSegment(1).start.toString(), '100@100');

                path = new g.Path(g.Path.createSegment('M', 100, 100));
                segment = [
                    g.Path.createSegment('L', 200, 200),
                    g.Path.createSegment('L', 300, 300)
                ];
                path.insertSegment(-1, segment);
                assert.equal(path.toString(), 'M 100 100 L 200 200 L 300 300');
                assert.equal(path.getSegment(-2).start.toString(), '100@100');

                path = new g.Path(g.Path.createSegment('L', 300, 300));
                segment = [
                    g.Path.createSegment('M', 100, 100),
                    g.Path.createSegment('L', 200, 200)
                ];
                path.insertSegment(0, segment);
                assert.equal(path.toString(), 'M 100 100 L 200 200 L 300 300');
                assert.equal(path.getSegment(2).start.toString(), '200@200');

                path = new g.Path(g.Path.createSegment('L', 300, 300));
                segment = [
                    g.Path.createSegment('M', 100, 100),
                    g.Path.createSegment('L', 200, 200)
                ];
                path.insertSegment(-2, segment);
                assert.equal(path.toString(), 'M 100 100 L 200 200 L 300 300');
                assert.equal(path.getSegment(-1).start.toString(), '200@200');

                path = new g.Path([
                    g.Path.createSegment('M', 100, 100),
                    g.Path.createSegment('L', 200, 200),
                    g.Path.createSegment('L', 500, 500),
                    g.Path.createSegment('Z')
                ]);
                segment = [
                    g.Path.createSegment('M', 300, 300),
                    g.Path.createSegment('L', 400, 400)
                ];
                path.insertSegment(2, segment);
                assert.equal(path.toString(), 'M 100 100 L 200 200 M 300 300 L 400 400 L 500 500 Z');
                assert.equal(path.getSegment(4).start.toString(), '400@400');
                assert.equal(path.getSegment(5).end.toString(), '300@300');

                path = new g.Path([
                    g.Path.createSegment('M', 100, 100),
                    g.Path.createSegment('L', 200, 200),
                    g.Path.createSegment('L', 500, 500),
                    g.Path.createSegment('Z')
                ]);
                segment = [
                    g.Path.createSegment('M', 300, 300),
                    g.Path.createSegment('L', 400, 400)
                ];
                path.insertSegment(-3, segment);
                assert.equal(path.toString(), 'M 100 100 L 200 200 M 300 300 L 400 400 L 500 500 Z');
                assert.equal(path.getSegment(-2).start.toString(), '400@400');
                assert.equal(path.getSegment(-1).end.toString(), '300@300');
            });
        });

        QUnit.module('isDifferentiable()', function() {

            QUnit.test('sanity', function(assert) {

                var path;

                path = new g.Path();
                assert.equal(typeof path.isDifferentiable(), 'boolean');

                path = new g.Path([
                    g.Path.createSegment('M', 100, 100)
                ]);
                assert.equal(typeof path.isDifferentiable(), 'boolean');

                path = new g.Path([
                    g.Path.createSegment('M', 100, 100),
                    g.Path.createSegment('M', 200, 200),
                    g.Path.createSegment('M', 300, 100)
                ]);
                assert.equal(typeof path.isDifferentiable(), 'boolean');

                path = new g.Path([
                    g.Path.createSegment('L', 100, 100),
                ]);
                assert.equal(typeof path.isDifferentiable(), 'boolean');

                path = new g.Path([
                    g.Path.createSegment('L', 100, 100),
                    g.Path.createSegment('L', 200, 200),
                    g.Path.createSegment('L', 300, 100)
                ]);
                assert.equal(typeof path.isDifferentiable(), 'boolean');

                path = new g.Path([
                    g.Path.createSegment('M', 100, 100),
                    g.Path.createSegment('L', 200, 200),
                ]);
                assert.equal(typeof path.isDifferentiable(), 'boolean');

                path = new g.Path([
                    g.Path.createSegment('M', 100, 100),
                    g.Path.createSegment('C', 100, 200, 200, 200, 200, 100),
                ]);
                assert.equal(typeof path.isDifferentiable(), 'boolean');

                path = new g.Path([
                    g.Path.createSegment('M', 100, 100),
                    g.Path.createSegment('L', 100, 100),
                ]);
                assert.equal(typeof path.isDifferentiable(), 'boolean');

                path = new g.Path([
                    g.Path.createSegment('M', 100, 100),
                    g.Path.createSegment('C', 100, 100, 100, 100, 100, 100),
                ]);
                assert.equal(typeof path.isDifferentiable(), 'boolean');

                path = new g.Path([
                    g.Path.createSegment('M', 100, 100),
                    g.Path.createSegment('Z'),
                ]);
                assert.equal(typeof path.isDifferentiable(), 'boolean');
            });

            QUnit.test('checks whether the path is differentiable (can have tangents)', function(assert) {

                var path;

                path = new g.Path();
                assert.equal(path.isDifferentiable(), false);

                path = new g.Path([
                    g.Path.createSegment('M', 100, 100)
                ]);
                assert.equal(path.isDifferentiable(), false);

                path = new g.Path([
                    g.Path.createSegment('M', 100, 100),
                    g.Path.createSegment('M', 200, 200),
                    g.Path.createSegment('M', 300, 100)
                ]);
                assert.equal(path.isDifferentiable(), false);

                path = new g.Path([
                    g.Path.createSegment('L', 100, 100),
                ]);
                assert.equal(path.isDifferentiable(), false);

                path = new g.Path([
                    g.Path.createSegment('L', 100, 100),
                    g.Path.createSegment('L', 200, 200),
                    g.Path.createSegment('L', 300, 100)
                ]);
                assert.equal(path.isDifferentiable(), true);

                path = new g.Path([
                    g.Path.createSegment('M', 100, 100),
                    g.Path.createSegment('L', 200, 200),
                ]);
                assert.equal(path.isDifferentiable(), true);

                path = new g.Path([
                    g.Path.createSegment('M', 100, 100),
                    g.Path.createSegment('C', 100, 200, 200, 200, 200, 100),
                ]);
                assert.equal(path.isDifferentiable(), true);

                path = new g.Path([
                    g.Path.createSegment('M', 100, 100),
                    g.Path.createSegment('L', 100, 100),
                ]);
                assert.equal(path.isDifferentiable(), false);

                path = new g.Path([
                    g.Path.createSegment('M', 100, 100),
                    g.Path.createSegment('C', 100, 100, 100, 100, 100, 100),
                ]);
                assert.equal(path.isDifferentiable(), false);

                path = new g.Path([
                    g.Path.createSegment('M', 100, 100),
                    g.Path.createSegment('Z'),
                ]);
                assert.equal(path.isDifferentiable(), false);
            });
        });

        QUnit.module('isValid()', function() {

            QUnit.test('sanity', function(assert) {

                var path;

                path = new g.Path();
                assert.equal(typeof path.isValid(), 'boolean');

                path = new g.Path(g.Path.createSegment('M', 100, 100));
                assert.equal(typeof path.isValid(), 'boolean');

                path = new g.Path(g.Path.createSegment('L', 100, 100));
                assert.equal(typeof path.isValid(), 'boolean');

                path = new g.Path(g.Path.createSegment('C', 100, 110, 110, 110, 110, 100));
                assert.equal(typeof path.isValid(), 'boolean');

                path = new g.Path(g.Path.createSegment('Z'));
                assert.equal(typeof path.isValid(), 'boolean');
            });

            QUnit.test('check if path is valid', function(assert) {

                var path;

                path = new g.Path();
                assert.equal(path.isValid(), true);

                path = new g.Path(g.Path.createSegment('M', 100, 100));
                assert.equal(path.isValid(), true);

                path = new g.Path(g.Path.createSegment('L', 100, 100));
                assert.equal(path.isValid(), false);

                path = new g.Path(g.Path.createSegment('C', 100, 110, 110, 110, 110, 100));
                assert.equal(path.isValid(), false);

                path = new g.Path(g.Path.createSegment('Z'));
                assert.equal(path.isValid(), false);
            });
        });

        QUnit.module('length()', function() {

            QUnit.test('sanity', function(assert) {

                var path;

                path = new g.Path();
                assert.equal(typeof path.length(), 'number');
                assert.equal(typeof path.length({ precision: 0 }), 'number');

                path = new g.Path('M 0 0');
                assert.equal(typeof path.length(), 'number');
                assert.equal(typeof path.length({ precision: 0 }), 'number');

                path = new g.Path('M 0 0 M 100 0');
                assert.equal(typeof path.length(), 'number');
                assert.equal(typeof path.length({ precision: 0 }), 'number');

                path = new g.Path('M 0 0 C 0 200 200 200 200 0');
                assert.equal(typeof path.length(), 'number');
                assert.equal(typeof path.length({ precision: 0 }), 'number');
                assert.equal(typeof path.length({ precision: 1 }), 'number');
                assert.equal(typeof path.length({ precision: 2 }), 'number');
                assert.equal(typeof path.length({ precision: 3 }), 'number');
                assert.equal(typeof path.length({ precision: 4 }), 'number');
                assert.equal(typeof path.length({ precision: 5 }), 'number');

                path = new g.Path('M 0 0 L 100 0');
                assert.equal(typeof path.length(), 'number');
                assert.equal(typeof path.length({ precision: 0 }), 'number');

                path = new g.Path('M 0 0 L 100 0 Z');
                assert.equal(typeof path.length(), 'number');
                assert.equal(typeof path.length({ precision: 0 }), 'number');

                path = new g.Path('M 0 0 Z');
                assert.equal(typeof path.length(), 'number');
                assert.equal(typeof path.length({ precision: 0 }), 'number');
            });

            QUnit.test('returns the length of the path up to precision', function(assert) {

                var path;

                path = new g.Path();
                assert.equal(path.length(), 0);
                assert.equal(path.length({ precision: 0 }), 0);

                path = new g.Path('M 0 0');
                assert.equal(path.length(), 0);
                assert.equal(path.length({ precision: 0 }), 0);

                path = new g.Path('M 0 0 M 100 0');
                assert.equal(path.length(), 0);
                assert.equal(path.length({ precision: 0 }), 0);

                path = new g.Path('M 0 0 C 0 200 200 200 200 0');
                assert.equal(path.length(), 399.96164987703463);
                assert.equal(path.length({ precision: 0 }), 200);
                assert.equal(path.length({ precision: 1 }), 390.1438222301384);
                assert.equal(path.length({ precision: 2 }), 399.38625336882194);
                assert.equal(path.length({ precision: 3 }), 399.96164987703463);
                assert.equal(path.length({ precision: 4 }), 399.99041258236997);
                assert.equal(path.length({ precision: 5 }), 399.9994007886072);

                path = new g.Path('M 0 0 L 100 0');
                assert.equal(path.length(), 100);
                assert.equal(path.length({ precision: 0 }), 100);

                path = new g.Path('M 0 0 L 100 0 Z');
                assert.equal(path.length(), 200);
                assert.equal(path.length({ precision: 0 }), 200);

                path = new g.Path('M 0 0 Z');
                assert.equal(path.length(), 0);
                assert.equal(path.length({ precision: 0 }), 0);
            });

            QUnit.test('compare to segment parent functions', function(assert) {

                var path;

                var curve = new g.Curve('0 0', '0 200', '200 200', '200 0');
                path = new g.Path('M 0 0 C 0 200 200 200 200 0');
                assert.equal(path.length(), curve.length());

                var line = new g.Line('0 0', '100 0');
                path = new g.Path('M 0 0 L 100 0');
                assert.equal(path.length(), line.length());
            });

            QUnit.test('compare to browser implementation', function(assert) {

                var svg = getSvg();

                var gPath = new g.Path('M 0 0 C 0 200 200 200 200 0');
                var path = V('path', { d: gPath.serialize(), stroke: 'green', fill: 'none' });
                svg.append(path);

                assert.equal(Math.round(gPath.length({ precision: 3 })), Math.round(path.node.getTotalLength()));

                svg.remove();
            });
        });

        QUnit.module('lengthAtT()', function() {

        });

        QUnit.module('pointAt()', function() {

            QUnit.test('sanity', function(assert) {

                var path;

                path = new g.Path();
                assert.equal(path.pointAt(0.4), null);
                assert.equal(path.pointAt(0.4, { precision: 0 }), null);

                path = new g.Path('M 0 0');
                assert.ok(path.pointAt(0.4) instanceof g.Point);
                assert.ok(path.pointAt(0.4, { precision: 0 }) instanceof g.Point);

                assert.ok(path.pointAt(-1) instanceof g.Point);
                assert.ok(path.pointAt(10) instanceof g.Point);

                path = new g.Path('M 0 0 M 100 0');
                assert.ok(path.pointAt(0.4) instanceof g.Point);
                assert.ok(path.pointAt(0.4, { precision: 0 }) instanceof g.Point);

                assert.ok(path.pointAt(-1) instanceof g.Point);
                assert.ok(path.pointAt(10) instanceof g.Point);

                path = new g.Path('M 0 0 C 0 200 200 200 200 0');
                assert.ok(path.pointAt(0.4) instanceof g.Point);
                assert.ok(path.pointAt(0.4, { precision: 0 }) instanceof g.Point);
                assert.ok(path.pointAt(0.4, { precision: 1 }) instanceof g.Point);
                assert.ok(path.pointAt(0.4, { precision: 2 }) instanceof g.Point);
                assert.ok(path.pointAt(0.4, { precision: 3 }) instanceof g.Point);
                assert.ok(path.pointAt(0.4, { precision: 4 }) instanceof g.Point);
                assert.ok(path.pointAt(0.4, { precision: 5 }) instanceof g.Point);

                assert.ok(path.pointAt(-1) instanceof g.Point);
                assert.ok(path.pointAt(10) instanceof g.Point);

                path = new g.Path('M 0 0 L 100 0');
                assert.ok(path.pointAt(0.4) instanceof g.Point);
                assert.ok(path.pointAt(0.4, { precision: 0 }) instanceof g.Point);

                assert.ok(path.pointAt(-1) instanceof g.Point);
                assert.ok(path.pointAt(10) instanceof g.Point);

                path = new g.Path('M 0 0 L 100 0 Z');
                assert.ok(path.pointAt(0.4) instanceof g.Point);
                assert.ok(path.pointAt(0.4, { precision: 0 }) instanceof g.Point);

                assert.ok(path.pointAt(-1) instanceof g.Point);
                assert.ok(path.pointAt(10) instanceof g.Point);

                path = new g.Path('M 0 0 Z');
                assert.ok(path.pointAt(0.4) instanceof g.Point);
                assert.ok(path.pointAt(0.4, { precision: 0 }) instanceof g.Point);

                assert.ok(path.pointAt(-1) instanceof g.Point);
                assert.ok(path.pointAt(10) instanceof g.Point);
            });

            QUnit.test('returns a point at given length ratio up to precision', function(assert) {

                var path;

                path = new g.Path('M 0 0');
                assert.equal(path.pointAt(0.4).toString(), '0@0');
                assert.equal(path.pointAt(0.4, { precision: 0 }).toString(), '0@0');

                assert.equal(path.pointAt(-1).toString(), '0@0');
                assert.equal(path.pointAt(10).toString(), '0@0');

                path = new g.Path('M 0 0 M 100 0');
                assert.equal(path.pointAt(0.4).toString(), '100@0');
                assert.equal(path.pointAt(0.4, { precision: 0 }).toString(), '100@0');

                assert.equal(path.pointAt(-1).toString(), '100@0');
                assert.equal(path.pointAt(10).toString(), '100@0');

                path = new g.Path('M 0 0 C 0 200 200 200 200 0');
                assert.equal(path.pointAt(0.4).toString(), '61.63853108882904@139.72549438476562');
                assert.equal(path.pointAt(0.4, { precision: 0 }).toString(), '0@0');
                assert.equal(path.pointAt(0.4, { precision: 1 }).toString(), '100@150');
                assert.equal(path.pointAt(0.4, { precision: 2 }).toString(), '63.28125@140.625');
                assert.equal(path.pointAt(0.4, { precision: 3 }).toString(), '61.63853108882904@139.72549438476562');
                assert.equal(path.pointAt(0.4, { precision: 4 }).toString(), '61.775019159540534@139.80202674865723');
                assert.equal(path.pointAt(0.4, { precision: 5 }).toString(), '61.775019159540534@139.80202674865723');

                assert.equal(path.pointAt(-1).toString(), '0@0');
                assert.equal(path.pointAt(10).toString(), '200@0');

                path = new g.Path('M 0 0 L 100 0');
                assert.equal(path.pointAt(0.4).toString(), '40@0');
                assert.equal(path.pointAt(0.4, { precision: 0 }).toString(), '40@0');

                assert.equal(path.pointAt(-1).toString(), '0@0');
                assert.equal(path.pointAt(10).toString(), '100@0');

                path = new g.Path('M 0 0 L 100 0 Z');
                assert.equal(path.pointAt(0.6).toString(), '80@0');
                assert.equal(path.pointAt(0.6, { precision: 0 }).toString(), '80@0');

                assert.equal(path.pointAt(-1).toString(), '0@0');
                assert.equal(path.pointAt(10).toString(), '0@0');

                path = new g.Path('M 0 0 Z');
                assert.equal(path.pointAt(0.4).toString(), '0@0');
                assert.equal(path.pointAt(0.4, { precision: 0 }).toString(), '0@0');

                assert.equal(path.pointAt(-1).toString(), '0@0');
                assert.equal(path.pointAt(10).toString(), '0@0');
            });

            QUnit.test('compare to segment parent functions', function(assert) {

                var path;

                var curve = new g.Curve('0 0', '0 200', '200 200', '200 0');
                path = new g.Path('M 0 0 C 0 200 200 200 200 0');
                assert.equal(path.pointAt(0.4).toString(), curve.pointAt(0.4).toString());
                assert.equal(path.pointAt(0.4, { precision: 0 }).toString(), curve.pointAt(0.4, { precision: 0 }).toString());
                assert.equal(path.pointAt(0.4, { precision: 1 }).toString(), curve.pointAt(0.4, { precision: 1 }).toString());
                assert.equal(path.pointAt(0.4, { precision: 2 }).toString(), curve.pointAt(0.4, { precision: 2 }).toString());
                assert.equal(path.pointAt(0.4, { precision: 3 }).toString(), curve.pointAt(0.4, { precision: 3 }).toString());
                assert.equal(path.pointAt(0.4, { precision: 4 }).toString(), curve.pointAt(0.4, { precision: 4 }).toString());
                assert.equal(path.pointAt(0.4, { precision: 5 }).toString(), curve.pointAt(0.4, { precision: 5 }).toString());

                assert.equal(path.pointAt(-1).toString(), curve.pointAt(-1).toString());
                assert.equal(path.pointAt(10).toString(), curve.pointAt(10).toString());

                var line = new g.Line('0 0', '100 0');
                path = new g.Path('M 0 0 L 100 0');
                assert.equal(path.pointAt(0.4).toString(), line.pointAt(0.4).toString());
                assert.equal(path.pointAt(0.4, { precision: 0 }).toString(), line.pointAt(0.4, { precision: 0 }).toString());

                assert.equal(path.pointAt(-1).toString(), line.pointAt(-1).toString());
                assert.equal(path.pointAt(10).toString(), line.pointAt(10).toString());
            });
        });

        QUnit.module('pointAtLength()', function() {

            QUnit.test('sanity', function(assert) {

                var path;

                path = new g.Path('M 0 0');
                assert.ok(path.pointAtLength(40) instanceof g.Point);
                assert.ok(path.pointAtLength(40, { precision: 0 }) instanceof g.Point);
                assert.ok(path.pointAtLength(10000) instanceof g.Point);

                assert.ok(path.pointAtLength(-40) instanceof g.Point);
                assert.ok(path.pointAtLength(-40, { precision: 0 }) instanceof g.Point);
                assert.ok(path.pointAtLength(-10000) instanceof g.Point);

                path = new g.Path('M 0 0 M 100 0');
                assert.ok(path.pointAtLength(40) instanceof g.Point);
                assert.ok(path.pointAtLength(40, { precision: 0 }) instanceof g.Point);
                assert.ok(path.pointAtLength(10000) instanceof g.Point);

                assert.ok(path.pointAtLength(-40) instanceof g.Point);
                assert.ok(path.pointAtLength(-40, { precision: 0 }) instanceof g.Point);
                assert.ok(path.pointAtLength(-10000) instanceof g.Point);

                path = new g.Path('M 0 0 C 0 200 200 200 200 0');
                assert.ok(path.pointAtLength(250) instanceof g.Point);
                assert.ok(path.pointAtLength(250, { precision: 0 }) instanceof g.Point);
                assert.ok(path.pointAtLength(250, { precision: 1 }) instanceof g.Point);
                assert.ok(path.pointAtLength(250, { precision: 2 }) instanceof g.Point);
                assert.ok(path.pointAtLength(250, { precision: 3 }) instanceof g.Point);
                assert.ok(path.pointAtLength(250, { precision: 4 }) instanceof g.Point);
                assert.ok(path.pointAtLength(250, { precision: 5 }) instanceof g.Point);
                assert.ok(path.pointAtLength(10000) instanceof g.Point);

                assert.ok(path.pointAtLength(-250) instanceof g.Point);
                assert.ok(path.pointAtLength(-250, { precision: 0 }) instanceof g.Point);
                assert.ok(path.pointAtLength(-250, { precision: 1 }) instanceof g.Point);
                assert.ok(path.pointAtLength(-250, { precision: 2 }) instanceof g.Point);
                assert.ok(path.pointAtLength(-250, { precision: 3 }) instanceof g.Point);
                assert.ok(path.pointAtLength(-250, { precision: 4 }) instanceof g.Point);
                assert.ok(path.pointAtLength(-250, { precision: 5 }) instanceof g.Point);
                assert.ok(path.pointAtLength(-10000) instanceof g.Point);

                path = new g.Path('M 0 0 L 100 0');
                assert.ok(path.pointAtLength(40) instanceof g.Point);
                assert.ok(path.pointAtLength(40, { precision: 0 }) instanceof g.Point);
                assert.ok(path.pointAtLength(10000) instanceof g.Point);

                assert.ok(path.pointAtLength(-40) instanceof g.Point);
                assert.ok(path.pointAtLength(-40, { precision: 0 }) instanceof g.Point);
                assert.ok(path.pointAtLength(-10000) instanceof g.Point);

                path = new g.Path('M 0 0 L 100 0 Z');
                assert.ok(path.pointAtLength(150) instanceof g.Point);
                assert.ok(path.pointAtLength(150, { precision: 0 }) instanceof g.Point);
                assert.ok(path.pointAtLength(10000) instanceof g.Point);

                assert.ok(path.pointAtLength(-150) instanceof g.Point);
                assert.ok(path.pointAtLength(-150, { precision: 0 }) instanceof g.Point);
                assert.ok(path.pointAtLength(-10000) instanceof g.Point);

                path = new g.Path('M 0 0 Z');
                assert.ok(path.pointAtLength(40) instanceof g.Point);
                assert.ok(path.pointAtLength(40, { precision: 0 }) instanceof g.Point);
                assert.ok(path.pointAtLength(10000) instanceof g.Point);

                assert.ok(path.pointAtLength(-40) instanceof g.Point);
                assert.ok(path.pointAtLength(-40, { precision: 0 }) instanceof g.Point);
                assert.ok(path.pointAtLength(-10000) instanceof g.Point);
            });

            QUnit.test('returns a point at given length up to precision', function(assert) {

                var path;

                path = new g.Path('M 0 0');
                assert.equal(path.pointAtLength(40).toString(), '0@0');
                assert.equal(path.pointAtLength(40, { precision: 0 }).toString(), '0@0');
                assert.equal(path.pointAtLength(10000).toString(), '0@0');

                assert.equal(path.pointAtLength(-40).toString(), '0@0');
                assert.equal(path.pointAtLength(-40, { precision: 0 }).toString(), '0@0');
                assert.equal(path.pointAtLength(-10000).toString(), '0@0');

                path = new g.Path('M 0 0 M 100 0');
                assert.equal(path.pointAtLength(40).toString(), '100@0');
                assert.equal(path.pointAtLength(40, { precision: 0 }).toString(), '100@0');
                assert.equal(path.pointAtLength(10000).toString(), '100@0');

                assert.equal(path.pointAtLength(-40).toString(), '100@0');
                assert.equal(path.pointAtLength(-40, { precision: 0 }).toString(), '100@0');
                assert.equal(path.pointAtLength(-10000).toString(), '100@0');

                path = new g.Path('M 0 0 C 0 200 200 200 200 0');
                assert.equal(path.pointAtLength(250).toString(), '146.40367031097412@134.6099853515625');
                assert.equal(path.pointAtLength(250, { precision: 0 }).toString(), '200@0');
                assert.equal(path.pointAtLength(250, { precision: 1 }).toString(), '168.75@112.5');
                assert.equal(path.pointAtLength(250, { precision: 2 }).toString(), '145.34912109375@135.3515625');
                assert.equal(path.pointAtLength(250, { precision: 3 }).toString(), '146.40367031097412@134.6099853515625');
                assert.equal(path.pointAtLength(250, { precision: 4 }).toString(), '146.66639678180218@134.4217300415039');
                assert.equal(path.pointAtLength(250, { precision: 5 }).toString(), '146.65819215043712@134.42763034254313');
                assert.equal(path.pointAtLength(10000).toString(), '200@0');

                assert.equal(path.pointAtLength(-250).toString(), '53.59632968902588@134.6099853515625');
                assert.equal(path.pointAtLength(-250, { precision: 0 }).toString(), '0@0');
                assert.equal(path.pointAtLength(-250, { precision: 1 }).toString(), '31.25@112.5');
                assert.equal(path.pointAtLength(-250, { precision: 2 }).toString(), '54.65087890625@135.3515625');
                assert.equal(path.pointAtLength(-250, { precision: 3 }).toString(), '53.59632968902588@134.6099853515625');
                assert.equal(path.pointAtLength(-250, { precision: 4 }).toString(), '53.33360321819782@134.4217300415039');
                assert.equal(path.pointAtLength(-250, { precision: 5 }).toString(), '53.34180784956288@134.42763034254313');
                assert.equal(path.pointAtLength(-10000).toString(), '0@0');

                path = new g.Path('M 0 0 L 100 0');
                assert.equal(path.pointAtLength(40).toString(), '40@0');
                assert.equal(path.pointAtLength(40, { precision: 0 }).toString(), '40@0');
                assert.equal(path.pointAtLength(10000).toString(), '100@0');

                assert.equal(path.pointAtLength(-40).toString(), '60@0');
                assert.equal(path.pointAtLength(-40, { precision: 0 }).toString(), '60@0');
                assert.equal(path.pointAtLength(-10000).toString(), '0@0');

                path = new g.Path('M 0 0 L 100 0 Z');
                assert.equal(path.pointAtLength(150).toString(), '50@0');
                assert.equal(path.pointAtLength(150, { precision: 0 }).toString(), '50@0');
                assert.equal(path.pointAtLength(10000).toString(), '0@0');

                assert.equal(path.pointAtLength(-150).toString(), '50@0');
                assert.equal(path.pointAtLength(-150, { precision: 0 }).toString(), '50@0');
                assert.equal(path.pointAtLength(-10000).toString(), '0@0');

                path = new g.Path('M 0 0 Z');
                assert.equal(path.pointAtLength(40).toString(), '0@0');
                assert.equal(path.pointAtLength(40, { precision: 0 }).toString(), '0@0');
                assert.equal(path.pointAtLength(10000).toString(), '0@0');

                assert.equal(path.pointAtLength(-40).toString(), '0@0');
                assert.equal(path.pointAtLength(-40, { precision: 0 }).toString(), '0@0');
                assert.equal(path.pointAtLength(-10000).toString(), '0@0');
            });

            QUnit.test('compare to segment parent functions', function(assert) {

                var path;

                var curve = new g.Curve('0 0', '0 200', '200 200', '200 0');
                path = new g.Path('M 0 0 C 0 200 200 200 200 0');
                assert.equal(path.pointAtLength(250).toString(), curve.pointAtLength(250).toString());
                assert.equal(path.pointAtLength(250, { precision: 0 }).toString(), curve.pointAtLength(250, { precision: 0 }).toString());
                assert.equal(path.pointAtLength(250, { precision: 1 }).toString(), curve.pointAtLength(250, { precision: 1 }).toString());
                assert.equal(path.pointAtLength(250, { precision: 2 }).toString(), curve.pointAtLength(250, { precision: 2 }).toString());
                assert.equal(path.pointAtLength(250, { precision: 3 }).toString(), curve.pointAtLength(250, { precision: 3 }).toString());
                assert.equal(path.pointAtLength(250, { precision: 4 }).toString(), curve.pointAtLength(250, { precision: 4 }).toString());
                assert.equal(path.pointAtLength(250, { precision: 5 }).toString(), curve.pointAtLength(250, { precision: 5 }).toString());
                assert.equal(path.pointAtLength(10000).toString(), curve.pointAtLength(10000).toString());

                assert.equal(path.pointAtLength(-250).toString(), curve.pointAtLength(-250).toString());
                assert.equal(path.pointAtLength(-250, { precision: 0 }).toString(), curve.pointAtLength(-250, { precision: 0 }).toString());
                assert.equal(path.pointAtLength(-250, { precision: 1 }).toString(), curve.pointAtLength(-250, { precision: 1 }).toString());
                assert.equal(path.pointAtLength(-250, { precision: 2 }).toString(), curve.pointAtLength(-250, { precision: 2 }).toString());
                assert.equal(path.pointAtLength(-250, { precision: 3 }).toString(), curve.pointAtLength(-250, { precision: 3 }).toString());
                assert.equal(path.pointAtLength(-250, { precision: 4 }).toString(), curve.pointAtLength(-250, { precision: 4 }).toString());
                assert.equal(path.pointAtLength(-250, { precision: 5 }).toString(), curve.pointAtLength(-250, { precision: 5 }).toString());
                assert.equal(path.pointAtLength(-10000).toString(), curve.pointAtLength(-10000).toString());

                var line = new g.Line('0 0', '100 0');
                path = new g.Path('M 0 0 L 100 0');
                assert.equal(path.pointAtLength(40).toString(), line.pointAtLength(40).toString());
                assert.equal(path.pointAtLength(40, { precision: 0 }).toString(), line.pointAtLength(40, { precision: 0 }).toString());
                assert.equal(path.pointAtLength(10000).toString(), line.pointAtLength(10000).toString());

                assert.equal(path.pointAtLength(-40).toString(), line.pointAtLength(-40).toString());
                assert.equal(path.pointAtLength(-40, { precision: 0 }).toString(), line.pointAtLength(-40, { precision: 0 }).toString());
                assert.equal(path.pointAtLength(-10000).toString(), line.pointAtLength(-10000).toString());
            });

            QUnit.test('compare to browser implementation', function(assert) {

                var gPath;
                var path;
                var p1;
                var x1;
                var y1;
                var p2;
                var x2;
                var y2;

                var svg = getSvg();

                gPath = new g.Path('M 0 0 C 0 200 200 200 200 0');
                path = V('path', { d: gPath.serialize(), stroke: 'green', fill: 'none' });
                svg.append(path);

                p1 = gPath.pointAtLength(250, { precision: 4 });
                x1 = Math.round(p1.x);
                y1 = Math.round(p1.y);
                p2 = path.node.getPointAtLength(250);
                x2 = Math.round(p2.x);
                y2 = Math.round(p2.y);

                assert.equal(x1 + '@' + y1, x2 + '@' + y2);

                // browser implementation is wrong
                /*gPath = new g.Path('M 0 0 C 0 200 200 200 200 0');
                path = V('path', { d: gPath.serialize(), stroke: 'green', fill: 'none' });
                svg.append(path);

                p1 = gPath.pointAtLength(-1, { precision: 1 });
                x1 = Math.round(p1.x);
                y1 = Math.round(p1.y);
                p2 = path.node.getPointAtLength(-1);
                x2 = Math.round(p2.x);
                y2 = Math.round(p2.y);

                assert.equal(x1 + '@' + y1, x2 + '@' + y2);*/

                gPath = new g.Path('M 0 0 C 0 200 200 200 200 0');
                path = V('path', { d: gPath.serialize(), stroke: 'green', fill: 'none' });
                svg.append(path);

                p1 = gPath.pointAtLength(10000, { precision: 1 });
                x1 = Math.round(p1.x);
                y1 = Math.round(p1.y);
                p2 = path.node.getPointAtLength(10000);
                x2 = Math.round(p2.x);
                y2 = Math.round(p2.y);

                assert.equal(x1 + '@' + y1, x2 + '@' + y2);

                svg.remove();
            });
        });

        QUnit.module('pointAtT()', function() {

        });

        QUnit.module('removeSegment()', function() {

            QUnit.test('sanity', function(assert) {

                var path;

                var error;

                try {
                    path = new g.Path();
                    path.removeSegment(0);
                } catch (e) {
                    error = e;
                }
                assert.ok(typeof error !== 'undefined', 'Should throw an error when called on an empty path.');

                try {
                    path = new g.Path(g.Path.createSegment('M', 100, 100));
                    path.removeSegment(1);
                } catch (e) {
                    error = e;
                }
                assert.ok(typeof error !== 'undefined', 'Should throw an error when called with an index out of range.');

                try {
                    path = new g.Path(g.Path.createSegment('M', 100, 100));
                    path.removeSegment(-2);
                } catch (e) {
                    error = e;
                }
                assert.ok(typeof error !== 'undefined', 'Should throw an error when called with a negative index out of range.');
            });

            QUnit.test('remove a segment', function(assert) {

                var path;

                path = new g.Path(g.Path.createSegment('M', 100, 100));
                path.removeSegment(0);
                assert.equal(path.toString(), '');

                path = new g.Path(g.Path.createSegment('M', 100, 100));
                path.removeSegment(-1);
                assert.equal(path.toString(), '');

                path = new g.Path([
                    g.Path.createSegment('M', 100, 100),
                    g.Path.createSegment('L', 200, 200),
                    g.Path.createSegment('L', 300, 300)
                ]);
                path.removeSegment(1);
                assert.equal(path.toString(), 'M 100 100 L 300 300');
                assert.equal(path.getSegment(1).start.toString(), '100@100');

                path = new g.Path([
                    g.Path.createSegment('M', 100, 100),
                    g.Path.createSegment('L', 200, 200),
                    g.Path.createSegment('L', 300, 300)
                ]);
                path.removeSegment(-2);
                assert.equal(path.toString(), 'M 100 100 L 300 300');
                assert.equal(path.getSegment(-1).start.toString(), '100@100');

                path = new g.Path([
                    g.Path.createSegment('M', 100, 100),
                    g.Path.createSegment('L', 200, 200),
                    g.Path.createSegment('M', 300, 300),
                    g.Path.createSegment('L', 400, 400),
                    g.Path.createSegment('Z')
                ]);
                path.removeSegment(2);
                assert.equal(path.toString(), 'M 100 100 L 200 200 L 400 400 Z');
                assert.equal(path.getSegment(2).start.toString(), '200@200');
                assert.equal(path.getSegment(3).end.toString(), '100@100');

                path = new g.Path([
                    g.Path.createSegment('M', 100, 100),
                    g.Path.createSegment('L', 200, 200),
                    g.Path.createSegment('M', 300, 300),
                    g.Path.createSegment('L', 400, 400),
                    g.Path.createSegment('Z')
                ]);
                path.removeSegment(-3);
                assert.equal(path.toString(), 'M 100 100 L 200 200 L 400 400 Z');
                assert.equal(path.getSegment(-2).start.toString(), '200@200');
                assert.equal(path.getSegment(-1).end.toString(), '100@100');
            });
        });

        QUnit.module('replaceSegment()', function() {

            QUnit.test('sanity', function(assert) {

                var path;
                var segment;

                var error;

                try {
                    path = new g.Path();
                    segment = g.Path.createSegment('L', 200, 200);
                    path.replaceSegment(0, segment);
                } catch (e) {
                    error = e;
                }
                assert.ok(typeof error !== 'undefined', 'Should throw an error when called on an empty path.');

                try {
                    path = new g.Path(g.Path.createSegment('M', 100, 100));
                    segment = g.Path.createSegment('L', 200, 200);
                    path.replaceSegment(1, segment);
                } catch (e) {
                    error = e;
                }
                assert.ok(typeof error !== 'undefined', 'Should throw an error when called with an index out of range.');

                try {
                    path = new g.Path(g.Path.createSegment('M', 100, 100));
                    segment = g.Path.createSegment('L', 200, 200);
                    path.replaceSegment(-2, segment);
                } catch (e) {
                    error = e;
                }
                assert.ok(typeof error !== 'undefined', 'Should throw an error when called with a negative index out of range.');

                try {
                    path = new g.Path(g.Path.createSegment('M', 100, 100));
                    segment = null;
                    path.replaceSegment(0, segment);
                } catch (e) {
                    error = e;
                }
                assert.ok(typeof error !== 'undefined', 'Should throw an error when called with an argument that is not a segment.');

                try {
                    path = new g.Path(g.Path.createSegment('M', 100, 100));
                    segment = 1;
                    path.replaceSegment(0, segment);
                } catch (e) {
                    error = e;
                }
                assert.ok(typeof error !== 'undefined', 'Should throw an error when called with an argument that is not a segment.');

                try {
                    path = new g.Path(g.Path.createSegment('M', 100, 100));
                    segment = 'hello';
                    path.replaceSegment(0, segment);
                } catch (e) {
                    error = e;
                }
                assert.ok(typeof error !== 'undefined', 'Should throw an error when called with an argument that is not a segment.');

                try {
                    path = new g.Path(g.Path.createSegment('M', 100, 100));
                    segment = [null, null];
                    path.replaceSegment(0, segment);
                } catch (e) {
                    error = e;
                }
                assert.ok(typeof error !== 'undefined', 'Should throw an error when called with an argument that is not a segment array.');

                try {
                    path = new g.Path(g.Path.createSegment('M', 100, 100));
                    segment = [1, 1];
                    path.replaceSegment(0, segment);
                } catch (e) {
                    error = e;
                }
                assert.ok(typeof error !== 'undefined', 'Should throw an error when called with an argument that is not a segment array.');

                try {
                    path = new g.Path(g.Path.createSegment('M', 100, 100));
                    segment = ['hello', 'hello'];
                    path.replaceSegment(0, segment);
                } catch (e) {
                    error = e;
                }
                assert.ok(typeof error !== 'undefined', 'Should throw an error when called with an argument that is not a segment array.');
            });

            QUnit.test('replace a segment with a segment', function(assert) {

                var path;
                var segment;

                path = new g.Path(g.Path.createSegment('M', 100, 100));
                segment = g.Path.createSegment('M', 111, 111);
                path.replaceSegment(0, segment);
                assert.equal(path.toString(), 'M 111 111');

                path = new g.Path(g.Path.createSegment('M', 100, 100));
                segment = g.Path.createSegment('M', 111, 111);
                path.replaceSegment(-1, segment);
                assert.equal(path.toString(), 'M 111 111');

                path = new g.Path([
                    g.Path.createSegment('M', 100, 100),
                    g.Path.createSegment('L', 200, 200),
                    g.Path.createSegment('L', 300, 300)
                ]);
                segment = g.Path.createSegment('L', 222, 222);
                path.replaceSegment(1, segment);
                assert.equal(path.toString(), 'M 100 100 L 222 222 L 300 300');
                assert.equal(path.getSegment(2).start.toString(), '222@222');

                path = new g.Path([
                    g.Path.createSegment('M', 100, 100),
                    g.Path.createSegment('L', 200, 200),
                    g.Path.createSegment('L', 300, 300)
                ]);
                segment = g.Path.createSegment('L', 222, 222);
                path.replaceSegment(-2, segment);
                assert.equal(path.toString(), 'M 100 100 L 222 222 L 300 300');
                assert.equal(path.getSegment(-1).start.toString(), '222@222');

                path = new g.Path([
                    g.Path.createSegment('M', 100, 100),
                    g.Path.createSegment('L', 200, 200),
                    g.Path.createSegment('M', 300, 300),
                    g.Path.createSegment('L', 400, 400),
                    g.Path.createSegment('Z')
                ]);
                segment = g.Path.createSegment('L', 333, 333);
                path.replaceSegment(2, segment);
                assert.equal(path.toString(), 'M 100 100 L 200 200 L 333 333 L 400 400 Z');
                assert.equal(path.getSegment(3).start.toString(), '333@333');
                assert.equal(path.getSegment(4).end.toString(), '100@100');

                path = new g.Path([
                    g.Path.createSegment('M', 100, 100),
                    g.Path.createSegment('L', 200, 200),
                    g.Path.createSegment('M', 300, 300),
                    g.Path.createSegment('L', 400, 400),
                    g.Path.createSegment('Z')
                ]);
                segment = g.Path.createSegment('L', 333, 333);
                path.replaceSegment(-3, segment);
                assert.equal(path.toString(), 'M 100 100 L 200 200 L 333 333 L 400 400 Z');
                assert.equal(path.getSegment(-2).start.toString(), '333@333');
                assert.equal(path.getSegment(-1).end.toString(), '100@100');

                path = new g.Path([
                    g.Path.createSegment('M', 100, 100),
                    g.Path.createSegment('L', 200, 200),
                    g.Path.createSegment('L', 300, 300),
                    g.Path.createSegment('L', 400, 400),
                    g.Path.createSegment('Z')
                ]);
                segment = g.Path.createSegment('M', 333, 333);
                path.replaceSegment(2, segment);
                assert.equal(path.toString(), 'M 100 100 L 200 200 M 333 333 L 400 400 Z');
                assert.equal(path.getSegment(3).start.toString(), '333@333');
                assert.equal(path.getSegment(4).end.toString(), '333@333');

                path = new g.Path([
                    g.Path.createSegment('M', 100, 100),
                    g.Path.createSegment('L', 200, 200),
                    g.Path.createSegment('L', 300, 300),
                    g.Path.createSegment('L', 400, 400),
                    g.Path.createSegment('Z')
                ]);
                segment = g.Path.createSegment('M', 333, 333);
                path.replaceSegment(-3, segment);
                assert.equal(path.toString(), 'M 100 100 L 200 200 M 333 333 L 400 400 Z');
                assert.equal(path.getSegment(-2).start.toString(), '333@333');
                assert.equal(path.getSegment(-1).end.toString(), '333@333');
            });

            QUnit.test('replace a segment with a segment array', function(assert) {

                var path;
                var segment;

                path = new g.Path(g.Path.createSegment('M', 100, 100));
                segment = [
                    g.Path.createSegment('M', 111, 111),
                    g.Path.createSegment('L', 199, 199)
                ];
                path.replaceSegment(0, segment);
                assert.equal(path.toString(), 'M 111 111 L 199 199');

                path = new g.Path(g.Path.createSegment('M', 100, 100));
                segment = [
                    g.Path.createSegment('M', 111, 111),
                    g.Path.createSegment('L', 199, 199)
                ];
                path.replaceSegment(-1, segment);
                assert.equal(path.toString(), 'M 111 111 L 199 199');

                path = new g.Path([
                    g.Path.createSegment('M', 100, 100),
                    g.Path.createSegment('L', 200, 200),
                    g.Path.createSegment('L', 300, 300)
                ]);
                segment = [
                    g.Path.createSegment('L', 222, 222),
                    g.Path.createSegment('L', 299, 299)
                ];
                path.replaceSegment(1, segment);
                assert.equal(path.toString(), 'M 100 100 L 222 222 L 299 299 L 300 300');
                assert.equal(path.getSegment(3).start.toString(), '299@299');

                path = new g.Path([
                    g.Path.createSegment('M', 100, 100),
                    g.Path.createSegment('L', 200, 200),
                    g.Path.createSegment('L', 300, 300)
                ]);
                segment = [
                    g.Path.createSegment('L', 222, 222),
                    g.Path.createSegment('L', 299, 299)
                ];
                path.replaceSegment(-2, segment);
                assert.equal(path.toString(), 'M 100 100 L 222 222 L 299 299 L 300 300');
                assert.equal(path.getSegment(-1).start.toString(), '299@299');

                path = new g.Path([
                    g.Path.createSegment('M', 100, 100),
                    g.Path.createSegment('L', 200, 200),
                    g.Path.createSegment('M', 300, 300),
                    g.Path.createSegment('L', 400, 400),
                    g.Path.createSegment('Z')
                ]);
                segment = [
                    g.Path.createSegment('L', 333, 333),
                    g.Path.createSegment('L', 399, 399)
                ];
                path.replaceSegment(2, segment);
                assert.equal(path.toString(), 'M 100 100 L 200 200 L 333 333 L 399 399 L 400 400 Z');
                assert.equal(path.getSegment(4).start.toString(), '399@399');
                assert.equal(path.getSegment(5).end.toString(), '100@100');

                path = new g.Path([
                    g.Path.createSegment('M', 100, 100),
                    g.Path.createSegment('L', 200, 200),
                    g.Path.createSegment('M', 300, 300),
                    g.Path.createSegment('L', 400, 400),
                    g.Path.createSegment('Z')
                ]);
                segment = [
                    g.Path.createSegment('L', 333, 333),
                    g.Path.createSegment('L', 399, 399)
                ];
                path.replaceSegment(-3, segment);
                assert.equal(path.toString(), 'M 100 100 L 200 200 L 333 333 L 399 399 L 400 400 Z');
                assert.equal(path.getSegment(-2).start.toString(), '399@399');
                assert.equal(path.getSegment(-1).end.toString(), '100@100');

                path = new g.Path([
                    g.Path.createSegment('M', 100, 100),
                    g.Path.createSegment('L', 200, 200),
                    g.Path.createSegment('L', 300, 300),
                    g.Path.createSegment('L', 400, 400),
                    g.Path.createSegment('Z')
                ]);
                segment = [
                    g.Path.createSegment('M', 333, 333),
                    g.Path.createSegment('L', 399, 399)
                ];
                path.replaceSegment(2, segment);
                assert.equal(path.toString(), 'M 100 100 L 200 200 M 333 333 L 399 399 L 400 400 Z');
                assert.equal(path.getSegment(4).start.toString(), '399@399');
                assert.equal(path.getSegment(5).end.toString(), '333@333');

                path = new g.Path([
                    g.Path.createSegment('M', 100, 100),
                    g.Path.createSegment('L', 200, 200),
                    g.Path.createSegment('L', 300, 300),
                    g.Path.createSegment('L', 400, 400),
                    g.Path.createSegment('Z')
                ]);
                segment = [
                    g.Path.createSegment('M', 333, 333),
                    g.Path.createSegment('L', 399, 399)
                ];
                path.replaceSegment(-3, segment);
                assert.equal(path.toString(), 'M 100 100 L 200 200 M 333 333 L 399 399 L 400 400 Z');
                assert.equal(path.getSegment(-2).start.toString(), '399@399');
                assert.equal(path.getSegment(-1).end.toString(), '333@333');
            });
        });

        QUnit.module('scale()', function() {

            QUnit.test('sanity', function(assert) {

                var path = new g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z');

                assert.ok(path.clone().scale(0, 0) instanceof g.Path);
                assert.ok(path.clone().scale(0, 0, new g.Point('0 0')) instanceof g.Path);
                assert.ok(path.clone().scale(0, 0, new g.Point('10 10')) instanceof g.Path);

                assert.ok(path.clone().scale(0, 1) instanceof g.Path);
                assert.ok(path.clone().scale(0, 1, new g.Point('0 0')) instanceof g.Path);
                assert.ok(path.clone().scale(0, 1, new g.Point('10 10')) instanceof g.Path);

                assert.ok(path.clone().scale(1, 0) instanceof g.Path);
                assert.ok(path.clone().scale(1, 0, new g.Point('0 0')) instanceof g.Path);
                assert.ok(path.clone().scale(1, 0, new g.Point('10 10')) instanceof g.Path);

                assert.ok(path.clone().scale(1, 1) instanceof g.Path);
                assert.ok(path.clone().scale(1, 1, new g.Point('0 0')) instanceof g.Path);
                assert.ok(path.clone().scale(1, 1, new g.Point('10 10')) instanceof g.Path);

                assert.ok(path.clone().scale(10, 10) instanceof g.Path);
                assert.ok(path.clone().scale(10, 10, new g.Point('0 0')) instanceof g.Path);
                assert.ok(path.clone().scale(10, 10, new g.Point('10 10')) instanceof g.Path);
            });

            QUnit.test('should return a scaled version of self', function(assert) {

                var path = new g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z');

                assert.equal(path.clone().scale(0, 0).toString(), 'M 0 0 L 0 0 C 0 0 0 0 0 0 Z');
                assert.equal(path.clone().scale(0, 0, new g.Point('0 0')).toString(), 'M 0 0 L 0 0 C 0 0 0 0 0 0 Z');
                assert.equal(path.clone().scale(0, 0, new g.Point('10 10')).toString(), 'M 10 10 L 10 10 C 10 10 10 10 10 10 Z');

                assert.equal(path.clone().scale(0, 1).toString(), 'M 0 100 L 0 100 C 0 100 0 150 0 200 Z');
                assert.equal(path.clone().scale(0, 1, new g.Point('0 0')).toString(), 'M 0 100 L 0 100 C 0 100 0 150 0 200 Z');
                assert.equal(path.clone().scale(0, 1, new g.Point('10 10')).toString(), 'M 10 100 L 10 100 C 10 100 10 150 10 200 Z');

                assert.equal(path.clone().scale(1, 0).toString(), 'M 150 0 L 100 0 C 100 0 0 0 100 0 Z');
                assert.equal(path.clone().scale(1, 0, new g.Point('0 0')).toString(), 'M 150 0 L 100 0 C 100 0 0 0 100 0 Z');
                assert.equal(path.clone().scale(1, 0, new g.Point('10 10')).toString(), 'M 150 10 L 100 10 C 100 10 0 10 100 10 Z');

                assert.equal(path.clone().scale(1, 1).toString(), 'M 150 100 L 100 100 C 100 100 0 150 100 200 Z');
                assert.equal(path.clone().scale(1, 1, new g.Point('0 0')).toString(), 'M 150 100 L 100 100 C 100 100 0 150 100 200 Z');
                assert.equal(path.clone().scale(1, 1, new g.Point('10 10')).toString(), 'M 150 100 L 100 100 C 100 100 0 150 100 200 Z');

                assert.equal(path.clone().scale(10, 10).toString(), 'M 1500 1000 L 1000 1000 C 1000 1000 0 1500 1000 2000 Z');
                assert.equal(path.clone().scale(10, 10, new g.Point('0 0')).toString(), 'M 1500 1000 L 1000 1000 C 1000 1000 0 1500 1000 2000 Z');
                assert.equal(path.clone().scale(10, 10, new g.Point('10 10')).toString(), 'M 1410 910 L 910 910 C 910 910 -90 1410 910 1910 Z');
            });
        });

        QUnit.module('segmentAt()', function() {

            QUnit.test('sanity', function(assert) {

                var path;

                path = new g.Path();
                assert.equal(path.segmentAt(0), null);
                assert.equal(path.segmentAt(0.4), null);
                assert.equal(path.segmentAt(10), null);
                assert.equal(path.segmentAt(-1), null);

                path = new g.Path('M 0 0');
                assert.equal(path.segmentAt(0), null);
                assert.equal(path.segmentAt(0.4), null);
                assert.equal(path.segmentAt(10), null);
                assert.equal(path.segmentAt(-1), null);

                path = new g.Path('M 0 0 M 100 0');
                assert.equal(path.segmentAt(0), null);
                assert.equal(path.segmentAt(0.4), null);
                assert.equal(path.segmentAt(10), null);
                assert.equal(path.segmentAt(-1), null);

                path = new g.Path('M 0 0 C 0 200 200 200 200 0');
                assert.ok(path.segmentAt(0) instanceof g.Path.segmentTypes.C);
                assert.ok(path.segmentAt(0.4) instanceof g.Path.segmentTypes.C);
                assert.ok(path.segmentAt(10) instanceof g.Path.segmentTypes.C);
                assert.ok(path.segmentAt(-1) instanceof g.Path.segmentTypes.C);

                path = new g.Path('M 0 0 L 100 0');
                assert.ok(path.segmentAt(0) instanceof g.Path.segmentTypes.L);
                assert.ok(path.segmentAt(0.4) instanceof g.Path.segmentTypes.L);
                assert.ok(path.segmentAt(10) instanceof g.Path.segmentTypes.L);
                assert.ok(path.segmentAt(-1) instanceof g.Path.segmentTypes.L);

                path = new g.Path('M 0 0 L 100 0 Z');
                assert.ok(path.segmentAt(0) instanceof g.Path.segmentTypes.L);
                assert.ok(path.segmentAt(0.4) instanceof g.Path.segmentTypes.L);
                assert.ok(path.segmentAt(0.8) instanceof g.Path.segmentTypes.Z);
                assert.ok(path.segmentAt(10) instanceof g.Path.segmentTypes.Z);
                assert.ok(path.segmentAt(-1) instanceof g.Path.segmentTypes.L);

                path = new g.Path('M 0 0 Z');
                assert.ok(path.segmentAt(0) instanceof g.Path.segmentTypes.Z);
                assert.ok(path.segmentAt(0.4) instanceof g.Path.segmentTypes.Z);
                assert.ok(path.segmentAt(10) instanceof g.Path.segmentTypes.Z);
                assert.ok(path.segmentAt(-1) instanceof g.Path.segmentTypes.Z);
            });

            QUnit.test('returns the index of a segment at given length up to precision', function(assert) {

                var path;

                path = new g.Path('M 0 0 C 0 200 200 200 200 0');
                assert.equal(path.segmentAt(0).toString(), 'C 0@0 0@200 200@200 200@0');
                assert.equal(path.segmentAt(0.4).toString(), 'C 0@0 0@200 200@200 200@0');
                assert.equal(path.segmentAt(10).toString(), 'C 0@0 0@200 200@200 200@0');
                assert.equal(path.segmentAt(-1).toString(), 'C 0@0 0@200 200@200 200@0');

                path = new g.Path('M 0 0 L 100 0');
                assert.equal(path.segmentAt(0).toString(), 'L 0@0 100@0');
                assert.equal(path.segmentAt(0.4).toString(), 'L 0@0 100@0');
                assert.equal(path.segmentAt(10).toString(), 'L 0@0 100@0');
                assert.equal(path.segmentAt(-1).toString(), 'L 0@0 100@0');

                path = new g.Path('M 0 0 L 100 0 Z');
                assert.equal(path.segmentAt(0).toString(), 'L 0@0 100@0');
                assert.equal(path.segmentAt(0.4).toString(), 'L 0@0 100@0');
                assert.equal(path.segmentAt(0.8).toString(), 'Z 100@0 0@0');
                assert.equal(path.segmentAt(10).toString(), 'Z 100@0 0@0');
                assert.equal(path.segmentAt(-1).toString(), 'L 0@0 100@0');

                path = new g.Path('M 0 0 Z');
                assert.equal(path.segmentAt(0).toString(), 'Z 0@0 0@0');
                assert.equal(path.segmentAt(0.4).toString(), 'Z 0@0 0@0');
                assert.equal(path.segmentAt(10).toString(), 'Z 0@0 0@0');
                assert.equal(path.segmentAt(-1).toString(), 'Z 0@0 0@0');
            });
        });

        QUnit.module('segmentAtLength()', function() {

            QUnit.test('sanity', function(assert) {

                var path;

                path = new g.Path();
                assert.equal(path.segmentAtLength(0), null);
                assert.equal(path.segmentAtLength(40), null);
                assert.equal(path.segmentAtLength(-40), null);

                path = new g.Path('M 0 0');
                assert.equal(path.segmentAtLength(0), null);
                assert.equal(path.segmentAtLength(40), null);
                assert.equal(path.segmentAtLength(-40), null);

                path = new g.Path('M 0 0 M 100 0');
                assert.equal(path.segmentAtLength(0), null);
                assert.equal(path.segmentAtLength(40), null);
                assert.equal(path.segmentAtLength(1000), null);
                assert.equal(path.segmentAtLength(-40), null);
                assert.equal(path.segmentAtLength(-1000), null);

                path = new g.Path('M 0 0 C 0 200 200 200 200 0');
                assert.ok(path.segmentAtLength(0) instanceof g.Path.segmentTypes.C);
                assert.ok(path.segmentAtLength(40) instanceof g.Path.segmentTypes.C);
                assert.ok(path.segmentAtLength(1000) instanceof g.Path.segmentTypes.C);
                assert.ok(path.segmentAtLength(-40) instanceof g.Path.segmentTypes.C);
                assert.ok(path.segmentAtLength(-1000) instanceof g.Path.segmentTypes.C);

                path = new g.Path('M 0 0 L 100 0');
                assert.ok(path.segmentAtLength(0) instanceof g.Path.segmentTypes.L);
                assert.ok(path.segmentAtLength(40) instanceof g.Path.segmentTypes.L);
                assert.ok(path.segmentAtLength(1000) instanceof g.Path.segmentTypes.L);
                assert.ok(path.segmentAtLength(-40) instanceof g.Path.segmentTypes.L);
                assert.ok(path.segmentAtLength(-1000) instanceof g.Path.segmentTypes.L);

                path = new g.Path('M 0 0 L 100 0 Z');
                assert.ok(path.segmentAtLength(0) instanceof g.Path.segmentTypes.L);
                assert.ok(path.segmentAtLength(40) instanceof g.Path.segmentTypes.L);
                assert.ok(path.segmentAtLength(140) instanceof g.Path.segmentTypes.Z);
                assert.ok(path.segmentAtLength(1000) instanceof g.Path.segmentTypes.Z);
                assert.ok(path.segmentAtLength(-40) instanceof g.Path.segmentTypes.Z);
                assert.ok(path.segmentAtLength(-140) instanceof g.Path.segmentTypes.L);
                assert.ok(path.segmentAtLength(-1000) instanceof g.Path.segmentTypes.L);

                path = new g.Path('M 0 0 Z');
                assert.ok(path.segmentAtLength(0) instanceof g.Path.segmentTypes.Z);
                assert.ok(path.segmentAtLength(40) instanceof g.Path.segmentTypes.Z);
                assert.ok(path.segmentAtLength(-40) instanceof g.Path.segmentTypes.Z);
            });

            QUnit.test('returns the index of a segment at given length up to precision', function(assert) {

                var path;

                path = new g.Path('M 0 0 C 0 200 200 200 200 0');
                assert.equal(path.segmentAtLength(0).toString(), 'C 0@0 0@200 200@200 200@0');
                assert.equal(path.segmentAtLength(250).toString(), 'C 0@0 0@200 200@200 200@0');
                assert.equal(path.segmentAtLength(1000).toString(), 'C 0@0 0@200 200@200 200@0');
                assert.equal(path.segmentAtLength(-250).toString(), 'C 0@0 0@200 200@200 200@0');
                assert.equal(path.segmentAtLength(-1000).toString(), 'C 0@0 0@200 200@200 200@0');

                path = new g.Path('M 0 0 L 100 0');
                assert.equal(path.segmentAtLength(0).toString(), 'L 0@0 100@0');
                assert.equal(path.segmentAtLength(40).toString(), 'L 0@0 100@0');
                assert.equal(path.segmentAtLength(1000).toString(), 'L 0@0 100@0');
                assert.equal(path.segmentAtLength(-40).toString(), 'L 0@0 100@0');
                assert.equal(path.segmentAtLength(-1000).toString(), 'L 0@0 100@0');

                path = new g.Path('M 0 0 L 100 0 Z');
                assert.equal(path.segmentAtLength(0).toString(), 'L 0@0 100@0');
                assert.equal(path.segmentAtLength(40).toString(), 'L 0@0 100@0');
                assert.equal(path.segmentAtLength(140).toString(), 'Z 100@0 0@0');
                assert.equal(path.segmentAtLength(1000).toString(), 'Z 100@0 0@0');
                assert.equal(path.segmentAtLength(-40).toString(), 'Z 100@0 0@0');
                assert.equal(path.segmentAtLength(-140).toString(), 'L 0@0 100@0');
                assert.equal(path.segmentAtLength(-1000).toString(), 'L 0@0 100@0');

                path = new g.Path('M 0 0 Z');
                assert.equal(path.segmentAtLength(0).toString(), 'Z 0@0 0@0');
                assert.equal(path.segmentAtLength(40).toString(), 'Z 0@0 0@0');
                assert.equal(path.segmentAtLength(-40).toString(), 'Z 0@0 0@0');
            });
        });

        QUnit.module('segmentIndexAt()', function() {

            QUnit.test('sanity', function(assert) {

                var path;

                path = new g.Path();
                assert.equal(path.segmentIndexAt(0), null);
                assert.equal(path.segmentIndexAt(0.4), null);
                assert.equal(path.segmentIndexAt(10), null);
                assert.equal(path.segmentIndexAt(-1), null);

                path = new g.Path('M 0 0');
                assert.equal(path.segmentIndexAt(0), null);
                assert.equal(path.segmentIndexAt(0.4), null);
                assert.equal(path.segmentIndexAt(10), null);
                assert.equal(path.segmentIndexAt(-1), null);

                path = new g.Path('M 0 0 M 100 0');
                assert.equal(path.segmentIndexAt(0), null);
                assert.equal(path.segmentIndexAt(0.4), null);
                assert.equal(path.segmentIndexAt(10), null);
                assert.equal(path.segmentIndexAt(-1), null);

                path = new g.Path('M 0 0 C 0 200 200 200 200 0');
                assert.equal(typeof path.segmentIndexAt(0), 'number');
                assert.equal(typeof path.segmentIndexAt(0.4), 'number');
                assert.equal(typeof path.segmentIndexAt(10), 'number');
                assert.equal(typeof path.segmentIndexAt(-1), 'number');

                path = new g.Path('M 0 0 L 100 0');
                assert.equal(typeof path.segmentIndexAt(0), 'number');
                assert.equal(typeof path.segmentIndexAt(0.4), 'number');
                assert.equal(typeof path.segmentIndexAt(10), 'number');
                assert.equal(typeof path.segmentIndexAt(-1), 'number');

                path = new g.Path('M 0 0 L 100 0 Z');
                assert.equal(typeof path.segmentIndexAt(0), 'number');
                assert.equal(typeof path.segmentIndexAt(0.4), 'number');
                assert.equal(typeof path.segmentIndexAt(0.8), 'number');
                assert.equal(typeof path.segmentIndexAt(10), 'number');
                assert.equal(typeof path.segmentIndexAt(-1), 'number');

                path = new g.Path('M 0 0 Z');
                assert.equal(typeof path.segmentIndexAt(0), 'number');
                assert.equal(typeof path.segmentIndexAt(0.4), 'number');
                assert.equal(typeof path.segmentIndexAt(10), 'number');
                assert.equal(typeof path.segmentIndexAt(-1), 'number');
            });

            QUnit.test('returns the index of a segment at given length up to precision', function(assert) {

                var path;

                path = new g.Path('M 0 0 C 0 200 200 200 200 0');
                assert.equal(path.segmentIndexAt(0), 1);
                assert.equal(path.segmentIndexAt(0.4), 1);
                assert.equal(path.segmentIndexAt(10), 1);
                assert.equal(path.segmentIndexAt(-1), 1);

                path = new g.Path('M 0 0 L 100 0');
                assert.equal(path.segmentIndexAt(0), 1);
                assert.equal(path.segmentIndexAt(0.4), 1);
                assert.equal(path.segmentIndexAt(10), 1);
                assert.equal(path.segmentIndexAt(-1), 1);

                path = new g.Path('M 0 0 L 100 0 Z');
                assert.equal(path.segmentIndexAt(0), 1);
                assert.equal(path.segmentIndexAt(0.4), 1);
                assert.equal(path.segmentIndexAt(0.8), 2);
                assert.equal(path.segmentIndexAt(10), 2);
                assert.equal(path.segmentIndexAt(-1), 1);

                path = new g.Path('M 0 0 Z');
                assert.equal(path.segmentIndexAt(0), 1);
                assert.equal(path.segmentIndexAt(0.4), 1);
                assert.equal(path.segmentIndexAt(10), 1);
                assert.equal(path.segmentIndexAt(-1), 1);
            });
        });

        QUnit.module('segmentIndexAtLength()', function() {

            QUnit.test('sanity', function(assert) {

                var path;

                path = new g.Path();
                assert.equal(path.segmentIndexAtLength(0), null);
                assert.equal(path.segmentIndexAtLength(40), null);
                assert.equal(path.segmentIndexAtLength(-40), null);

                path = new g.Path('M 0 0');
                assert.equal(path.segmentIndexAtLength(0), null);
                assert.equal(path.segmentIndexAtLength(40), null);
                assert.equal(path.segmentIndexAtLength(-40), null);

                path = new g.Path('M 0 0 M 100 0');
                assert.equal(path.segmentIndexAtLength(0), null);
                assert.equal(path.segmentIndexAtLength(40), null);
                assert.equal(path.segmentIndexAtLength(1000), null);
                assert.equal(path.segmentIndexAtLength(-40), null);
                assert.equal(path.segmentIndexAtLength(-1000), null);

                path = new g.Path('M 0 0 C 0 200 200 200 200 0');
                assert.equal(typeof path.segmentIndexAtLength(0), 'number');
                assert.equal(typeof path.segmentIndexAtLength(250), 'number');
                assert.equal(typeof path.segmentIndexAtLength(1000), 'number');
                assert.equal(typeof path.segmentIndexAtLength(-250), 'number');
                assert.equal(typeof path.segmentIndexAtLength(-1000), 'number');

                path = new g.Path('M 0 0 L 100 0');
                assert.equal(typeof path.segmentIndexAtLength(0), 'number');
                assert.equal(typeof path.segmentIndexAtLength(40), 'number');
                assert.equal(typeof path.segmentIndexAtLength(1000), 'number');
                assert.equal(typeof path.segmentIndexAtLength(-40), 'number');
                assert.equal(typeof path.segmentIndexAtLength(-1000), 'number');

                path = new g.Path('M 0 0 L 100 0 Z');
                assert.equal(typeof path.segmentIndexAtLength(0), 'number');
                assert.equal(typeof path.segmentIndexAtLength(40), 'number');
                assert.equal(typeof path.segmentIndexAtLength(140), 'number');
                assert.equal(typeof path.segmentIndexAtLength(1000), 'number');
                assert.equal(typeof path.segmentIndexAtLength(-40), 'number');
                assert.equal(typeof path.segmentIndexAtLength(-140), 'number');
                assert.equal(typeof path.segmentIndexAtLength(-1000), 'number');

                path = new g.Path('M 0 0 Z');
                assert.equal(typeof path.segmentIndexAtLength(0), 'number');
                assert.equal(typeof path.segmentIndexAtLength(40), 'number');
                assert.equal(typeof path.segmentIndexAtLength(-40), 'number');
            });

            QUnit.test('returns the index of a segment at given length up to precision', function(assert) {

                var path;

                path = new g.Path('M 0 0 C 0 200 200 200 200 0');
                assert.equal(path.segmentIndexAtLength(0), 1);
                assert.equal(path.segmentIndexAtLength(250), 1);
                assert.equal(path.segmentIndexAtLength(1000), 1);
                assert.equal(path.segmentIndexAtLength(-250), 1);
                assert.equal(path.segmentIndexAtLength(-1000), 1);

                path = new g.Path('M 0 0 L 100 0');
                assert.equal(path.segmentIndexAtLength(0), 1);
                assert.equal(path.segmentIndexAtLength(40), 1);
                assert.equal(path.segmentIndexAtLength(1000), 1);
                assert.equal(path.segmentIndexAtLength(-40), 1);
                assert.equal(path.segmentIndexAtLength(-1000), 1);

                path = new g.Path('M 0 0 L 100 0 Z');
                assert.equal(path.segmentIndexAtLength(0), 1);
                assert.equal(path.segmentIndexAtLength(40), 1);
                assert.equal(path.segmentIndexAtLength(140), 2);
                assert.equal(path.segmentIndexAtLength(1000), 2);
                assert.equal(path.segmentIndexAtLength(-40), 2);
                assert.equal(path.segmentIndexAtLength(-140), 1);
                assert.equal(path.segmentIndexAtLength(-1000), 1);

                path = new g.Path('M 0 0 Z');
                assert.equal(path.segmentIndexAtLength(0), 1);
                assert.equal(path.segmentIndexAtLength(40), 1);
                assert.equal(path.segmentIndexAtLength(-40), 1);
            });
        });

        QUnit.module('tangentAt()', function() {

            QUnit.test('sanity', function(assert) {

                var path;

                path = new g.Path();
                assert.equal(path.tangentAt(0.5), null);
                assert.equal(path.tangentAt(0.5, { precision: 0 }), null);

                assert.equal(path.tangentAt(-1), null);
                assert.equal(path.tangentAt(10), null);

                path = new g.Path('M 0 0 M 100 0');
                assert.equal(path.tangentAt(0.5), null);
                assert.equal(path.tangentAt(0.5, { precision: 0 }), null);

                assert.equal(path.tangentAt(-1), null);
                assert.equal(path.tangentAt(10), null);

                path = new g.Path('M 0 0 L 0 0');
                assert.equal(path.tangentAt(0.5), null);
                assert.equal(path.tangentAt(0.5, { precision: 0 }), null);
                assert.equal(path.tangentAt(-1), null);
                assert.equal(path.tangentAt(10), null);

                path = new g.Path('M 0 200 L 0 0 C 0 200 200 200 200 0 L 200 200 Z'); // segment length: 0 - 200 - 400 - 200 - 200
                // first lineto
                assert.ok(path.tangentAt(0.1) instanceof g.Line);
                assert.ok(path.tangentAt(0.1, { precision: 0 }) instanceof g.Line);
                assert.ok(path.tangentAt(0.1, { precision: 1 }) instanceof g.Line);
                assert.ok(path.tangentAt(0.1, { precision: 2 }) instanceof g.Line);
                assert.ok(path.tangentAt(0.1, { precision: 3 }) instanceof g.Line);
                assert.ok(path.tangentAt(0.1, { precision: 4 }) instanceof g.Line);
                assert.ok(path.tangentAt(0.1, { precision: 5 }) instanceof g.Line);

                // point of discontinuity
                assert.ok(path.tangentAt(0.2) instanceof g.Line);
                assert.ok(path.tangentAt(0.2, { precision: 0 }) instanceof g.Line);
                assert.ok(path.tangentAt(0.2, { precision: 1 }) instanceof g.Line);
                assert.ok(path.tangentAt(0.2, { precision: 2 }) instanceof g.Line);
                assert.ok(path.tangentAt(0.2, { precision: 3 }) instanceof g.Line);
                assert.ok(path.tangentAt(0.2, { precision: 4 }) instanceof g.Line);
                assert.ok(path.tangentAt(0.2, { precision: 5 }) instanceof g.Line);

                // curveto midpoint
                assert.ok(path.tangentAt(0.4) instanceof g.Line);
                assert.ok(path.tangentAt(0.4, { precision: 0 }) instanceof g.Line);
                assert.ok(path.tangentAt(0.4, { precision: 1 }) instanceof g.Line);
                assert.ok(path.tangentAt(0.4, { precision: 2 }) instanceof g.Line);
                assert.ok(path.tangentAt(0.4, { precision: 3 }) instanceof g.Line);
                assert.ok(path.tangentAt(0.4, { precision: 4 }) instanceof g.Line);
                assert.ok(path.tangentAt(0.4, { precision: 5 }) instanceof g.Line);

                // curveto
                assert.ok(path.tangentAt(0.5) instanceof g.Line);
                assert.ok(path.tangentAt(0.5, { precision: 0 }) instanceof g.Line);
                assert.ok(path.tangentAt(0.5, { precision: 1 }) instanceof g.Line);
                assert.ok(path.tangentAt(0.5, { precision: 2 }) instanceof g.Line);
                assert.ok(path.tangentAt(0.5, { precision: 3 }) instanceof g.Line);
                assert.ok(path.tangentAt(0.5, { precision: 4 }) instanceof g.Line);
                assert.ok(path.tangentAt(0.5, { precision: 5 }) instanceof g.Line);

                // closepath
                assert.ok(path.tangentAt(0.9) instanceof g.Line);
                assert.ok(path.tangentAt(0.9, { precision: 0 }) instanceof g.Line);
                assert.ok(path.tangentAt(0.9, { precision: 1 }) instanceof g.Line);
                assert.ok(path.tangentAt(0.9, { precision: 2 }) instanceof g.Line);
                assert.ok(path.tangentAt(0.9, { precision: 3 }) instanceof g.Line);
                assert.ok(path.tangentAt(0.9, { precision: 4 }) instanceof g.Line);
                assert.ok(path.tangentAt(0.9, { precision: 5 }) instanceof g.Line);

                assert.ok(path.tangentAt(-1) instanceof g.Line);
                assert.ok(path.tangentAt(10) instanceof g.Line);
            });

            QUnit.test('returns tangent to curve at given length ratio up to precision', function(assert) {

                var path;

                path = new g.Path('M 0 200 L 0 0 C 0 200 200 200 200 0 L 200 200 Z'); // segment length: 0 - 200 - 400 - 200 - 200
                // first lineto
                assert.equal(path.tangentAt(0.1).toString(), '0@100.00383501229652 0@-99.99616498770348');
                assert.equal(path.tangentAt(0.1, { precision: 0 }).toString(), '0@120 0@-80');
                assert.equal(path.tangentAt(0.1, { precision: 1 }).toString(), '0@100.98561777698616 0@-99.01438222301384');
                assert.equal(path.tangentAt(0.1, { precision: 2 }).toString(), '0@100.06137466311782 0@-99.93862533688218');
                assert.equal(path.tangentAt(0.1, { precision: 3 }).toString(), '0@100.00383501229652 0@-99.99616498770348');
                assert.equal(path.tangentAt(0.1, { precision: 4 }).toString(), '0@100.000958741763 0@-99.999041258237');
                assert.equal(path.tangentAt(0.1, { precision: 5 }).toString(), '0@100.00005992113927 0@-99.99994007886073');

                // point of discontinuity
                assert.equal(path.tangentAt(0.2).toString(), '0@0.0076700245930396704 0@-199.99232997540696');
                assert.equal(path.tangentAt(0.2, { precision: 0 }).toString(), '0@40 0@-160');
                assert.equal(path.tangentAt(0.2, { precision: 1 }).toString(), '0@1.971235553972292 0@-198.0287644460277');
                assert.equal(path.tangentAt(0.2, { precision: 2 }).toString(), '0@0.1227493262356063 0@-199.8772506737644');
                assert.equal(path.tangentAt(0.2, { precision: 3 }).toString(), '0@0.0076700245930396704 0@-199.99232997540696');
                assert.equal(path.tangentAt(0.2, { precision: 4 }).toString(), '0@0.0019174835259718748 0@-199.99808251647403');
                assert.equal(path.tangentAt(0.2, { precision: 5 }).toString(), '0@0.0001198422785364528 0@-199.99988015772146');

                // curveto midpoint
                assert.equal(path.tangentAt(0.4).toString(), '100@150 200@150');
                assert.equal(path.tangentAt(0.4, { precision: 0 }).toString(), '0@0 0@200');
                assert.equal(path.tangentAt(0.4, { precision: 1 }).toString(), '100@150 200@150');
                assert.equal(path.tangentAt(0.4, { precision: 2 }).toString(), '100@150 200@150');
                assert.equal(path.tangentAt(0.4, { precision: 3 }).toString(), '100@150 200@150');
                assert.equal(path.tangentAt(0.4, { precision: 4 }).toString(), '100@150 200@150');
                assert.equal(path.tangentAt(0.4, { precision: 5 }).toString(), '100@150 200@150');

                // arbitrary curveto point
                assert.equal(path.tangentAt(0.5).toString(), '178.97450625896454@96.42105102539062 243.2552069425583@-23.110198974609375');
                assert.equal(path.tangentAt(0.5, { precision: 0 }).toString(), '200@0 200@-200');
                assert.equal(path.tangentAt(0.5, { precision: 1 }).toString(), '168.75@112.5 243.75@12.5');
                assert.equal(path.tangentAt(0.5, { precision: 2 }).toString(), '178.59649658203125@97.119140625 243.34259033203125@-21.630859375');
                assert.equal(path.tangentAt(0.5, { precision: 3 }).toString(), '178.97450625896454@96.42105102539062 243.2552069425583@-23.110198974609375');
                assert.equal(path.tangentAt(0.5, { precision: 4 }).toString(), '178.83307227748446@96.68337106704712 243.2886529888492@-22.55491018295288');
                assert.equal(path.tangentAt(0.5, { precision: 5 }).toString(), '178.82126877566407@96.70520201325417 243.29140345116684@-22.508665174245834');

                // closepath
                assert.equal(path.tangentAt(0.9).toString(), '99.99616498770342@200 -100.00383501229658@200');
                assert.equal(path.tangentAt(0.9, { precision: 0 }).toString(), '80@200 -120@200');
                assert.equal(path.tangentAt(0.9, { precision: 1 }).toString(), '99.01438222301387@200 -100.98561777698613@200');
                assert.equal(path.tangentAt(0.9, { precision: 2 }).toString(), '99.93862533688218@200 -100.06137466311782@200');
                assert.equal(path.tangentAt(0.9, { precision: 3 }).toString(), '99.99616498770342@200 -100.00383501229658@200');
                assert.equal(path.tangentAt(0.9, { precision: 4 }).toString(), '99.99904125823696@200 -100.00095874176304@200');
                assert.equal(path.tangentAt(0.9, { precision: 5 }).toString(), '99.99994007886073@200 -100.00005992113927@200');

                assert.equal(path.tangentAt(-1).toString(), '0@200 0@0');
                assert.equal(path.tangentAt(10).toString(), '0@200 -200@200');
            });
        });

        QUnit.module('tangentAtLength()', function() {

            QUnit.test('sanity', function(assert) {

                var path;

                path = new g.Path('M 0 0 M 100 0');
                assert.equal(path.tangentAtLength(40), null);
                assert.equal(path.tangentAtLength(40, { precision: 0 }), null);
                assert.equal(path.tangentAtLength(10000), null);

                assert.equal(path.tangentAtLength(-40), null);
                assert.equal(path.tangentAtLength(-40, { precision: 0 }), null);
                assert.equal(path.tangentAtLength(-10000), null);

                path = new g.Path('M 0 0 L 0 0');
                assert.equal(path.tangentAtLength(10000), null);
                assert.equal(path.tangentAtLength(-10000), null);

                path = new g.Path('M 0 200 L 0 0 C 0 200 200 200 200 0 L 200 200 Z'); // segment length: 0 - 200 - 400 - 200 - 200
                // first lineto
                assert.ok(path.tangentAtLength(100) instanceof g.Line);
                assert.ok(path.tangentAtLength(100, { precision: 0 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(100, { precision: 1 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(100, { precision: 2 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(100, { precision: 3 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(100, { precision: 4 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(100, { precision: 5 }) instanceof g.Line);

                // point of discontinuity
                assert.ok(path.tangentAtLength(200) instanceof g.Line);
                assert.ok(path.tangentAtLength(200, { precision: 0 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(200, { precision: 1 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(200, { precision: 2 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(200, { precision: 3 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(200, { precision: 4 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(200, { precision: 5 }) instanceof g.Line);

                // curveto midpoint
                assert.ok(path.tangentAtLength(400) instanceof g.Line);
                assert.ok(path.tangentAtLength(400, { precision: 0 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(400, { precision: 1 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(400, { precision: 2 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(400, { precision: 3 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(400, { precision: 4 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(400, { precision: 5 }) instanceof g.Line);

                // arbitrary curveto point
                assert.ok(path.tangentAtLength(500) instanceof g.Line);
                assert.ok(path.tangentAtLength(500, { precision: 0 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(500, { precision: 1 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(500, { precision: 2 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(500, { precision: 3 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(500, { precision: 4 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(500, { precision: 5 }) instanceof g.Line);

                // closepath
                assert.ok(path.tangentAtLength(900) instanceof g.Line);
                assert.ok(path.tangentAtLength(900, { precision: 0 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(900, { precision: 1 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(900, { precision: 2 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(900, { precision: 3 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(900, { precision: 4 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(900, { precision: 5 }) instanceof g.Line);

                assert.ok(path.tangentAtLength(10000) instanceof g.Line);
                assert.ok(path.tangentAtLength(-10000) instanceof g.Line);

                // first lineto
                assert.ok(path.tangentAtLength(-900) instanceof g.Line);
                assert.ok(path.tangentAtLength(-900, { precision: 0 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(-900, { precision: 1 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(-900, { precision: 2 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(-900, { precision: 3 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(-900, { precision: 4 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(-900, { precision: 5 }) instanceof g.Line);

                // point of discontinuity
                assert.ok(path.tangentAtLength(-800) instanceof g.Line);
                assert.ok(path.tangentAtLength(-800, { precision: 0 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(-800, { precision: 1 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(-800, { precision: 2 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(-800, { precision: 3 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(-800, { precision: 4 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(-800, { precision: 5 }) instanceof g.Line);

                // curveto midpoint
                assert.ok(path.tangentAtLength(-600) instanceof g.Line);
                assert.ok(path.tangentAtLength(-600, { precision: 0 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(-600, { precision: 1 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(-600, { precision: 2 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(-600, { precision: 3 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(-600, { precision: 4 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(-600, { precision: 5 }) instanceof g.Line);

                // arbitrary curveto point
                assert.ok(path.tangentAtLength(-500) instanceof g.Line);
                assert.ok(path.tangentAtLength(-500, { precision: 0 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(-500, { precision: 1 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(-500, { precision: 2 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(-500, { precision: 3 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(-500, { precision: 4 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(-500, { precision: 5 }) instanceof g.Line);

                // closepath
                assert.ok(path.tangentAtLength(-100) instanceof g.Line);
                assert.ok(path.tangentAtLength(-100, { precision: 0 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(-100, { precision: 1 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(-100, { precision: 2 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(-100, { precision: 3 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(-100, { precision: 4 }) instanceof g.Line);
                assert.ok(path.tangentAtLength(-100, { precision: 5 }) instanceof g.Line);
            });

            QUnit.test('returns tangent to curve at given length up to precision', function(assert) {

                var path;

                path = new g.Path('M 0 200 L 0 0 C 0 200 200 200 200 0 L 200 200 Z'); // segment length: 0 - 200 - 400 - 200 - 200
                // first lineto
                assert.equal(path.tangentAtLength(100).toString(), '0@100 0@-100');
                assert.equal(path.tangentAtLength(100, { precision: 0 }).toString(), '0@100 0@-100');
                assert.equal(path.tangentAtLength(100, { precision: 1 }).toString(), '0@100 0@-100');
                assert.equal(path.tangentAtLength(100, { precision: 2 }).toString(), '0@100 0@-100');
                assert.equal(path.tangentAtLength(100, { precision: 3 }).toString(), '0@100 0@-100');
                assert.equal(path.tangentAtLength(100, { precision: 4 }).toString(), '0@100 0@-100');
                assert.equal(path.tangentAtLength(100, { precision: 5 }).toString(), '0@100 0@-100');

                // point of discontinuity
                assert.equal(path.tangentAtLength(200).toString(), '0@0 0@-200');
                assert.equal(path.tangentAtLength(200, { precision: 0 }).toString(), '0@0 0@-200');
                assert.equal(path.tangentAtLength(200, { precision: 1 }).toString(), '0@0 0@-200');
                assert.equal(path.tangentAtLength(200, { precision: 2 }).toString(), '0@0 0@-200');
                assert.equal(path.tangentAtLength(200, { precision: 3 }).toString(), '0@0 0@-200');
                assert.equal(path.tangentAtLength(200, { precision: 4 }).toString(), '0@0 0@-200');
                assert.equal(path.tangentAtLength(200, { precision: 5 }).toString(), '0@0 0@-200');

                // curveto midpoint
                assert.equal(path.tangentAtLength(400).toString(), '100@150 200@150');
                assert.equal(path.tangentAtLength(400, { precision: 0 }).toString(), '200@0 200@-200');
                assert.equal(path.tangentAtLength(400, { precision: 1 }).toString(), '100@150 200@150');
                assert.equal(path.tangentAtLength(400, { precision: 2 }).toString(), '100@150 200@150');
                assert.equal(path.tangentAtLength(400, { precision: 3 }).toString(), '100@150 200@150');
                assert.equal(path.tangentAtLength(400, { precision: 4 }).toString(), '100@150 200@150');
                assert.equal(path.tangentAtLength(400, { precision: 5 }).toString(), '100@150 200@150');

                // arbitrary curveto point
                assert.equal(path.tangentAtLength(500).toString(), '178.97450625896454@96.42105102539062 243.2552069425583@-23.110198974609375');
                assert.equal(path.tangentAtLength(500, { precision: 0 }).toString(), '200@100 200@300');
                assert.equal(path.tangentAtLength(500, { precision: 1 }).toString(), '168.75@112.5 243.75@12.5');
                assert.equal(path.tangentAtLength(500, { precision: 2 }).toString(), '178.59649658203125@97.119140625 243.34259033203125@-21.630859375');
                assert.equal(path.tangentAtLength(500, { precision: 3 }).toString(), '178.97450625896454@96.42105102539062 243.2552069425583@-23.110198974609375');
                assert.equal(path.tangentAtLength(500, { precision: 4 }).toString(), '178.83307227748446@96.68337106704712 243.2886529888492@-22.55491018295288');
                assert.equal(path.tangentAtLength(500, { precision: 5 }).toString(), '178.82126877566407@96.70520201325417 243.29140345116684@-22.508665174245834');

                // closepath
                assert.equal(path.tangentAtLength(900).toString(), '99.96164987703469@200 -100.03835012296531@200');
                assert.equal(path.tangentAtLength(900, { precision: 0 }).toString(), '0@200 -200@200');
                assert.equal(path.tangentAtLength(900, { precision: 1 }).toString(), '90.14382223013841@200 -109.85617776986159@200');
                assert.equal(path.tangentAtLength(900, { precision: 2 }).toString(), '99.38625336882194@200 -100.61374663117806@200');
                assert.equal(path.tangentAtLength(900, { precision: 3 }).toString(), '99.96164987703469@200 -100.03835012296531@200');
                assert.equal(path.tangentAtLength(900, { precision: 4 }).toString(), '99.99041258237003@200 -100.00958741762997@200');
                assert.equal(path.tangentAtLength(900, { precision: 5 }).toString(), '99.9994007886072@200 -100.0005992113928@200');

                assert.equal(path.tangentAtLength(10000).toString(), '0@200 -200@200');
                assert.equal(path.tangentAtLength(-10000).toString(), '0@200 0@0');

                // first lineto
                assert.equal(path.tangentAtLength(-900).toString(), '0@100.03835012296531 0@-99.96164987703469');
                assert.equal(path.tangentAtLength(-900, { precision: 0 }).toString(), '0@200 0@0');
                assert.equal(path.tangentAtLength(-900, { precision: 1 }).toString(), '0@109.85617776986159 0@-90.14382223013841');
                assert.equal(path.tangentAtLength(-900, { precision: 2 }).toString(), '0@100.61374663117806 0@-99.38625336882194');
                assert.equal(path.tangentAtLength(-900, { precision: 3 }).toString(), '0@100.03835012296531 0@-99.96164987703469');
                assert.equal(path.tangentAtLength(-900, { precision: 4 }).toString(), '0@100.00958741762997 0@-99.99041258237003');
                assert.equal(path.tangentAtLength(-900, { precision: 5 }).toString(), '0@100.0005992113928 0@-99.9994007886072');

                // point of discontinuity
                assert.equal(path.tangentAtLength(-800).toString(), '0@0.03835012296531204 0@-199.9616498770347');
                assert.equal(path.tangentAtLength(-800, { precision: 0 }).toString(), '0@200 0@0');
                assert.equal(path.tangentAtLength(-800, { precision: 1 }).toString(), '0@9.856177769861574 0@-190.14382223013843');
                assert.equal(path.tangentAtLength(-800, { precision: 2 }).toString(), '0@0.6137466311780599 0@-199.38625336882194');
                assert.equal(path.tangentAtLength(-800, { precision: 3 }).toString(), '0@0.03835012296531204 0@-199.9616498770347');
                assert.equal(path.tangentAtLength(-800, { precision: 4 }).toString(), '0@0.00958741762997306 0@-199.99041258237003');
                assert.equal(path.tangentAtLength(-800, { precision: 5 }).toString(), '0@0.0005992113927959508 0@-199.9994007886072');

                // curveto midpoint
                assert.equal(path.tangentAtLength(-600).toString(), '100@150 200@150');
                assert.equal(path.tangentAtLength(-600, { precision: 0 }).toString(), '0@0 0@200');
                assert.equal(path.tangentAtLength(-600, { precision: 1 }).toString(), '100@150 200@150');
                assert.equal(path.tangentAtLength(-600, { precision: 2 }).toString(), '100@150 200@150');
                assert.equal(path.tangentAtLength(-600, { precision: 3 }).toString(), '100@150 200@150');
                assert.equal(path.tangentAtLength(-600, { precision: 4 }).toString(), '100@150 200@150');
                assert.equal(path.tangentAtLength(-600, { precision: 5 }).toString(), '100@150 200@150');

                // arbitrary curveto point
                assert.equal(path.tangentAtLength(-500).toString(), '178.97450625896454@96.42105102539062 243.2552069425583@-23.110198974609375');
                assert.equal(path.tangentAtLength(-500, { precision: 0 }).toString(), '0@0 0@200');
                assert.equal(path.tangentAtLength(-500, { precision: 1 }).toString(), '168.75@112.5 243.75@12.5');
                assert.equal(path.tangentAtLength(-500, { precision: 2 }).toString(), '178.59649658203125@97.119140625 243.34259033203125@-21.630859375');
                assert.equal(path.tangentAtLength(-500, { precision: 3 }).toString(), '178.97450625896454@96.42105102539062 243.2552069425583@-23.110198974609375');
                assert.equal(path.tangentAtLength(-500, { precision: 4 }).toString(), '178.83307227748446@96.68337106704712 243.2886529888492@-22.55491018295288');
                assert.equal(path.tangentAtLength(-500, { precision: 5 }).toString(), '178.82126877566407@96.70520201325417 243.29140345116684@-22.508665174245834');

                // closepath
                assert.equal(path.tangentAtLength(-100).toString(), '100@200 -100@200');
                assert.equal(path.tangentAtLength(-100, { precision: 0 }).toString(), '100@200 -100@200');
                assert.equal(path.tangentAtLength(-100, { precision: 1 }).toString(), '100@200 -100@200');
                assert.equal(path.tangentAtLength(-100, { precision: 2 }).toString(), '100@200 -100@200');
                assert.equal(path.tangentAtLength(-100, { precision: 3 }).toString(), '100@200 -100@200');
                assert.equal(path.tangentAtLength(-100, { precision: 4 }).toString(), '100@200 -100@200');
                assert.equal(path.tangentAtLength(-100, { precision: 5 }).toString(), '100@200 -100@200');
            });
        });

        QUnit.module('translate()', function() {

            QUnit.test('sanity', function(assert) {

                var path = new g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z');
                assert.ok(path.clone().translate(0, 0) instanceof g.Path);
                assert.ok(path.clone().translate(0, 10) instanceof g.Path);
                assert.ok(path.clone().translate(10, 0) instanceof g.Path);
                assert.ok(path.clone().translate(10, 10) instanceof g.Path);
            });

            QUnit.test('should return a translated version of self', function(assert) {

                var path = new g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z');
                assert.equal(path.clone().translate(0, 0).toString(), 'M 150 100 L 100 100 C 100 100 0 150 100 200 Z');
                assert.equal(path.clone().translate(0, 10).toString(), 'M 150 110 L 100 110 C 100 110 0 160 100 210 Z');
                assert.equal(path.clone().translate(10, 0).toString(), 'M 160 100 L 110 100 C 110 100 10 150 110 200 Z');
                assert.equal(path.clone().translate(10, 10).toString(), 'M 160 110 L 110 110 C 110 110 10 160 110 210 Z');
            });
        });

        QUnit.module('serialize()', function(assert) {

            QUnit.test('sanity', function(assert) {

                var path;

                var error;

                try {
                    path = new g.Path(g.Path.createSegment('L', 100, 100));
                    path.serialize();
                } catch (e) {
                    error = e;
                }
                assert.ok(typeof error !== 'undefined', 'Should throw an error when called on a path that does not start with a Moveto segment.');

                path = new g.Path();
                assert.equal(typeof path.toString(), 'string');

                path = new g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z');
                assert.equal(typeof path.serialize(), 'string');
            });

            QUnit.test('toString with extra checks', function(assert) {

                var path;

                path = new g.Path();
                assert.equal(path.toString(), '');

                path = new g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z');
                assert.equal(path.serialize(), 'M 150 100 L 100 100 C 100 100 0 150 100 200 Z');
            });
        });

        QUnit.module('toString()', function(assert) {

            QUnit.test('sanity', function(assert) {

                var path;

                path = new g.Path(g.Path.createSegment('L', 100, 100));
                assert.equal(typeof path.toString(), 'string');

                path = new g.Path();
                assert.equal(typeof path.toString(), 'string');

                path = new g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z');
                assert.equal(typeof path.toString(), 'string');
            });

            QUnit.test('returns a string representation of the path', function(assert) {

                var path;

                path = new g.Path(g.Path.createSegment('L', 100, 100));
                assert.equal(path.toString(), 'L 100 100');

                path = new g.Path();
                assert.equal(path.toString(), '');

                path = new g.Path('M 150 100 L 100 100 C 100 100 0 150 100 200 Z');
                assert.equal(path.toString(), 'M 150 100 L 100 100 C 100 100 0 150 100 200 Z');
            });
        });
    });
});
