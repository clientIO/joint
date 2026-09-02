QUnit.module('sanity check', () => {
    QUnit.test('should load', assert => {
        assert.ok(typeof joint.layout.ELK !== 'undefined');
        assert.ok(typeof joint.layout.ELK.layout === 'function');
    });
});

QUnit.module('layout()', () => {

    function createGraph() {
        const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        const el1 = new joint.shapes.standard.Rectangle({ id: 'a', size: { width: 100, height: 100 }});
        const el2 = new joint.shapes.standard.Rectangle({ id: 'b', size: { width: 100, height: 100 }});
        const el3 = new joint.shapes.standard.Rectangle({ id: 'c', size: { width: 100, height: 100 }});
        const el4 = new joint.shapes.standard.Rectangle({ id: 'd', size: { width: 100, height: 100 }});

        const link1 = new joint.shapes.standard.Link({ source: { id: el1.id }, target: { id: el2.id }});
        const link2 = new joint.shapes.standard.Link({ source: { id: el1.id }, target: { id: el3.id }});
        const link3 = new joint.shapes.standard.Link({ source: { id: el2.id }, target: { id: el4.id }});
        const link4 = new joint.shapes.standard.Link({ source: { id: el3.id }, target: { id: el4.id }});

        graph.resetCells([el1, el2, el3, el4, link1, link2, link3, link4]);

        return { graph, el1, el2, el3, el4 };
    }

    QUnit.test('should position elements without overlapping them', async(assert) => {

        const { graph, el1, el2, el3, el4 } = createGraph();

        const initialBBox = graph.getBBox();
        assert.equal(initialBBox.x, 0);
        assert.equal(initialBBox.y, 0);

        const { bbox } = await joint.layout.ELK.layout(graph);

        assert.ok(bbox.width > 0);
        assert.ok(bbox.height > 0);

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

    QUnit.test('should route links and set vertices/anchors', async(assert) => {

        const { graph } = createGraph();

        await joint.layout.ELK.layout(graph, {
            layoutOptions: {
                'elk.algorithm': 'layered',
                'elk.direction': 'RIGHT',
                'elk.edgeRouting': 'ORTHOGONAL'
            }
        });

        graph.getLinks().forEach((link) => {
            assert.ok(Array.isArray(link.vertices()));
            assert.equal(link.prop('source/anchor/name'), 'topLeft');
            assert.equal(link.prop('target/anchor/name'), 'topLeft');
        });
    });

    QUnit.test('should position labelled links', async(assert) => {

        const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        const el1 = new joint.shapes.standard.Rectangle({ id: 'a', size: { width: 100, height: 100 }});
        const el2 = new joint.shapes.standard.Rectangle({ id: 'b', size: { width: 100, height: 100 }});
        const link = new joint.shapes.standard.Link({
            source: { id: el1.id },
            target: { id: el2.id },
            labels: [{ size: { width: 40, height: 20 }}]
        });

        graph.resetCells([el1, el2, link]);

        await joint.layout.ELK.layout(graph);

        const label = link.label(0);
        assert.ok(label.position && typeof label.position.distance === 'number');
    });

    QUnit.test('should ignore embedded elements', async(assert) => {

        const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        const parent = new joint.shapes.standard.Rectangle({ id: 'parent', size: { width: 200, height: 200 }, position: { x: 10, y: 10 }});
        const child = new joint.shapes.standard.Rectangle({ id: 'child', size: { width: 50, height: 50 }, position: { x: 60, y: 60 }});
        parent.embed(child);

        graph.resetCells([parent, child]);

        await joint.layout.ELK.layout(graph);

        const position = child.position();
        assert.equal(position.x, 60);
        assert.equal(position.y, 60);
    });
});
