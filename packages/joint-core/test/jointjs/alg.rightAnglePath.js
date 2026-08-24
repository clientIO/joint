// Characterization tests for `joint.alg.rightAnglePath()`, the path-finding
// algorithm behind the `rightAngle` router.
//
// The algorithm decides between 16 combinations of the side the route leaves the
// source through and the side it arrives at the target through, and reaches one
// of 107 `return` statements. What comes out is a link's shape, so almost
// everything asserted here is a route recorded from a known-good implementation
// rather than one derived from first principles. The point is to pin the
// behaviour down while the algorithm is refactored: a failure means some route
// changed, and the assertion message says which case.
//
//   - `routes` walks a set of 80 cases that between them reach every one of
//     those 107 returns. Regenerate it (and check the diff by eye) if a change
//     to the routes is intended.
//   - `edge cases` pins the boundaries the algorithm decides on - overlapping
//     and touching elements, shared centers, equal distances, zero sizes, and
//     the two options.
//   - `properties` checks what has to hold for any input at all, over a
//     generated sweep. These are derived from the contract, not recorded.

QUnit.module('alg.rightAnglePath', function() {

    // A case's ends are given as `rect: [x, y, width, height]`, the `margin`
    // kept around it, the `side` the route goes through and the `anchor` the
    // route runs to - the same shape `rightAnglePath()` takes, spelled shorter.
    function makeEnd({ rect, margin, side, anchor }) {
        return {
            endPoint: new g.Point(anchor[0], anchor[1]),
            bbox: new g.Rect(rect[0], rect[1], rect[2], rect[3]),
            margin: margin,
            side: side
        };
    }

    function route(testCase) {
        const points = joint.alg.rightAnglePath(
            makeEnd(testCase.source),
            makeEnd(testCase.target),
            testCase.opt || {}
        );
        // Compared as plain pairs so a failure prints readably.
        return points.map(function(point) {
            return [point.x, point.y];
        });
    }

    function describe(testCase, index) {
        const opt = testCase.opt ? ` ${JSON.stringify(testCase.opt)}` : '';
        return testCase.name || `case ${index}: source ${JSON.stringify(testCase.source.rect)} margin ${testCase.source.margin}, `
            + `target ${JSON.stringify(testCase.target.rect)} margin ${testCase.target.margin}${opt}`;
    }

    QUnit.module('routes', function() {

        QUnit.test('left => left', function(assert) {

            const cases = [
                {
                    source: { rect: [0, 0, 20, 60], margin: 20, side: 'left', anchor: [5, 45] },
                    target: { rect: [10, 40, 20, 0], margin: 0, side: 'left', anchor: [10, 40] },
                    expected: [[-20, 45], [-20, 40]]
                },
                {
                    source: { rect: [0, 0, 0, 20], margin: 10, side: 'left', anchor: [0, 20] },
                    target: { rect: [50, 0, 40, 40], margin: 10, side: 'left', anchor: [50, 20] },
                    expected: [[-10, 20], [-10, 30], [25, 30], [25, 20]]
                }
            ];

            cases.forEach(function(testCase, index) {
                assert.deepEqual(route(testCase), testCase.expected, describe(testCase, index));
            });
        });

        QUnit.test('left => right', function(assert) {

            const cases = [
                {
                    source: { rect: [0, 0, 0, 20], margin: 10, side: 'left', anchor: [0, 20] },
                    target: { rect: [-10, -30, 20, 60], margin: 20, side: 'right', anchor: [10, -30] },
                    expected: [[-10, 20], [-10, -5], [30, -5], [30, -30]]
                },
                {
                    source: { rect: [0, 0, 60, 20], margin: 20, side: 'left', anchor: [0, 0] },
                    target: { rect: [-60, -20, 0, 60], margin: 20, side: 'right', anchor: [-60, 10] },
                    expected: [[-30, 0], [-30, 10]]
                },
                {
                    source: { rect: [0, 0, 40, 0], margin: 10, side: 'left', anchor: [10, 0] },
                    target: { rect: [10, 60, 60, 40], margin: 20, side: 'right', anchor: [70, 60] },
                    expected: [[-10, 0], [-10, 30], [90, 30], [90, 60]]
                },
                {
                    source: { rect: [0, 0, 20, 60], margin: 10, side: 'left', anchor: [0, 60] },
                    target: { rect: [-40, -60, 20, 60], margin: 20, side: 'right', anchor: [-30, -30] },
                    opt: { minPathMargin: 5 },
                    expected: [[-10, 60], [-10, 15], [0, 15], [0, -30]]
                }
            ];

            cases.forEach(function(testCase, index) {
                assert.deepEqual(route(testCase), testCase.expected, describe(testCase, index));
            });
        });

        QUnit.test('left => top', function(assert) {

            const cases = [
                {
                    source: { rect: [0, 0, 60, 0], margin: 20, side: 'left', anchor: [0, 0] },
                    target: { rect: [-50, -50, 40, 60], margin: 20, side: 'top', anchor: [-30, -20] },
                    expected: [[-70, 0], [-70, -70], [-30, -70]]
                },
                {
                    source: { rect: [0, 0, 60, 60], margin: 20, side: 'left', anchor: [0, 0] },
                    target: { rect: [40, -50, 60, 60], margin: 0, side: 'top', anchor: [70, -50] },
                    expected: [[-20, 0], [-20, -50], [70, -50]]
                },
                {
                    source: { rect: [0, 0, 40, 60], margin: 20, side: 'left', anchor: [0, 30] },
                    target: { rect: [0, 30, 20, 0], margin: 20, side: 'top', anchor: [10, 30] },
                    expected: [[-20, 30], [-20, -20], [10, -20]]
                },
                {
                    source: { rect: [0, 0, 40, 0], margin: 20, side: 'left', anchor: [0, 0] },
                    target: { rect: [50, 80, 60, 20], margin: 0, side: 'top', anchor: [80, 90] },
                    expected: [[-20, 0], [-20, 40], [80, 40]]
                },
                {
                    source: { rect: [0, 0, 20, 20], margin: 20, side: 'left', anchor: [0, 0] },
                    target: { rect: [0, 40, 20, 40], margin: 0, side: 'top', anchor: [20, 40] },
                    expected: [[-20, 0], [-20, 20], [20, 20]]
                },
                {
                    source: { rect: [0, 0, 40, 40], margin: 10, side: 'left', anchor: [0, 20] },
                    target: { rect: [-10, 60, 40, 20], margin: 0, side: 'top', anchor: [0, 60] },
                    expected: [[-10, 20], [-10, 50], [0, 50]]
                },
                {
                    source: { rect: [0, 0, 20, 60], margin: 20, side: 'left', anchor: [0, 60] },
                    target: { rect: [-60, 50, 40, 20], margin: 20, side: 'top', anchor: [-50, 50] },
                    opt: { minPathMargin: 10 },
                    expected: [[-20, 60], [-20, 30], [-50, 30]]
                },
                {
                    source: { rect: [0, 0, 40, 60], margin: 10, side: 'left', anchor: [0, 60] },
                    target: { rect: [-60, -30, 60, 20], margin: 0, side: 'top', anchor: [-60, -30] },
                    opt: { minPathMargin: 0 },
                    expected: [[-10, 60], [-10, 50], [0, 50], [0, -30], [-60, -30]]
                }
            ];

            cases.forEach(function(testCase, index) {
                assert.deepEqual(route(testCase), testCase.expected, describe(testCase, index));
            });
        });

        QUnit.test('left => bottom', function(assert) {

            const cases = [
                {
                    source: { rect: [0, 0, 60, 60], margin: 20, side: 'left', anchor: [0, 60] },
                    target: { rect: [-60, 30, 20, 0], margin: 20, side: 'bottom', anchor: [-40, 30] },
                    expected: [[-40, 60]]
                },
                {
                    source: { rect: [0, 0, 0, 40], margin: 20, side: 'left', anchor: [0, 10] },
                    target: { rect: [40, 40, 0, 60], margin: 20, side: 'bottom', anchor: [40, 100] },
                    expected: [[-20, 10], [-20, 120], [40, 120]]
                },
                {
                    source: { rect: [0, 0, 60, 20], margin: 20, side: 'left', anchor: [0, 20] },
                    target: { rect: [50, -60, 20, 0], margin: 10, side: 'bottom', anchor: [50, -60] },
                    expected: [[-20, 20], [-20, -30], [50, -30]]
                },
                {
                    source: { rect: [0, 0, 60, 40], margin: 20, side: 'left', anchor: [15, 30] },
                    target: { rect: [10, 0, 40, 20], margin: 20, side: 'bottom', anchor: [30, 20] },
                    expected: [[-20, 30], [-20, 40], [30, 40]]
                },
                {
                    source: { rect: [0, 0, 40, 40], margin: 20, side: 'left', anchor: [0, 40] },
                    target: { rect: [60, -30, 0, 40], margin: 10, side: 'bottom', anchor: [60, 10] },
                    expected: [[-20, 40], [-20, 30], [60, 30]]
                },
                {
                    source: { rect: [0, 0, 60, 20], margin: 0, side: 'left', anchor: [0, 20] },
                    target: { rect: [40, -60, 60, 0], margin: 20, side: 'bottom', anchor: [100, -60] },
                    expected: [[0, 20], [0, -30], [100, -30]]
                },
                {
                    source: { rect: [0, 0, 60, 20], margin: 10, side: 'left', anchor: [30, 10] },
                    target: { rect: [-50, -60, 40, 60], margin: 20, side: 'bottom', anchor: [-40, 0] },
                    opt: { minPathMargin: 5 },
                    expected: [[-10, 10], [-10, 20], [-40, 20]]
                }
            ];

            cases.forEach(function(testCase, index) {
                assert.deepEqual(route(testCase), testCase.expected, describe(testCase, index));
            });
        });

        QUnit.test('right => left', function(assert) {

            const cases = [
                {
                    source: { rect: [0, 0, 20, 40], margin: 10, side: 'right', anchor: [20, 20] },
                    target: { rect: [60, 80, 40, 60], margin: 20, side: 'left', anchor: [60, 140] },
                    expected: [[35, 20], [35, 140]]
                },
                {
                    source: { rect: [0, 0, 40, 20], margin: 0, side: 'right', anchor: [10, 15] },
                    target: { rect: [-60, -40, 0, 20], margin: 20, side: 'left', anchor: [-60, -20] },
                    expected: [[40, 15], [40, 20], [-80, 20], [-80, -20]]
                },
                {
                    source: { rect: [0, 0, 60, 40], margin: 20, side: 'right', anchor: [60, 40] },
                    target: { rect: [80, 10, 20, 20], margin: 0, side: 'left', anchor: [80, 20] },
                    expected: [[80, 40], [80, 30], [80, 30], [80, 20]]
                },
                {
                    source: { rect: [0, 0, 40, 40], margin: 20, side: 'right', anchor: [10, 30] },
                    target: { rect: [60, -60, 40, 60], margin: 20, side: 'left', anchor: [60, -60] },
                    opt: { minPathMargin: 5 },
                    expected: [[60, 30], [60, -15], [40, -15], [40, -60]]
                }
            ];

            cases.forEach(function(testCase, index) {
                assert.deepEqual(route(testCase), testCase.expected, describe(testCase, index));
            });
        });

        QUnit.test('right => right', function(assert) {

            const cases = [
                {
                    source: { rect: [0, 0, 40, 60], margin: 20, side: 'right', anchor: [40, 0] },
                    target: { rect: [0, -60, 40, 60], margin: 10, side: 'right', anchor: [40, 0] },
                    expected: [[60, 0], [60, -20], [50, -20], [50, 0]]
                },
                {
                    source: { rect: [0, 0, 60, 60], margin: 0, side: 'right', anchor: [60, 0] },
                    target: { rect: [30, 20, 60, 20], margin: 10, side: 'right', anchor: [90, 20] },
                    expected: [[100, 0], [100, 20]]
                }
            ];

            cases.forEach(function(testCase, index) {
                assert.deepEqual(route(testCase), testCase.expected, describe(testCase, index));
            });
        });

        QUnit.test('right => top', function(assert) {

            const cases = [
                {
                    source: { rect: [0, 0, 20, 40], margin: 20, side: 'right', anchor: [20, 40] },
                    target: { rect: [60, 60, 40, 0], margin: 20, side: 'top', anchor: [100, 60] },
                    expected: [[100, 40]]
                },
                {
                    source: { rect: [0, 0, 60, 0], margin: 20, side: 'right', anchor: [60, 0] },
                    target: { rect: [20, 20, 0, 40], margin: 10, side: 'top', anchor: [20, 20] },
                    expected: [[80, 0], [80, 5], [20, 5]]
                },
                {
                    source: { rect: [0, 0, 0, 20], margin: 20, side: 'right', anchor: [0, 10] },
                    target: { rect: [20, -50, 60, 20], margin: 20, side: 'top', anchor: [20, -30] },
                    expected: [[20, 10], [20, -70], [40, -70], [40, -70], [20, -70]]
                },
                {
                    source: { rect: [0, 0, 60, 0], margin: 10, side: 'right', anchor: [60, 0] },
                    target: { rect: [20, 30, 40, 0], margin: 20, side: 'top', anchor: [20, 30] },
                    expected: [[70, 0], [70, 10], [20, 10]]
                },
                {
                    source: { rect: [0, 0, 20, 20], margin: 20, side: 'right', anchor: [20, 0] },
                    target: { rect: [0, 10, 20, 0], margin: 10, side: 'top', anchor: [20, 10] },
                    expected: [[40, 0], [40, -20], [20, -20]]
                },
                {
                    source: { rect: [0, 0, 60, 20], margin: 10, side: 'right', anchor: [60, 5] },
                    target: { rect: [-80, -80, 60, 20], margin: 0, side: 'top', anchor: [-65, -65] },
                    expected: [[70, 5], [70, -80], [-65, -80]]
                }
            ];

            cases.forEach(function(testCase, index) {
                assert.deepEqual(route(testCase), testCase.expected, describe(testCase, index));
            });
        });

        QUnit.test('right => bottom', function(assert) {

            const cases = [
                {
                    source: { rect: [0, 0, 0, 20], margin: 20, side: 'right', anchor: [0, 15] },
                    target: { rect: [-20, -60, 40, 20], margin: 0, side: 'bottom', anchor: [-20, -40] },
                    expected: [[20, 15], [20, -20], [-20, -20]]
                },
                {
                    source: { rect: [0, 0, 0, 20], margin: 0, side: 'right', anchor: [0, 10] },
                    target: { rect: [60, -20, 40, 40], margin: 20, side: 'bottom', anchor: [100, 20] },
                    expected: [[30, 10], [30, 40], [100, 40]]
                },
                {
                    source: { rect: [0, 0, 60, 40], margin: 10, side: 'right', anchor: [15, 30] },
                    target: { rect: [20, 40, 20, 40], margin: 0, side: 'bottom', anchor: [20, 80] },
                    expected: [[70, 30], [70, 80], [20, 80]]
                },
                {
                    source: { rect: [0, 0, 60, 20], margin: 20, side: 'right', anchor: [60, 0] },
                    target: { rect: [80, -30, 60, 60], margin: 0, side: 'bottom', anchor: [80, 30] },
                    expected: [[140, 0], [140, 30], [80, 30]]
                },
                {
                    source: { rect: [0, 0, 60, 20], margin: 10, side: 'right', anchor: [60, 0] },
                    target: { rect: [10, -60, 40, 40], margin: 10, side: 'bottom', anchor: [20, -30] },
                    expected: [[70, 0], [70, -10], [20, -10]]
                },
                {
                    source: { rect: [0, 0, 20, 20], margin: 0, side: 'right', anchor: [20, 5] },
                    target: { rect: [-20, 0, 20, 0], margin: 0, side: 'bottom', anchor: [0, 0] },
                    expected: [[20, 5], [20, 2.5], [0, 2.5]]
                },
                {
                    source: { rect: [0, 0, 40, 0], margin: 20, side: 'right', anchor: [20, 0] },
                    target: { rect: [50, -20, 40, 40], margin: 20, side: 'bottom', anchor: [70, 20] },
                    opt: { minPathMargin: 0 },
                    expected: [[60, 0], [60, 20], [45, 20], [45, 40], [70, 40]]
                }
            ];

            cases.forEach(function(testCase, index) {
                assert.deepEqual(route(testCase), testCase.expected, describe(testCase, index));
            });
        });

        QUnit.test('top => left', function(assert) {

            const cases = [
                {
                    source: { rect: [0, 0, 0, 60], margin: 10, side: 'top', anchor: [0, 0] },
                    target: { rect: [20, -40, 20, 0], margin: 20, side: 'left', anchor: [20, -40] },
                    expected: [[0, -40]]
                },
                {
                    source: { rect: [0, 0, 0, 0], margin: 10, side: 'top', anchor: [0, 0] },
                    target: { rect: [30, -10, 60, 40], margin: 10, side: 'left', anchor: [60, 10] },
                    expected: [[0, -10], [15, -10], [15, 10]]
                },
                {
                    source: { rect: [0, 0, 60, 60], margin: 0, side: 'top', anchor: [60, 0] },
                    target: { rect: [10, 0, 40, 60], margin: 20, side: 'left', anchor: [10, 0] },
                    expected: [[60, -20], [-10, -20], [-10, 0]]
                },
                {
                    source: { rect: [0, 0, 60, 60], margin: 10, side: 'top', anchor: [15, 0] },
                    target: { rect: [80, 0, 60, 60], margin: 10, side: 'left', anchor: [80, 15] },
                    expected: [[15, -10], [70, -10], [70, 15]]
                },
                {
                    source: { rect: [0, 0, 60, 40], margin: 0, side: 'top', anchor: [60, 0] },
                    target: { rect: [-60, -10, 0, 60], margin: 0, side: 'left', anchor: [-60, 50] },
                    expected: [[60, -10], [-60, -10], [-60, 50]]
                },
                {
                    source: { rect: [0, 0, 60, 20], margin: 10, side: 'top', anchor: [0, 0] },
                    target: { rect: [50, 0, 0, 40], margin: 0, side: 'left', anchor: [50, 20] },
                    expected: [[0, -10], [25, -10], [25, 20]]
                },
                {
                    source: { rect: [0, 0, 40, 60], margin: 10, side: 'top', anchor: [40, 0] },
                    target: { rect: [50, -20, 60, 20], margin: 20, side: 'left', anchor: [50, -15] },
                    opt: { minPathMargin: 0 },
                    expected: [[40, -10], [30, -10], [30, -15]]
                }
            ];

            cases.forEach(function(testCase, index) {
                assert.deepEqual(route(testCase), testCase.expected, describe(testCase, index));
            });
        });

        QUnit.test('top => right', function(assert) {

            const cases = [
                {
                    source: { rect: [0, 0, 0, 40], margin: 20, side: 'top', anchor: [0, 0] },
                    target: { rect: [-60, -80, 40, 20], margin: 0, side: 'right', anchor: [-20, -75] },
                    expected: [[0, -75]]
                },
                {
                    source: { rect: [0, 0, 0, 20], margin: 0, side: 'top', anchor: [0, 0] },
                    target: { rect: [50, -60, 0, 60], margin: 0, side: 'right', anchor: [50, 0] },
                    expected: [[0, 0], [50, 0], [50, 0], [50, 0], [50, 0]]
                },
                {
                    source: { rect: [0, 0, 60, 20], margin: 10, side: 'top', anchor: [60, 0] },
                    target: { rect: [80, 20, 0, 40], margin: 10, side: 'right', anchor: [80, 60] },
                    expected: [[60, -10], [90, -10], [90, 60]]
                },
                {
                    source: { rect: [0, 0, 20, 20], margin: 20, side: 'top', anchor: [5, 15] },
                    target: { rect: [0, -20, 20, 60], margin: 10, side: 'right', anchor: [20, 40] },
                    expected: [[5, -30], [40, -30], [40, 40]]
                },
                {
                    source: { rect: [0, 0, 60, 40], margin: 20, side: 'top', anchor: [15, 0] },
                    target: { rect: [-40, -10, 20, 60], margin: 10, side: 'right', anchor: [-20, 50] },
                    expected: [[15, -20], [2.5, -20], [2.5, 50]]
                },
                {
                    source: { rect: [0, 0, 20, 0], margin: 0, side: 'top', anchor: [20, 0] },
                    target: { rect: [-50, 0, 20, 0], margin: 20, side: 'right', anchor: [-40, 0] },
                    expected: [[20, 0], [-10, 0], [-10, 0]]
                },
                {
                    source: { rect: [0, 0, 20, 0], margin: 20, side: 'top', anchor: [10, 0] },
                    target: { rect: [-20, -40, 40, 40], margin: 10, side: 'right', anchor: [20, -40] },
                    opt: { minPathMargin: 0 },
                    expected: [[10, -20], [30, -20], [30, -40]]
                }
            ];

            cases.forEach(function(testCase, index) {
                assert.deepEqual(route(testCase), testCase.expected, describe(testCase, index));
            });
        });

        QUnit.test('top => top', function(assert) {

            const cases = [
                {
                    source: { rect: [0, 0, 60, 40], margin: 0, side: 'top', anchor: [15, 0] },
                    target: { rect: [20, -10, 60, 0], margin: 0, side: 'top', anchor: [80, -10] },
                    expected: [[15, -10], [80, -10]]
                },
                {
                    source: { rect: [0, 0, 60, 20], margin: 10, side: 'top', anchor: [30, 10] },
                    target: { rect: [10, 30, 60, 0], margin: 20, side: 'top', anchor: [25, 30] },
                    expected: [[30, -10], [-10, -10], [-10, 10], [25, 10]]
                }
            ];

            cases.forEach(function(testCase, index) {
                assert.deepEqual(route(testCase), testCase.expected, describe(testCase, index));
            });
        });

        QUnit.test('top => bottom', function(assert) {

            const cases = [
                {
                    source: { rect: [0, 0, 40, 0], margin: 0, side: 'top', anchor: [10, 0] },
                    target: { rect: [-40, -60, 40, 20], margin: 10, side: 'bottom', anchor: [-30, -45] },
                    expected: [[10, -15], [-30, -15]]
                },
                {
                    source: { rect: [0, 0, 40, 0], margin: 20, side: 'top', anchor: [0, 0] },
                    target: { rect: [80, 80, 40, 40], margin: 20, side: 'bottom', anchor: [100, 100] },
                    expected: [[0, -20], [-20, -20], [-20, 140], [100, 140]]
                },
                {
                    source: { rect: [0, 0, 60, 0], margin: 20, side: 'top', anchor: [60, 0] },
                    target: { rect: [20, -20, 20, 0], margin: 0, side: 'bottom', anchor: [25, -20] },
                    expected: [[60, -20], [42.5, -20], [42.5, -20], [25, -20]]
                },
                {
                    source: { rect: [0, 0, 60, 60], margin: 20, side: 'top', anchor: [15, 0] },
                    target: { rect: [80, -50, 20, 20], margin: 20, side: 'bottom', anchor: [85, -30] },
                    opt: { minPathMargin: 10 },
                    expected: [[15, -20], [50, -20], [50, -10], [85, -10]]
                }
            ];

            cases.forEach(function(testCase, index) {
                assert.deepEqual(route(testCase), testCase.expected, describe(testCase, index));
            });
        });

        QUnit.test('bottom => left', function(assert) {

            const cases = [
                {
                    source: { rect: [0, 0, 20, 0], margin: 10, side: 'bottom', anchor: [10, 0] },
                    target: { rect: [-50, 0, 60, 60], margin: 0, side: 'left', anchor: [-50, 30] },
                    expected: [[10, 60], [-50, 60], [-50, 30]]
                },
                {
                    source: { rect: [0, 0, 40, 20], margin: 20, side: 'bottom', anchor: [20, 20] },
                    target: { rect: [60, -50, 40, 60], margin: 20, side: 'left', anchor: [60, -20] },
                    expected: [[20, 40], [30, 40], [30, -20]]
                },
                {
                    source: { rect: [0, 0, 40, 20], margin: 0, side: 'bottom', anchor: [40, 0] },
                    target: { rect: [30, 0, 40, 0], margin: 20, side: 'left', anchor: [30, 0] },
                    expected: [[40, 20], [10, 20], [10, 0]]
                },
                {
                    source: { rect: [0, 0, 60, 40], margin: 20, side: 'bottom', anchor: [60, 40] },
                    target: { rect: [30, -30, 0, 0], margin: 20, side: 'left', anchor: [30, -30] },
                    expected: [[60, 60], [-20, 60], [-20, -30]]
                },
                {
                    source: { rect: [0, 0, 20, 40], margin: 20, side: 'bottom', anchor: [20, 40] },
                    target: { rect: [80, -80, 20, 60], margin: 0, side: 'left', anchor: [100, -80] },
                    expected: [[20, 60], [50, 60], [50, -80]]
                },
                {
                    source: { rect: [0, 0, 0, 60], margin: 10, side: 'bottom', anchor: [0, 30] },
                    target: { rect: [60, 10, 60, 0], margin: 20, side: 'left', anchor: [75, 10] },
                    expected: [[0, 70], [30, 70], [30, 10]]
                },
                {
                    source: { rect: [0, 0, 0, 0], margin: 20, side: 'bottom', anchor: [0, 0] },
                    target: { rect: [-80, 20, 40, 40], margin: 10, side: 'left', anchor: [-80, 30] },
                    opt: { minPathMargin: 10 },
                    expected: [[0, 20], [-20, 20], [-20, 10], [-90, 10], [-90, 30]]
                }
            ];

            cases.forEach(function(testCase, index) {
                assert.deepEqual(route(testCase), testCase.expected, describe(testCase, index));
            });
        });

        QUnit.test('bottom => right', function(assert) {

            const cases = [
                {
                    source: { rect: [0, 0, 20, 40], margin: 20, side: 'bottom', anchor: [5, 40] },
                    target: { rect: [50, 80, 20, 40], margin: 10, side: 'right', anchor: [70, 120] },
                    expected: [[5, 60], [80, 60], [80, 120]]
                },
                {
                    source: { rect: [0, 0, 40, 0], margin: 20, side: 'bottom', anchor: [10, 0] },
                    target: { rect: [40, -20, 0, 40], margin: 20, side: 'right', anchor: [40, 0] },
                    expected: [[10, 40], [60, 40], [60, 0]]
                },
                {
                    source: { rect: [0, 0, 40, 40], margin: 10, side: 'bottom', anchor: [20, 40] },
                    target: { rect: [-30, -10, 0, 0], margin: 20, side: 'right', anchor: [-30, -10] },
                    expected: [[20, 50], [-10, 50], [-10, -10]]
                },
                {
                    source: { rect: [0, 0, 60, 20], margin: 10, side: 'bottom', anchor: [15, 15] },
                    target: { rect: [10, -40, 40, 20], margin: 0, side: 'right', anchor: [50, -40] },
                    expected: [[15, 30], [70, 30], [70, -40]]
                },
                {
                    source: { rect: [0, 0, 60, 0], margin: 20, side: 'bottom', anchor: [0, 0] },
                    target: { rect: [0, -20, 0, 20], margin: 0, side: 'right', anchor: [0, -5] },
                    expected: [[0, 20], [0, 20], [0, -5]]
                },
                {
                    source: { rect: [0, 0, 60, 40], margin: 10, side: 'bottom', anchor: [0, 40] },
                    target: { rect: [-50, 10, 0, 20], margin: 0, side: 'right', anchor: [-50, 25] },
                    expected: [[0, 50], [-25, 50], [-25, 25]]
                },
                {
                    source: { rect: [0, 0, 60, 40], margin: 20, side: 'bottom', anchor: [15, 40] },
                    target: { rect: [60, 60, 40, 20], margin: 0, side: 'right', anchor: [100, 70] },
                    opt: { minPathMargin: 5 },
                    expected: [[15, 60], [35, 60], [35, 50], [100, 50], [100, 70]]
                }
            ];

            cases.forEach(function(testCase, index) {
                assert.deepEqual(route(testCase), testCase.expected, describe(testCase, index));
            });
        });

        QUnit.test('bottom => top', function(assert) {

            const cases = [
                {
                    source: { rect: [0, 0, 60, 60], margin: 10, side: 'bottom', anchor: [30, 60] },
                    target: { rect: [30, 10, 20, 40], margin: 20, side: 'top', anchor: [50, 10] },
                    expected: [[30, 70], [40, 70], [40, -10], [50, -10]]
                },
                {
                    source: { rect: [0, 0, 0, 20], margin: 20, side: 'bottom', anchor: [0, 20] },
                    target: { rect: [60, 50, 40, 60], margin: 0, side: 'top', anchor: [80, 80] },
                    expected: [[0, 45], [80, 45]]
                },
                {
                    source: { rect: [0, 0, 40, 20], margin: 0, side: 'bottom', anchor: [40, 20] },
                    target: { rect: [-60, -10, 60, 40], margin: 10, side: 'top', anchor: [-60, -10] },
                    expected: [[40, 20], [40, 20], [40, -20], [-60, -20]]
                },
                {
                    source: { rect: [0, 0, 60, 20], margin: 20, side: 'bottom', anchor: [60, 0] },
                    target: { rect: [-40, 40, 60, 60], margin: 20, side: 'top', anchor: [-40, 40] },
                    opt: { minPathMargin: 5 },
                    expected: [[60, 40], [10, 40], [10, 20], [-40, 20]]
                }
            ];

            cases.forEach(function(testCase, index) {
                assert.deepEqual(route(testCase), testCase.expected, describe(testCase, index));
            });
        });

        QUnit.test('bottom => bottom', function(assert) {

            const cases = [
                {
                    source: { rect: [0, 0, 40, 60], margin: 0, side: 'bottom', anchor: [10, 60] },
                    target: { rect: [0, 60, 40, 0], margin: 10, side: 'bottom', anchor: [40, 60] },
                    expected: [[10, 60], [50, 60], [50, 70], [40, 70]]
                },
                {
                    source: { rect: [0, 0, 0, 0], margin: 0, side: 'bottom', anchor: [0, 0] },
                    target: { rect: [60, 0, 60, 0], margin: 20, side: 'bottom', anchor: [90, 0] },
                    expected: [[0, 20], [90, 20]]
                }
            ];

            cases.forEach(function(testCase, index) {
                assert.deepEqual(route(testCase), testCase.expected, describe(testCase, index));
            });
        });
    });

    QUnit.module('edge cases', function() {

        QUnit.test('boundaries and options', function(assert) {

            const cases = [
                {
                    name: 'targetInSourceBBox forces the U-shaped detour',
                    source: { rect: [0, 0, 100, 60], margin: 10, side: 'left', anchor: [0, 30] },
                    target: { rect: [-200, 0, 80, 40], margin: 10, side: 'left', anchor: [-200, 20] },
                    opt: { targetInSourceBBox: true },
                    expected: [[-210, 30], [-210, 20]]
                },
                {
                    name: 'the same geometry without the flag routes around instead',
                    source: { rect: [0, 0, 100, 60], margin: 10, side: 'left', anchor: [0, 30] },
                    target: { rect: [-200, 0, 80, 40], margin: 10, side: 'left', anchor: [-200, 20] },
                    expected: [[-60, 30], [-60, 50], [-210, 50], [-210, 20]]
                },
                {
                    name: 'bboxes sharing a center, different widths',
                    source: { rect: [0, 0, 100, 40], margin: 10, side: 'top', anchor: [50, 0] },
                    target: { rect: [20, 200, 60, 40], margin: 10, side: 'bottom', anchor: [50, 240] },
                    expected: [[50, -10], [110, -10], [110, 250], [50, 250]]
                },
                {
                    name: 'equally far above and below',
                    source: { rect: [0, 0, 40, 40], margin: 10, side: 'left', anchor: [0, 20] },
                    target: { rect: [200, 0, 40, 40], margin: 10, side: 'right', anchor: [240, 20] },
                    expected: [[-10, 20], [-10, 50], [250, 50], [250, 20]]
                },
                {
                    name: 'equally far left and right',
                    source: { rect: [0, 0, 40, 40], margin: 10, side: 'top', anchor: [20, 0] },
                    target: { rect: [0, 200, 40, 40], margin: 10, side: 'bottom', anchor: [20, 240] },
                    expected: [[20, -10], [50, -10], [50, 250], [20, 250]]
                },
                {
                    name: 'overlapping elements',
                    source: { rect: [0, 0, 100, 100], margin: 10, side: 'right', anchor: [100, 50] },
                    target: { rect: [50, 50, 100, 100], margin: 10, side: 'left', anchor: [50, 100] },
                    expected: [[110, 50], [110, 75], [40, 75], [40, 100]]
                },
                {
                    name: 'touching elements',
                    source: { rect: [0, 0, 100, 100], margin: 0, side: 'right', anchor: [100, 50] },
                    target: { rect: [100, 0, 100, 100], margin: 0, side: 'left', anchor: [100, 50] },
                    expected: [[100, 50], [100, 50], [100, 50], [100, 50]]
                },
                {
                    name: 'zero margins',
                    source: { rect: [0, 0, 40, 40], margin: 0, side: 'right', anchor: [40, 20] },
                    target: { rect: [100, 100, 40, 40], margin: 0, side: 'top', anchor: [120, 100] },
                    expected: [[120, 20]]
                },
                {
                    name: 'minPathMargin below both margins',
                    source: { rect: [0, 0, 40, 40], margin: 20, side: 'right', anchor: [40, 20] },
                    target: { rect: [60, 30, 40, 40], margin: 20, side: 'left', anchor: [60, 50] },
                    opt: { minPathMargin: 0 },
                    expected: [[50, 20], [50, 35], [50, 35], [50, 50]]
                },
                {
                    name: 'the same geometry without minPathMargin',
                    source: { rect: [0, 0, 40, 40], margin: 20, side: 'right', anchor: [40, 20] },
                    target: { rect: [60, 30, 40, 40], margin: 20, side: 'left', anchor: [60, 50] },
                    expected: [[60, 20], [60, 35], [40, 35], [40, 50]]
                },
                {
                    name: 'coincident anchors',
                    source: { rect: [0, 0, 40, 40], margin: 10, side: 'right', anchor: [20, 20] },
                    target: { rect: [0, 0, 40, 40], margin: 10, side: 'left', anchor: [20, 20] },
                    expected: [[50, 20], [50, 20], [-10, 20], [-10, 20]]
                },
                {
                    name: 'both ends leaving the same side, level with each other',
                    source: { rect: [0, 0, 40, 40], margin: 10, side: 'top', anchor: [20, 0] },
                    target: { rect: [100, 0, 40, 40], margin: 10, side: 'top', anchor: [120, 0] },
                    expected: [[20, -10], [120, -10]]
                },
                {
                    name: 'both ends leaving the same side, aligned on one column',
                    source: { rect: [0, 0, 40, 40], margin: 10, side: 'left', anchor: [0, 20] },
                    target: { rect: [0, 100, 40, 40], margin: 10, side: 'left', anchor: [0, 120] },
                    expected: [[-10, 20], [-10, 120]]
                },
                {
                    name: 'a zero-size source',
                    source: { rect: [50, 50, 0, 0], margin: 10, side: 'right', anchor: [50, 50] },
                    target: { rect: [200, 0, 40, 40], margin: 10, side: 'left', anchor: [200, 20] },
                    expected: [[125, 50], [125, 20]]
                },
                {
                    name: 'the target end point inside the source bbox',
                    source: { rect: [0, 0, 200, 200], margin: 10, side: 'bottom', anchor: [100, 200] },
                    target: { rect: [80, 80, 40, 40], margin: 10, side: 'right', anchor: [120, 100] },
                    expected: [[100, 210], [210, 210], [210, 100]]
                },
                {
                    name: 'the horizontal route, x1 adjustment when the elements intersect',
                    source: { rect: [0, 0, 0, 60], margin: 20, side: 'right', anchor: [0, 0] },
                    target: { rect: [-20, 20, 40, 20], margin: 10, side: 'left', anchor: [-20, 40] },
                    opt: { minPathMargin: 5, targetInSourceBBox: true },
                    expected: [[20, 0], [20, -20], [-30, -20], [-30, 40]]
                },
                {
                    name: 'the horizontal route, x2 adjustment when the elements intersect',
                    source: { rect: [0, 0, 60, 0], margin: 0, side: 'left', anchor: [0, 0] },
                    target: { rect: [30, -20, 0, 60], margin: 20, side: 'right', anchor: [30, 40] },
                    opt: { minPathMargin: 0 },
                    expected: [[0, 0], [0, 60], [50, 60], [50, 40]]
                },
                {
                    name: 'the vertical route, y1 adjustment when the elements intersect',
                    source: { rect: [0, 0, 20, 40], margin: 20, side: 'top', anchor: [10, 0] },
                    target: { rect: [40, -50, 20, 40], margin: 10, side: 'bottom', anchor: [45, -10] },
                    opt: { minPathMargin: 10, targetInSourceBBox: true },
                    expected: [[10, -20], [-20, -20], [-20, 60], [45, 60]]
                },
                {
                    name: 'the vertical route, y2 adjustment when the elements intersect',
                    source: { rect: [0, 0, 0, 60], margin: 10, side: 'top', anchor: [0, 30] },
                    target: { rect: [-20, 20, 40, 0], margin: 0, side: 'bottom', anchor: [-20, 20] },
                    opt: { minPathMargin: 30, targetInSourceBBox: true },
                    expected: [[0, -10], [-20, -10], [-20, 20], [-20, 20]]
                }
            ];

            cases.forEach(function(testCase, index) {
                assert.deepEqual(route(testCase), testCase.expected, describe(testCase, index));
            });
        });
    });

    QUnit.module('properties', function() {

        const SIDES = ['left', 'right', 'top', 'bottom'];

        // A deterministic sweep, on a coarse grid so that equal coordinates -
        // where most of the algorithm's decisions are decided - come up often.
        function sweep(count) {
            let state = 0x1234abcd;
            function random() {
                state |= 0;
                state = state + 0x6D2B79F5 | 0;
                let t = Math.imul(state ^ state >>> 15, 1 | state);
                t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
                return ((t ^ t >>> 14) >>> 0) / 4294967296;
            }
            function pick(values) {
                return values[Math.floor(random() * values.length)];
            }

            const SIZES = [0, 20, 40, 60];
            const OFFSETS = [-80, -50, -20, 0, 20, 50, 80];
            const MARGINS = [0, 10, 20];
            const cases = [];

            // The router runs the route to an anchor on the side it leaves
            // through, so put the anchors there rather than anywhere.
            function end(rect) {
                const side = pick(SIDES);
                const x0 = rect[0], y0 = rect[1], x1 = x0 + rect[2], y1 = y0 + rect[3];
                const t = pick([0, 0.5, 1]);
                let anchor;
                switch (side) {
                    case 'left': anchor = [x0, y0 + t * rect[3]]; break;
                    case 'right': anchor = [x1, y0 + t * rect[3]]; break;
                    case 'top': anchor = [x0 + t * rect[2], y0]; break;
                    case 'bottom': anchor = [x0 + t * rect[2], y1]; break;
                }
                return { rect: rect, margin: pick(MARGINS), side: side, anchor: anchor };
            }

            for (let i = 0; i < count; i++) {
                cases.push({
                    source: end([0, 0, pick(SIZES), pick(SIZES)]),
                    target: end([pick(OFFSETS), pick(OFFSETS), pick(SIZES), pick(SIZES)]),
                    opt: { minPathMargin: pick([undefined, 0, 5, 30]), targetInSourceBBox: random() < 0.2 }
                });
            }

            return cases;
        }

        // Where the route actually starts and ends - `margin` outside the bbox,
        // on the side it goes through. The returned points do not have to
        // include these two (the router treats them as vertices between the
        // link's own ends), but the route through them has to stay orthogonal.
        function outsidePoint({ rect, margin, side, anchor }) {
            const x0 = rect[0], y0 = rect[1], x1 = x0 + rect[2], y1 = y0 + rect[3];
            switch (side) {
                case 'left': return [x0 - margin, anchor[1]];
                case 'right': return [x1 + margin, anchor[1]];
                case 'top': return [anchor[0], y0 - margin];
                case 'bottom': return [anchor[0], y1 + margin];
            }
        }

        function report(assert, failures, total, message) {
            assert.equal(
                failures.length,
                0,
                failures.length
                    ? `${message} - ${failures.length} of ${total} failed, first: ${failures[0]}`
                    : `${message} (${total} cases)`
            );
        }

        QUnit.test('every side combination returns a route', function(assert) {

            SIDES.forEach(function(sourceSide) {
                SIDES.forEach(function(targetSide) {
                    const points = route({
                        source: { rect: [0, 0, 100, 60], margin: 10, side: sourceSide, anchor: [50, 30] },
                        target: { rect: [300, 200, 80, 40], margin: 20, side: targetSide, anchor: [340, 220] }
                    });
                    assert.ok(points.length > 0, `${sourceSide} => ${targetSide} returns at least one point`);
                });
            });
        });

        QUnit.test('an unknown side returns nothing', function(assert) {

            const points = joint.alg.rightAnglePath(
                makeEnd({ rect: [0, 0, 100, 60], margin: 10, side: 'sideways', anchor: [50, 30] }),
                makeEnd({ rect: [300, 200, 80, 40], margin: 20, side: 'left', anchor: [300, 220] })
            );

            assert.strictEqual(points, undefined);
        });

        QUnit.test('the whole route is orthogonal', function(assert) {

            const cases = sweep(3000);
            const failures = [];

            cases.forEach(function(testCase, index) {
                // The offset points bracket the returned ones: every step of
                // that polyline has to run along one axis only.
                const polyline = [outsidePoint(testCase.source)]
                    .concat(route(testCase))
                    .concat([outsidePoint(testCase.target)]);

                for (let i = 1; i < polyline.length; i++) {
                    const from = polyline[i - 1];
                    const to = polyline[i];
                    if (from[0] !== to[0] && from[1] !== to[1]) {
                        failures.push(`${describe(testCase, index)} - step ${i} from [${from}] to [${to}]`);
                        return;
                    }
                }
            });

            report(assert, failures, cases.length, 'every step runs along one axis');
        });

        QUnit.test('every coordinate is a finite number', function(assert) {

            const cases = sweep(3000);
            const failures = [];

            cases.forEach(function(testCase, index) {
                const points = route(testCase);
                if (points.length === 0) {
                    failures.push(`${describe(testCase, index)} - empty route`);
                    return;
                }
                const bad = points.some(function(point) {
                    return !Number.isFinite(point[0]) || !Number.isFinite(point[1]);
                });
                if (bad) failures.push(`${describe(testCase, index)} - ${JSON.stringify(points)}`);
            });

            report(assert, failures, cases.length, 'all coordinates finite');
        });

        QUnit.test('a route never needs more than five points', function(assert) {

            const cases = sweep(3000);
            const failures = [];

            cases.forEach(function(testCase, index) {
                const points = route(testCase);
                if (points.length > 5) failures.push(`${describe(testCase, index)} - ${points.length} points`);
            });

            report(assert, failures, cases.length, 'at most five points');
        });

        QUnit.test('scaling the input scales the route', function(assert) {

            // The algorithm has no lengths of its own: multiply every
            // coordinate, size and margin by the same factor and the route it
            // picks has to come out multiplied by that factor too. Anything
            // that broke this would be an absolute constant hiding in a
            // comparison.
            const SCALE = 3;
            const cases = sweep(1000);
            const failures = [];

            function scaleEnd(end) {
                return {
                    rect: end.rect.map(function(n) { return n * SCALE; }),
                    margin: end.margin * SCALE,
                    side: end.side,
                    anchor: end.anchor.map(function(n) { return n * SCALE; })
                };
            }

            cases.forEach(function(testCase, index) {
                const expected = route(testCase).map(function(point) {
                    return [point[0] * SCALE, point[1] * SCALE];
                });
                const scaled = route({
                    source: scaleEnd(testCase.source),
                    target: scaleEnd(testCase.target),
                    opt: {
                        minPathMargin: testCase.opt.minPathMargin === undefined
                            ? undefined
                            : testCase.opt.minPathMargin * SCALE,
                        targetInSourceBBox: testCase.opt.targetInSourceBBox
                    }
                });

                if (JSON.stringify(scaled) !== JSON.stringify(expected)) {
                    failures.push(`${describe(testCase, index)} - got ${JSON.stringify(scaled)}, `
                        + `expected ${JSON.stringify(expected)}`);
                }
            });

            report(assert, failures, cases.length, 'the route scales with the input');
        });
    });
});
