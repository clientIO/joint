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

    QUnit.test('should lay out embedded elements (containers) and resize their parent to fit them', async(assert) => {

        const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        const parent = new joint.shapes.standard.Rectangle({ id: 'parent', size: { width: 10, height: 10 }, position: { x: 0, y: 0 }});
        const child1 = new joint.shapes.standard.Rectangle({ id: 'child1', size: { width: 50, height: 50 }});
        const child2 = new joint.shapes.standard.Rectangle({ id: 'child2', size: { width: 50, height: 50 }});
        const childLink = new joint.shapes.standard.Link({ source: { id: 'child1' }, target: { id: 'child2' }});
        parent.embed(child1);
        parent.embed(child2);

        graph.resetCells([parent, child1, child2, childLink]);

        await joint.layout.ELK.layout(graph);

        const parentBBox = parent.getBBox();
        const child1BBox = child1.getBBox();
        const child2BBox = child2.getBBox();

        // The parent is resized (and positioned) by ELK to fit its content.
        assert.ok(parentBBox.width >= child1BBox.width + child2BBox.width);
        assert.ok(parentBBox.containsPoint(child1BBox.center()));
        assert.ok(parentBBox.containsPoint(child2BBox.center()));
        assert.ok(!joint.g.intersection.exists(child1BBox, child2BBox));
    });

    QUnit.test('should route a link crossing a container boundary', async(assert) => {

        const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        const parent = new joint.shapes.standard.Rectangle({ id: 'parent', size: { width: 10, height: 10 }});
        const child = new joint.shapes.standard.Rectangle({ id: 'child', size: { width: 50, height: 50 }});
        const outside = new joint.shapes.standard.Rectangle({ id: 'outside', size: { width: 50, height: 50 }});
        const link = new joint.shapes.standard.Link({ source: { id: 'child' }, target: { id: 'outside' }});
        parent.embed(child);

        graph.resetCells([parent, child, outside, link]);

        await joint.layout.ELK.layout(graph);

        assert.ok(Array.isArray(link.vertices()));
        assert.ok(!joint.g.intersection.exists(parent.getBBox(), outside.getBBox()));
    });

    QUnit.test('should route links to/from ports without overriding their anchor', async(assert) => {

        const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        const el1 = new joint.shapes.standard.Rectangle({
            id: 'a',
            size: { width: 100, height: 100 },
            ports: {
                groups: {
                    out: { position: 'right' }
                },
                items: [{ id: 'out1', group: 'out' }]
            }
        });
        const el2 = new joint.shapes.standard.Rectangle({
            id: 'b',
            size: { width: 100, height: 100 },
            ports: {
                groups: {
                    in: { position: 'left' }
                },
                items: [{ id: 'in1', group: 'in' }]
            }
        });
        const link = new joint.shapes.standard.Link({
            source: { id: 'a', port: 'out1' },
            target: { id: 'b', port: 'in1' }
        });

        graph.resetCells([el1, el2, link]);

        await joint.layout.ELK.layout(graph);

        assert.notOk(link.prop('source/anchor'));
        assert.notOk(link.prop('target/anchor'));
        assert.ok(Array.isArray(link.vertices()));
    });

    QUnit.test('should call portOptions for each port', async(assert) => {

        const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        const el1 = new joint.shapes.standard.Rectangle({
            id: 'a',
            size: { width: 100, height: 100 },
            ports: {
                groups: {
                    out: { position: 'right' }
                },
                items: [{ id: 'out1', group: 'out' }]
            }
        });
        const el2 = new joint.shapes.standard.Rectangle({ id: 'b', size: { width: 100, height: 100 }});
        const link = new joint.shapes.standard.Link({ source: { id: 'a', port: 'out1' }, target: { id: 'b' }});

        graph.resetCells([el1, el2, link]);

        const seen = [];
        await joint.layout.ELK.layout(graph, {
            portOptions: (port, element) => {
                seen.push([port.id, element.id]);
                return undefined;
            }
        });

        assert.deepEqual(seen, [['out1', 'a']]);
    });

    QUnit.test('should keep ports at their JointJS-computed position by default', async(assert) => {

        const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        const el1 = new joint.shapes.standard.Rectangle({
            id: 'a',
            size: { width: 100, height: 100 },
            ports: {
                groups: {
                    out: { position: 'right' }
                },
                items: [{ id: 'out1', group: 'out' }]
            }
        });

        graph.resetCells([el1]);

        await joint.layout.ELK.layout(graph);

        // Untouched - still the original group config, not switched to 'absolute'.
        assert.equal(el1.prop(['ports', 'groups', 'out', 'position']), 'right');
    });

    QUnit.test('should let ELK position ports when `positionPorts` is enabled', async(assert) => {

        const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        const el1 = new joint.shapes.standard.Rectangle({
            id: 'a',
            size: { width: 100, height: 100 },
            ports: {
                groups: {
                    out: { position: 'right' }
                },
                items: [{ id: 'out1', group: 'out' }]
            }
        });
        const el2 = new joint.shapes.standard.Rectangle({
            id: 'b',
            size: { width: 100, height: 100 },
            ports: {
                groups: {
                    in: { position: 'left' }
                },
                items: [{ id: 'in1', group: 'in' }]
            }
        });
        const link = new joint.shapes.standard.Link({
            source: { id: 'a', port: 'out1' },
            target: { id: 'b', port: 'in1' }
        });

        graph.resetCells([el1, el2, link]);

        await joint.layout.ELK.layout(graph, { positionPorts: true });

        // The group's position is switched to 'absolute' so the ELK-computed position applies.
        assert.equal(el1.prop(['ports', 'groups', 'out', 'position', 'name']), 'absolute');
        assert.equal(el2.prop(['ports', 'groups', 'in', 'position', 'name']), 'absolute');

        const position = el1.portProp('out1', ['position', 'args']);
        assert.equal(typeof position.x, 'number');
        assert.equal(typeof position.y, 'number');

        // The port's rendered position reflects the position ELK computed for it.
        const relativePosition = el1.getPortRelativePosition('out1');
        assert.equal(relativePosition.x, position.x);
        assert.equal(relativePosition.y, position.y);
    });
});
