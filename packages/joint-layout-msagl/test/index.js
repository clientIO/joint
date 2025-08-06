QUnit.module('sanity check', () => {
    QUnit.test('should load', assert => {
        assert.ok(typeof joint.layout.MSAGL !== 'undefined');
        assert.ok(typeof joint.layout.MSAGL.layout === 'function');
    });

    QUnit.test('should provide option enums', (assert) => {
        assert.ok(typeof joint.layout.MSAGL.LayerDirectionEnum !== 'undefined');
        assert.ok(typeof joint.layout.MSAGL.EdgeRoutingMode !== 'undefined');
    });

    QUnit.test('should position elements without overlapping them', (assert) => {
        const graph = new joint.dia.Graph();
        const el1 = new joint.shapes.standard.Rectangle({ size: { width: 100, height: 100 }});
        const el2 = new joint.shapes.standard.Rectangle({ size: { width: 100, height: 100 }});
        const el3 = new joint.shapes.standard.Rectangle({ size: { width: 100, height: 100 }});
        const el4 = new joint.shapes.standard.Rectangle({ size: { width: 100, height: 100 }});

        const link1 = new joint.shapes.standard.Link({ source: { id: el1.id }, target: { id: el2.id }});
        const link2 = new joint.shapes.standard.Link({ source: { id: el1.id }, target: { id: el3.id }});
        const link3 = new joint.shapes.standard.Link({ source: { id: el2.id }, target: { id: el4.id }});
        const link4 = new joint.shapes.standard.Link({ source: { id: el3.id }, target: { id: el4.id }});

        graph.resetCells([el1, el2, el3, el4, link1, link2, link3, link4]);

        const initialBBox = graph.getBBox();
        assert.equal(initialBBox.x, 0);
        assert.equal(initialBBox.y, 0);
        assert.equal(initialBBox.width, 100);
        assert.equal(initialBBox.height, 100);

        const bbox = joint.layout.MSAGL.layout(graph);

        assert.notDeepEqual(bbox, initialBBox);

        // Rectangle bounding boxes are not overlapping
        const boundaries = [
            el1.getBBox(),
            el2.getBBox(),
            el3.getBBox(),
            el4.getBBox()
        ];

        const overlaps = boundaries.some((box, i) =>
            boundaries.slice(i + 1).some(other => joint.g.intersection.exists(box, other))
        );

        assert.ok(!overlaps);
    });
});
