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

QUnit.module('layers support', () => {

    QUnit.test('should work when layout cells have layers', function(assert) {

        const el1 = new joint.shapes.standard.Rectangle({
            id: '1',
            layer: 'layer1',
            position: { x: 0, y: 0 },
            size: { width: 60, height: 100 },
        });
        const el2 = new joint.shapes.standard.Rectangle({
            id: '2',
            // default layer
            position: { x: 0, y: 0 },
            size: { width: 40, height: 80 },
        });
        const link = new joint.shapes.standard.Link({
            id: 'link',
            layer: 'layer2',
            source: { id: el1.id },
            target: { id: el2.id },
        });

        joint.layout.MSAGL.layout([el1, el2, link], {
            x: 1,
            y: 1,
            layerDirection: joint.layout.MSAGL.LayerDirectionEnum.LR
        });

        assert.ok(el1.position().x > 0 && el1.position().y > 0);
        assert.ok(el2.position().x > 0 && el2.position().y > 0);
    });

    QUnit.test('should work when the layout graph has layers', function(assert) {

        const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        graph.addLayer({ id: 'layer1' });
        graph.addLayer({ id: 'layer2' });

        const el1 = new joint.shapes.standard.Rectangle({
            id: '1',
            layer: 'layer1',
            position: { x: 0, y: 0 },
            size: { width: 40, height: 100 },
        });
        const el2 = new joint.shapes.standard.Rectangle({
            id: '2',
            // default layer
            position: { x: 0, y: 0 },
            size: { width: 40, height: 100 },
        });
        const link = new joint.shapes.standard.Link({
            id: 'link',
            layer: 'layer2',
            source: { id: el1.id },
            target: { id: el2.id },
        });

        graph.addCells([el1, el2, link]);

        joint.layout.MSAGL.layout(graph, {
            x: 1,
            y: 1,
            layerDirection: joint.layout.MSAGL.LayerDirectionEnum.LR
        });

        assert.ok(el1.position().x > 0 && el1.position().y > 0);
        assert.ok(el2.position().x > 0 && el2.position().y > 0);
        assert.ok(el1.position().x < el2.position().x);
    });

});
