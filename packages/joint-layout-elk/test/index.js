QUnit.module('sanity check', () => {
    QUnit.test('should load', assert => {
        assert.ok(typeof joint.layout.ELK !== 'undefined');
        assert.ok(typeof joint.layout.ELK.layout === 'function');
    });
});

// First: main-thread ELK is loaded once, then shared by every later layout.
QUnit.module('loading main-thread ELK', (hooks) => {

    hooks.after(() => {
        delete window.__loadMainThreadElk;
    });

    QUnit.test('should load it again on the next layout after it failed to load', async(assert) => {

        const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        const el1 = new joint.shapes.standard.Rectangle({ id: 'a', size: { width: 100, height: 100 }});
        const el2 = new joint.shapes.standard.Rectangle({ id: 'b', size: { width: 100, height: 100 }});
        graph.resetCells([el1, el2]);

        // E.g. a chunk that failed to load.
        const error = new Error('chunk failed to load');
        window.__loadMainThreadElk = () => Promise.reject(error);
        await assert.rejects(joint.layout.ELK.layout({ graph }), error);
        assert.ok(joint.g.intersection.exists(el1.getBBox(), el2.getBBox()));

        delete window.__loadMainThreadElk;
        await joint.layout.ELK.layout({ graph });
        assert.notOk(joint.g.intersection.exists(el1.getBBox(), el2.getBBox()));
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

        const { bbox } = await joint.layout.ELK.layout({ graph });

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

        await joint.layout.ELK.layout({ graph }, {
            elkLayoutOptions: {
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

        await joint.layout.ELK.layout({ graph });

        const label = link.label(0);
        assert.ok(label.position && typeof label.position.distance === 'number');
    });

    QUnit.test('should size a link label from `defaultLabel` when the label\'s own `size` is not set', async(assert) => {

        const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        const el1 = new joint.shapes.standard.Rectangle({ id: 'a', size: { width: 100, height: 100 }});
        const el2 = new joint.shapes.standard.Rectangle({ id: 'b', size: { width: 100, height: 100 }});
        const link = new joint.shapes.standard.Link({
            source: { id: el1.id },
            target: { id: el2.id },
            defaultLabel: { size: { width: 80, height: 20 }},
            // No own `size` - resolved only through `defaultLabel` (see `Link#labels`).
            labels: [{}]
        });

        graph.resetCells([el1, el2, link]);

        const { elkGraph } = await joint.layout.ELK.layout({ graph });

        const [elkEdge] = elkGraph.edges;
        assert.equal(elkEdge.labels[0].width, 80);
        assert.equal(elkEdge.labels[0].height, 20);
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

        await joint.layout.ELK.layout({ graph });

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

        await joint.layout.ELK.layout({ graph });

        assert.ok(Array.isArray(link.vertices()));
        assert.ok(!joint.g.intersection.exists(parent.getBBox(), outside.getBBox()));
    });

    QUnit.test('should place a link inside nested containers using ELK\'s graph-absolute edge coordinates', async(assert) => {

        const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        const outer = new joint.shapes.standard.Rectangle({ id: 'outer', size: { width: 10, height: 10 }});
        const inner = new joint.shapes.standard.Rectangle({ id: 'inner', size: { width: 10, height: 10 }});
        const a = new joint.shapes.standard.Rectangle({ id: 'a', size: { width: 60, height: 40 }});
        const b = new joint.shapes.standard.Rectangle({ id: 'b', size: { width: 60, height: 80 }});
        const link = new joint.shapes.standard.Link({
            source: { id: 'a' },
            target: { id: 'b' },
            labels: [{ size: { width: 30, height: 12 }}]
        });
        outer.embed(inner);
        inner.embed(a);
        inner.embed(b);

        graph.resetCells([outer, inner, a, b, link]);

        const { elkGraph } = await joint.layout.ELK.layout({ graph }, {
            elkLayoutOptions: {
                'elk.padding': '[top=40,left=20,bottom=20,right=20]'
            }
        });

        assert.equal(elkGraph.layoutOptions['elk.json.edgeCoords'], 'ROOT');

        const elkInner = elkGraph.children[0].children[0];
        const [elkEdge] = elkInner.edges;
        const { startPoint, endPoint } = elkEdge.sections[0];

        // ELK's own (graph-absolute) end points land on the laid out elements' borders -
        // relative to `inner`, they'd be off by both containers' offsets.
        assert.ok(a.getBBox().inflate(1).containsPoint(startPoint));
        assert.ok(b.getBBox().inflate(1).containsPoint(endPoint));

        // ...and are applied as they are: each end's anchor resolves to that same point.
        const { dx, dy } = link.source().anchor.args;
        assert.deepEqual(a.position().offset(dx, dy).toJSON(), { x: startPoint.x, y: startPoint.y });

        // The label stays on the link's path.
        const [label] = link.labels();
        assert.ok(Math.abs(label.position.offset) < 30);
    });

    QUnit.test('should let `elkLayoutOptions` override `elk.json.edgeCoords`', async(assert) => {

        const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        const el1 = new joint.shapes.standard.Rectangle({ id: 'a', size: { width: 50, height: 50 }});
        const el2 = new joint.shapes.standard.Rectangle({ id: 'b', size: { width: 50, height: 50 }});
        const link = new joint.shapes.standard.Link({ source: { id: 'a' }, target: { id: 'b' }});

        graph.resetCells([el1, el2, link]);

        const { elkGraph } = await joint.layout.ELK.layout({ graph }, {
            elkLayoutOptions: { 'elk.json.edgeCoords': 'CONTAINER' }
        });

        assert.equal(elkGraph.layoutOptions['elk.json.edgeCoords'], 'CONTAINER');
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

        await joint.layout.ELK.layout({ graph });

        assert.notOk(link.prop('source/anchor'));
        assert.notOk(link.prop('target/anchor'));
        assert.ok(Array.isArray(link.vertices()));
    });

    QUnit.test('should call exportPort for each port', async(assert) => {

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
        await joint.layout.ELK.layout({ graph }, {
            exportPort: ({ portId, element }) => {
                seen.push([portId, element.id]);
            }
        });

        assert.deepEqual(seen, [['out1', 'a']]);
    });

    QUnit.test('should let exportElement/exportPort/exportLink add to the computed layoutOptions without losing it', async(assert) => {

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

        // Each callback mutates the draft it's given in place, rather than returning a
        // value to merge - so what this package itself already put on that same draft
        // (e.g. an `elkNode`/`elkPort`'s own `width`) survives
        // alongside whatever the callback itself adds.
        const { elkGraph } = await joint.layout.ELK.layout({ graph }, {
            exportElement: ({ elkNode }) => {
                elkNode.layoutOptions['elk.portConstraints'] = 'FIXED_SIDE';
                elkNode.layoutOptions['elk.custom'] = 'node';
            },
            exportPort: ({ elkPort }) => {
                elkPort.layoutOptions['elk.custom'] = 'port';
            },
            exportLink: ({ elkEdge }) => {
                elkEdge.layoutOptions['elk.custom'] = 'edge';
            }
        });

        const elkNode = elkGraph.children.find((node) => node.id === 'a');
        assert.equal(elkNode.layoutOptions['elk.custom'], 'node');
        assert.equal(elkNode.layoutOptions['elk.portConstraints'], 'FIXED_SIDE');
        assert.equal(typeof elkNode.width, 'number');

        const elkPort = elkNode.ports.find((port) => port.id === 'a:out1');
        assert.equal(elkPort.layoutOptions['elk.custom'], 'port');
        assert.equal(typeof elkPort.width, 'number');

        const [elkEdge] = elkGraph.edges;
        assert.equal(elkEdge.layoutOptions['elk.custom'], 'edge');
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

        // An incoming edge to a port on the right - ELK would move the port to the left
        // side if it were free to.
        const el2 = new joint.shapes.standard.Rectangle({ id: 'b', size: { width: 100, height: 100 }});
        const link = new joint.shapes.standard.Link({ source: { id: 'b' }, target: { id: 'a', port: 'out1' }});

        graph.resetCells([el1, el2, link]);

        const portPosition = el1.getPortsPositions('out').out1;

        const { elkGraph } = await joint.layout.ELK.layout({ graph });

        assert.equal(elkGraph.children.find((node) => node.id === 'a').layoutOptions['elk.portConstraints'], 'FIXED_POS');
        assert.notOk(elkGraph.children.find((node) => node.id === 'b').layoutOptions['elk.portConstraints']);
        // Untouched - still the original group config, not switched to 'absolute'.
        assert.equal(el1.prop(['ports', 'groups', 'out', 'position']), 'right');
        // Still on the right side, where JointJS placed it.
        const { x, y } = el1.getPortsPositions('out').out1;
        assert.deepEqual({ x, y }, { x: portPosition.x, y: portPosition.y });
    });

    QUnit.test('should let ELK position ports when `exportElement` opts a node into `FIXED_SIDE`', async(assert) => {

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

        await joint.layout.ELK.layout({ graph }, {
            exportElement: ({ elkNode }) => {
                elkNode.layoutOptions['elk.portConstraints'] = 'FIXED_SIDE';
            }
        });

        // The group config itself is untouched - a built-in position function
        // ('right'/'left'/'top'/'bottom') already prioritizes a port's own
        // `position.args`, set below, over its own even-spacing fallback, so there's no
        // need to switch it to 'absolute' for the ELK-computed position to apply.
        assert.equal(el1.prop(['ports', 'groups', 'out', 'position']), 'right');
        assert.equal(el2.prop(['ports', 'groups', 'in', 'position']), 'left');

        const position = el1.portProp('out1', ['position', 'args']);
        assert.equal(typeof position.x, 'number');
        assert.equal(typeof position.y, 'number');

        // The port's rendered position reflects the position ELK computed for it.
        const relativePosition = el1.getPortRelativePosition('out1');
        assert.equal(relativePosition.x, position.x);
        assert.equal(relativePosition.y, position.y);
    });

    QUnit.test('should keep a port where it is under FIXED_POS port constraints', async(assert) => {

        const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        const el1 = new joint.shapes.standard.Rectangle({
            id: 'a',
            size: { width: 100, height: 60 },
            ports: {
                groups: {
                    right: { position: 'right', size: { width: 20, height: 10 }}
                },
                items: [{ id: 'right1', group: 'right' }]
            }
        });
        const el2 = new joint.shapes.standard.Rectangle({ id: 'b', size: { width: 100, height: 60 }});
        const link = new joint.shapes.standard.Link({ source: { id: 'a', port: 'right1' }, target: { id: 'b' }});

        graph.resetCells([el1, el2, link]);

        const before = el1.getPortRelativePosition('right1');

        await joint.layout.ELK.layout({ graph }, {
            exportElement: ({ elkNode }) => {
                elkNode.layoutOptions['elk.portConstraints'] = 'FIXED_POS';
            }
        });

        const after = el1.getPortRelativePosition('right1');
        assert.deepEqual({ x: after.x, y: after.y }, { x: before.x, y: before.y });
    });

    QUnit.test('should center a non-square port on whichever side ELK puts it', async(assert) => {

        const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        // 'absolute' with no args - every port starts at the element's corner, so only
        // `elk.port.side` (not the port's own position) says which side it belongs to.
        const group = { position: { name: 'absolute' }, size: { width: 14, height: 8 }};
        const el1 = new joint.shapes.standard.Rectangle({
            id: 'a',
            size: { width: 130, height: 50 },
            ports: {
                groups: { in: group, out: group },
                items: [{ id: 'in1', group: 'in' }, { id: 'out1', group: 'out' }]
            }
        });
        const el2 = new joint.shapes.standard.Rectangle({ id: 'b', size: { width: 100, height: 40 }});
        const el3 = new joint.shapes.standard.Rectangle({ id: 'c', size: { width: 100, height: 40 }});
        const link1 = new joint.shapes.standard.Link({ source: { id: 'b' }, target: { id: 'a', port: 'in1' }});
        const link2 = new joint.shapes.standard.Link({ source: { id: 'a', port: 'out1' }, target: { id: 'c' }});

        graph.resetCells([el1, el2, el3, link1, link2]);

        await joint.layout.ELK.layout({ graph }, {
            exportElement: ({ element, elkNode }) => {
                if (element.hasPorts()) elkNode.layoutOptions['elk.portConstraints'] = 'FIXED_SIDE';
            },
            exportPort: ({ portId, elkPort }) => {
                elkPort.layoutOptions['elk.port.side'] = (portId === 'in1') ? 'WEST' : 'SOUTH';
            }
        });

        // Each port's center sits on its border, in the middle of that side.
        assert.deepEqual(el1.portProp('in1', ['position', 'args']), { x: 0, y: 25 });
        assert.deepEqual(el1.portProp('out1', ['position', 'args']), { x: 65, y: 50 });
    });

    QUnit.test('should keep a port\'s rendered position stable across repeated `layout()` calls', async(assert) => {

        const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        // A non-zero port `size` is essential here - it's what the center/top-left mismatch
        // this test guards against gets applied to (a zero-sized port can't reveal it).
        const el1 = new joint.shapes.standard.Rectangle({
            id: 'a',
            size: { width: 100, height: 100 },
            ports: {
                groups: {
                    out: { position: 'right', size: { width: 12, height: 12 }}
                },
                items: [{ id: 'out1', group: 'out' }]
            }
        });
        const el2 = new joint.shapes.standard.Rectangle({
            id: 'b',
            size: { width: 100, height: 100 },
            ports: {
                groups: {
                    in: { position: 'left', size: { width: 12, height: 12 }}
                },
                items: [{ id: 'in1', group: 'in' }]
            }
        });
        const link = new joint.shapes.standard.Link({
            source: { id: 'a', port: 'out1' },
            target: { id: 'b', port: 'in1' }
        });

        graph.resetCells([el1, el2, link]);

        await joint.layout.ELK.layout({ graph });
        const firstPosition = el1.getPortRelativePosition('out1');

        // Laying out the same, already laid out graph again should not move the
        // port any further - each call is independent, not cumulative.
        await joint.layout.ELK.layout({ graph });
        const secondPosition = el1.getPortRelativePosition('out1');

        assert.equal(secondPosition.x, firstPosition.x);
        assert.equal(secondPosition.y, firstPosition.y);
    });

    QUnit.test('should let exportElement read a node\'s own custom property into its computed layoutOptions', async(assert) => {

        const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        const parent = new joint.shapes.standard.Rectangle({
            id: 'parent',
            size: { width: 10, height: 10 },
            // A plain custom property - this package has no built-in name/convention for
            // one, `exportElement` (below) reads it explicitly.
            elkLayoutOptions: { 'elk.padding': '[top=40,left=20,bottom=20,right=20]' }
        });
        const child = new joint.shapes.standard.Rectangle({ id: 'child', size: { width: 50, height: 50 }});
        parent.embed(child);

        graph.resetCells([parent, child]);

        const { elkGraph } = await joint.layout.ELK.layout({ graph }, {
            exportElement: ({ element, elkNode }) => {
                Object.assign(elkNode.layoutOptions, element.get('elkLayoutOptions'));
            }
        });

        const parentNode = elkGraph.children.find((node) => node.id === 'parent');
        assert.equal(parentNode.layoutOptions['elk.padding'], '[top=40,left=20,bottom=20,right=20]');
    });

    QUnit.test('should let exportLinkLabel read a link label\'s own custom property into its computed layoutOptions', async(assert) => {

        const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        const el1 = new joint.shapes.standard.Rectangle({ id: 'a', size: { width: 100, height: 100 }});
        const el2 = new joint.shapes.standard.Rectangle({ id: 'b', size: { width: 100, height: 100 }});
        const link = new joint.shapes.standard.Link({
            source: { id: 'a' },
            target: { id: 'b' },
            labels: [{ size: { width: 40, height: 20 }, elkLayoutOptions: { 'elk.edgeLabels.inline': 'false' }}]
        });

        graph.resetCells([el1, el2, link]);

        const { elkGraph } = await joint.layout.ELK.layout({ graph }, {
            exportLinkLabel: ({ link, labelIndex, elkEdgeLabel }) => {
                Object.assign(elkEdgeLabel.layoutOptions, link.label(labelIndex).elkLayoutOptions);
            }
        });

        const [elkEdge] = elkGraph.edges;
        // The label's own value wins over the package's inline default.
        assert.equal(elkEdge.labels[0].layoutOptions['elk.edgeLabels.inline'], 'false');

        // The label's own raw JSON is unaffected - reading it in `exportLinkLabel` doesn't
        // write anything back.
        assert.deepEqual(link.get('labels')[0].elkLayoutOptions, { 'elk.edgeLabels.inline': 'false' });
    });

    QUnit.test('should place a link label inline by default - `exportLinkLabel` can opt one out', async(assert) => {

        const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        const el1 = new joint.shapes.standard.Rectangle({ id: 'a', size: { width: 100, height: 100 }});
        const el2 = new joint.shapes.standard.Rectangle({ id: 'b', size: { width: 100, height: 100 }});
        const link = new joint.shapes.standard.Link({
            source: { id: 'a' },
            target: { id: 'b' },
            labels: [{ size: { width: 40, height: 20 }}]
        });

        graph.resetCells([el1, el2, link]);

        const { elkGraph } = await joint.layout.ELK.layout({ graph });
        assert.equal(elkGraph.edges[0].labels[0].layoutOptions['elk.edgeLabels.inline'], 'true');

        const { elkGraph: optedOutElkGraph } = await joint.layout.ELK.layout({ graph }, {
            exportLinkLabel: ({ elkEdgeLabel }) => {
                elkEdgeLabel.layoutOptions['elk.edgeLabels.inline'] = 'false';
            }
        });
        assert.equal(optedOutElkGraph.edges[0].labels[0].layoutOptions['elk.edgeLabels.inline'], 'false');
    });

    QUnit.test('should let exportLinkLabel read a link\'s `defaultLabel`-inherited custom property for every label', async(assert) => {

        const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        const el1 = new joint.shapes.standard.Rectangle({ id: 'a', size: { width: 100, height: 100 }});
        const el2 = new joint.shapes.standard.Rectangle({ id: 'b', size: { width: 100, height: 100 }});
        const link = new joint.shapes.standard.Link({
            source: { id: 'a' },
            target: { id: 'b' },
            defaultLabel: {
                size: { width: 40, height: 20 },
                elkLayoutOptions: { 'elk.edgeLabels.inline': 'false' }
            },
            // Neither label sets its own `elkLayoutOptions` - both fall back to
            // `defaultLabel`'s, merged in by `Link#getComputedLabels()` (`@joint/core`)
            // which `exportLinkLabel` indexes into with `labelIndex` below.
            labels: [{}, {}]
        });

        graph.resetCells([el1, el2, link]);

        const { elkGraph } = await joint.layout.ELK.layout({ graph }, {
            exportLinkLabel: ({ link, labelIndex, elkEdgeLabel }) => {
                Object.assign(elkEdgeLabel.layoutOptions, link.getComputedLabels()[labelIndex].elkLayoutOptions);
            }
        });

        const [elkEdge] = elkGraph.edges;
        assert.equal(elkEdge.labels[0].layoutOptions['elk.edgeLabels.inline'], 'false');
        assert.equal(elkEdge.labels[1].layoutOptions['elk.edgeLabels.inline'], 'false');
    });

    QUnit.test('should let exportPort read a port group\'s own custom property into its computed layoutOptions', async(assert) => {

        const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        const el1 = new joint.shapes.standard.Rectangle({
            id: 'a',
            size: { width: 100, height: 100 },
            ports: {
                groups: {
                    out: { position: 'right', elkLayoutOptions: { 'elk.port.side': 'WEST' }}
                },
                items: [{ id: 'out1', group: 'out' }]
            }
        });

        graph.resetCells([el1]);

        const { elkGraph } = await joint.layout.ELK.layout({ graph }, {
            exportElement: ({ elkNode }) => {
                elkNode.layoutOptions['elk.portConstraints'] = 'FIXED_SIDE';
            },
            exportPort: ({ element, portId, elkPort }) => {
                const { group } = element.getPort(portId);
                const groupOptions = element.prop(['ports', 'groups', group, 'elkLayoutOptions']);
                Object.assign(elkPort.layoutOptions, groupOptions);
            }
        });

        const elkNode = elkGraph.children.find((node) => node.id === 'a');
        const elkPort = elkNode.ports.find((port) => port.id === 'a:out1');
        // The group's own `elk.port.side` wins over what `right` would otherwise compute.
        assert.equal(elkPort.layoutOptions['elk.port.side'], 'WEST');
    });

    QUnit.test('should size a port label via exportPortLabel, from the port\'s (or its group\'s) `label.size`', async(assert) => {

        const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        const el1 = new joint.shapes.standard.Rectangle({
            id: 'a',
            size: { width: 100, height: 100 },
            ports: {
                groups: {
                    out: { position: 'right', label: { size: { width: 99, height: 22 }}}
                },
                items: [
                    { id: 'out1', group: 'out' },
                    { id: 'out2', group: 'out', label: { size: { width: 55, height: 11 }}}
                ]
            }
        });

        graph.resetCells([el1]);

        const { elkGraph } = await joint.layout.ELK.layout({ graph }, {
            // `portProp(id, 'label/size')` only reads the port's own item data, with no
            // group fallback - `getPortMetrics` resolves it the same way `dia.Element`
            // itself does for rendering (group first, item overriding it).
            exportPortLabel: ({ element, portId, elkPortLabel }) => {
                const { width, height } = element.getPortMetrics(portId).labelSize;
                elkPortLabel.width = width;
                elkPortLabel.height = height;
            }
        });

        const elkNode = elkGraph.children.find((node) => node.id === 'a');
        const [out1Label] = elkNode.ports.find((port) => port.id === 'a:out1').labels;
        const [out2Label] = elkNode.ports.find((port) => port.id === 'a:out2').labels;

        // `out1` has no `label.size` of its own - falls back to its group's.
        assert.equal(out1Label.width, 99);
        assert.equal(out1Label.height, 22);
        // `out2`'s own `label.size` overrides its group's.
        assert.equal(out2Label.width, 55);
        assert.equal(out2Label.height, 11);
    });

    QUnit.test('should return a zero-size bbox for an empty graph', async(assert) => {

        const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });

        const { bbox, elkGraph } = await joint.layout.ELK.layout({ graph });

        assert.equal(bbox.width, 0);
        assert.equal(bbox.height, 0);
        assert.deepEqual(elkGraph.children, []);
    });

    QUnit.test('should apply the layout in a single `batchName` batch', async(assert) => {

        const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        const el1 = new joint.shapes.standard.Rectangle({ id: 'a', size: { width: 100, height: 100 }});
        graph.resetCells([el1]);

        const batches = [];
        graph.on('batch:start', ({ batchName }) => batches.push(`start:${batchName}`));
        graph.on('batch:stop', ({ batchName }) => batches.push(`stop:${batchName}`));

        await joint.layout.ELK.layout({ graph }, { batchName: 'my-layout' });

        assert.deepEqual(batches, ['start:my-layout', 'stop:my-layout']);
        assert.notOk(graph.hasActiveBatch());
    });

    QUnit.test('should close the batch when an import callback throws', async(assert) => {

        const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        const el1 = new joint.shapes.standard.Rectangle({ id: 'a', size: { width: 100, height: 100 }});
        graph.resetCells([el1]);

        const error = new Error('setElementAttributes failed');
        await assert.rejects(joint.layout.ELK.layout({ graph }, {
            setElementAttributes: () => { throw error; }
        }), error);

        assert.notOk(graph.hasActiveBatch());
    });

    QUnit.module('given a `signal`', () => {

        const isAbortError = (error) => error instanceof DOMException && error.name === 'AbortError';
        const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

        const createGraph = () => {
            const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
            const el1 = new joint.shapes.standard.Rectangle({ id: 'a', size: { width: 100, height: 100 }});
            const el2 = new joint.shapes.standard.Rectangle({ id: 'b', size: { width: 100, height: 100 }});
            const link = new joint.shapes.standard.Link({ source: { id: 'a' }, target: { id: 'b' }});
            graph.resetCells([el1, el2, link]);
            return { graph, el1, el2 };
        };

        QUnit.test('should reject without laying out anything when already aborted', async(assert) => {

            const { graph, el1, el2 } = createGraph();
            const exportElement = () => assert.ok(false, 'nothing is exported');

            await assert.rejects(joint.layout.ELK.layout({ graph }, { signal: AbortSignal.abort(), exportElement }), isAbortError);

            await wait(50);
            assert.ok(joint.g.intersection.exists(el1.getBBox(), el2.getBBox()));
        });

        QUnit.test('should reject with the signal\'s reason, and apply nothing, when aborted during the layout', async(assert) => {

            const { graph, el1, el2 } = createGraph();
            const controller = new AbortController();
            const reason = new Error('graph changed');

            const result = joint.layout.ELK.layout({ graph }, { signal: controller.signal });
            controller.abort(reason);

            await assert.rejects(result, reason);
            // ELK's own result (on the main thread, it can't be stopped) is ignored.
            await wait(100);
            assert.ok(joint.g.intersection.exists(el1.getBBox(), el2.getBBox()));
        });

        QUnit.test('should apply the layout when the signal is not aborted', async(assert) => {

            const { graph, el1, el2 } = createGraph();

            await joint.layout.ELK.layout({ graph }, { signal: new AbortController().signal });

            assert.notOk(joint.g.intersection.exists(el1.getBBox(), el2.getBBox()));
        });

        QUnit.test('should run on the main thread given `thread: main`', async(assert) => {

            const { graph, el1, el2 } = createGraph();

            await joint.layout.ELK.layout({ graph }, { thread: 'main' });

            assert.notOk(joint.g.intersection.exists(el1.getBBox(), el2.getBBox()));
        });

        QUnit.test('should reject given `thread: worker` where no worker can be used', async(assert) => {

            // No worker in the unit test bundle, unless a test hands it one.
            const { graph, el1, el2 } = createGraph();

            await assert.rejects(joint.layout.ELK.layout({ graph }, { thread: 'worker' }), /no Web Worker can be used here/);
            assert.ok(joint.g.intersection.exists(el1.getBBox(), el2.getBBox()));
        });

        QUnit.test('should reject when aborted during the layout of a custom `elk` instance', async(assert) => {

            const { graph, el1, el2 } = createGraph();
            const controller = new AbortController();

            const result = joint.layout.ELK.layout({ graph }, { elk: new window.ELK(), signal: controller.signal });
            controller.abort();

            await assert.rejects(result, isAbortError);
            await wait(100);
            assert.ok(joint.g.intersection.exists(el1.getBBox(), el2.getBBox()));
        });
    });

    QUnit.module('given `elements`/`links`', () => {

        const rect = (id, x = 500, y = 500) => new joint.shapes.standard.Rectangle({ id, size: { width: 50, height: 50 }, position: { x, y }});
        const edge = (id, source, target) => new joint.shapes.standard.Link({ id, source: { id: source }, target: { id: target }});
        const ids = (items) => (items || []).map((item) => item.id);

        QUnit.test('should lay out only the given elements and links - a link only if both its ends are given too', async(assert) => {

            const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
            const [a, b, c] = [rect('a'), rect('b'), rect('c', 1000, 1000)];
            const ab = edge('ab', 'a', 'b');
            const bc = edge('bc', 'b', 'c');
            const ac = edge('ac', 'a', 'c');
            graph.resetCells([a, b, c, ab, bc, ac]);

            const { elkGraph } = await joint.layout.ELK.layout({ graph, elements: [a, b], links: [ab, bc] });

            assert.deepEqual(ids(elkGraph.children), ['a', 'b']);
            // `bc` is given, but `c` isn't - `ac` isn't given at all.
            assert.deepEqual(ids(elkGraph.edges), ['ab']);
            // What's left out is left alone.
            assert.deepEqual(c.position().toJSON(), { x: 1000, y: 1000 });
            assert.notOk(bc.vertices().length);
            assert.notOk(ac.vertices().length);
        });

        QUnit.test('should take what isn\'t given from the graph', async(assert) => {

            const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
            const [a, b, c] = [rect('a'), rect('b'), rect('c')];
            const ab = edge('ab', 'a', 'b');
            const bc = edge('bc', 'b', 'c');
            graph.resetCells([a, b, c, ab, bc]);

            // Only `elements` - every graph link between them is laid out.
            const { elkGraph: withElements } = await joint.layout.ELK.layout({ graph, elements: [b, a] });
            assert.deepEqual(ids(withElements.children), ['b', 'a']);
            assert.deepEqual(ids(withElements.edges), ['ab']);

            // Only `links` - every graph element is laid out.
            const { elkGraph: withLinks } = await joint.layout.ELK.layout({ graph, links: [bc] });
            assert.deepEqual(ids(withLinks.children), ['a', 'b', 'c']);
            assert.deepEqual(ids(withLinks.edges), ['bc']);
        });

        QUnit.test('should follow the given order for the top-level elements and links', async(assert) => {

            const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
            const [a, b, c] = [rect('a'), rect('b'), rect('c')];
            const ab = edge('ab', 'a', 'b');
            const bc = edge('bc', 'b', 'c');
            graph.resetCells([a, b, c, ab, bc]);

            const { elkGraph } = await joint.layout.ELK.layout({ graph, elements: [c, a, b], links: [bc, ab] });

            assert.deepEqual(ids(elkGraph.children), ['c', 'a', 'b']);
            assert.deepEqual(ids(elkGraph.edges), ['bc', 'ab']);
        });

        QUnit.test('should follow the given order (and selection) for a container\'s children and edges', async(assert) => {

            const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
            const parent = rect('parent');
            const [a, b, c] = [rect('a'), rect('b'), rect('c')];
            const ab = edge('ab', 'a', 'b');
            const ba = edge('ba', 'b', 'a');
            graph.resetCells([parent, a, b, c, ab, ba]);
            parent.embed([a, b, c]);

            // `c` is embedded in `parent` but isn't given.
            const { elkGraph } = await joint.layout.ELK.layout({ graph, elements: [parent, b, a], links: [ba, ab] });

            const [elkParent] = elkGraph.children;
            assert.deepEqual(ids(elkGraph.children), ['parent']);
            assert.deepEqual(ids(elkParent.children), ['b', 'a']);
            assert.deepEqual(ids(elkParent.edges), ['ba', 'ab']);
            // `parent` is still sized by ELK to fit what's given of its content.
            assert.ok(parent.getBBox().containsRect(a.getBBox()));
            assert.ok(parent.getBBox().containsRect(b.getBBox()));
        });

        QUnit.test('should lay out an element whose parent isn\'t given as a top-level one', async(assert) => {

            const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
            const parent = rect('parent', 0, 0);
            const [a, b] = [rect('a'), rect('b')];
            const ab = edge('ab', 'a', 'b');
            graph.resetCells([parent, a, b, ab]);
            parent.embed([a, b]);
            const parentBBox = parent.getBBox();

            const { elkGraph } = await joint.layout.ELK.layout({ graph, elements: [a, b] });

            assert.deepEqual(ids(elkGraph.children), ['a', 'b']);
            assert.deepEqual(ids(elkGraph.edges), ['ab']);
            assert.notOk(elkGraph.children[0].children);
            // The parent, not given itself, isn't resized or moved.
            assert.ok(parent.getBBox().equals(parentBBox));
        });

        QUnit.test('should lay out nothing given no elements', async(assert) => {

            const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
            const [a, b] = [rect('a'), rect('b', 600, 600)];
            const ab = edge('ab', 'a', 'b');
            graph.resetCells([a, b, ab]);

            const { bbox, elkGraph } = await joint.layout.ELK.layout({ graph, elements: [] });

            assert.ok(bbox.equals(new joint.g.Rect(0, 0, 0, 0)));
            assert.deepEqual(elkGraph.children, []);
            assert.deepEqual(elkGraph.edges, []);
            assert.deepEqual(a.position().toJSON(), { x: 500, y: 500 });
            assert.notOk(ab.vertices().length);
        });
    });

    QUnit.test('should drop an element (and its subtree) when exportElement returns false', async(assert) => {

        const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        const parent = new joint.shapes.standard.Rectangle({ id: 'parent', size: { width: 10, height: 10 }});
        const child = new joint.shapes.standard.Rectangle({ id: 'child', size: { width: 50, height: 50 }});
        const other = new joint.shapes.standard.Rectangle({ id: 'other', size: { width: 50, height: 50 }});
        const link = new joint.shapes.standard.Link({ source: { id: 'child' }, target: { id: 'other' }});
        parent.embed(child);

        graph.resetCells([parent, child, other, link]);

        const { elkGraph } = await joint.layout.ELK.layout({ graph }, {
            exportElement: ({ element }) => element.id !== 'parent'
        });

        // Neither `parent` nor its embedded `child` (dropped along with it) made it in -
        // and, since `child` never did, the link connected to it wasn't routed either.
        assert.notOk(elkGraph.children.some((node) => node.id === 'parent' || node.id === 'child'));
        assert.deepEqual(elkGraph.edges, []);
    });

    QUnit.test('should drop only that port when exportPort returns false, falling the edge back to the element', async(assert) => {

        const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        const el1 = new joint.shapes.standard.Rectangle({
            id: 'a',
            size: { width: 100, height: 100 },
            ports: {
                groups: { out: { position: 'right' }},
                items: [{ id: 'out1', group: 'out' }]
            }
        });
        const el2 = new joint.shapes.standard.Rectangle({ id: 'b', size: { width: 100, height: 100 }});
        const link = new joint.shapes.standard.Link({ source: { id: 'a', port: 'out1' }, target: { id: 'b' }});

        graph.resetCells([el1, el2, link]);

        const { elkGraph } = await joint.layout.ELK.layout({ graph }, {
            exportPort: () => false
        });

        const elkNode = elkGraph.children.find((node) => node.id === 'a');
        assert.deepEqual(elkNode.ports, []);

        const [elkEdge] = elkGraph.edges;
        assert.deepEqual(elkEdge.sources, ['a']);
    });

    QUnit.test('should drop a link when exportLink returns false - it is not routed at all', async(assert) => {

        const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        const el1 = new joint.shapes.standard.Rectangle({ id: 'a', size: { width: 100, height: 100 }});
        const el2 = new joint.shapes.standard.Rectangle({ id: 'b', size: { width: 100, height: 100 }});
        const link = new joint.shapes.standard.Link({ source: { id: 'a' }, target: { id: 'b' }});

        graph.resetCells([el1, el2, link]);

        const { elkGraph } = await joint.layout.ELK.layout({ graph }, {
            exportLink: () => false
        });

        assert.deepEqual(elkGraph.edges, []);
        assert.notOk(link.vertices().length);
    });

    QUnit.test('should drop only that label when exportLinkLabel returns false', async(assert) => {

        const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        const el1 = new joint.shapes.standard.Rectangle({ id: 'a', size: { width: 100, height: 100 }});
        const el2 = new joint.shapes.standard.Rectangle({ id: 'b', size: { width: 100, height: 100 }});
        const link = new joint.shapes.standard.Link({
            source: { id: 'a' },
            target: { id: 'b' },
            labels: [{ size: { width: 40, height: 20 }}]
        });

        graph.resetCells([el1, el2, link]);

        const { elkGraph } = await joint.layout.ELK.layout({ graph }, {
            exportLinkLabel: () => false
        });

        const [elkEdge] = elkGraph.edges;
        assert.deepEqual(elkEdge.labels, []);
    });

    QUnit.test('should apply each laid out label to its own link label when exportLinkLabel drops another', async(assert) => {

        const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        const el1 = new joint.shapes.standard.Rectangle({ id: 'a', size: { width: 100, height: 100 }});
        const el2 = new joint.shapes.standard.Rectangle({ id: 'b', size: { width: 100, height: 100 }});
        const link = new joint.shapes.standard.Link({
            source: { id: 'a' },
            target: { id: 'b' },
            labels: [
                { position: 0.25, size: { width: 40, height: 20 }},
                { position: 0.75, size: { width: 40, height: 20 }}
            ]
        });

        graph.resetCells([el1, el2, link]);

        const { elkGraph } = await joint.layout.ELK.layout({ graph }, {
            exportLinkLabel: ({ labelIndex }) => (labelIndex === 0 ? false : undefined)
        });

        const [elkEdge] = elkGraph.edges;
        assert.equal(elkEdge.labels.length, 1);
        assert.equal(elkEdge.labels[0].id, `${link.id}:labels:1`);
        // The dropped label is left untouched - the laid out one goes to the second label.
        assert.equal(link.label(0).position, 0.25);
        assert.equal(typeof link.label(1).position, 'object');
        assert.equal(typeof link.label(1).position.distance, 'number');
    });
});

// Last: the default ELK instance is shared by every `layout()` call without an `elk`
// option - once its worker fails to load (the last test), it stays on the main thread.
QUnit.module('the default ELK instance', (hooks) => {

    // Every worker the default instance has started (see `rollup.config.mjs`'s `testWorker`),
    // and how many messages they've sent back.
    const startedWorkers = [];
    let workerMessageCount = 0;
    // The script the next worker is started with - one that doesn't exist fails to load.
    const WORKER_URL = '/base/node_modules/elkjs/lib/elk-worker.min.js';
    let workerUrl = WORKER_URL;

    hooks.before(() => {
        window.__createElkWorker = () => {
            const worker = new Worker(workerUrl);
            worker.addEventListener('message', () => workerMessageCount++);
            startedWorkers.push(worker);
            return worker;
        };
    });

    hooks.after(() => {
        delete window.__createElkWorker;
    });

    const createGraph = () => {
        const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        const el1 = new joint.shapes.standard.Rectangle({ id: 'a', size: { width: 100, height: 100 }});
        const el2 = new joint.shapes.standard.Rectangle({ id: 'b', size: { width: 100, height: 100 }});
        const link = new joint.shapes.standard.Link({ source: { id: 'a' }, target: { id: 'b' }});
        graph.resetCells([el1, el2, link]);
        return { graph, el1, el2 };
    };

    QUnit.test('should run in a Web Worker - one started on first use, then shared', async(assert) => {

        const { graph, el1, el2 } = createGraph();

        await joint.layout.ELK.layout({ graph });

        assert.equal(startedWorkers.length, 1);
        // The layout came from the worker, not from a main-thread fallback.
        assert.ok(workerMessageCount > 0);
        assert.notOk(joint.g.intersection.exists(el1.getBBox(), el2.getBBox()));

        const messageCount = workerMessageCount;
        await joint.layout.ELK.layout(createGraph());
        assert.equal(startedWorkers.length, 1);
        assert.ok(workerMessageCount > messageCount);
    });

    QUnit.test('should terminate the worker busy with an aborted layout - a new one takes over the layouts still waiting', async(assert) => {

        const aborted = createGraph();
        const waiting = createGraph();
        const workerCount = startedWorkers.length;
        const controller = new AbortController();

        const abortedResult = joint.layout.ELK.layout({ graph: aborted.graph }, { signal: controller.signal });
        const waitingResult = joint.layout.ELK.layout({ graph: waiting.graph });
        controller.abort();

        await assert.rejects(abortedResult, (error) => error.name === 'AbortError');
        await waitingResult;

        assert.equal(startedWorkers.length, workerCount + 1);
        assert.ok(joint.g.intersection.exists(aborted.el1.getBBox(), aborted.el2.getBBox()));
        assert.notOk(joint.g.intersection.exists(waiting.el1.getBBox(), waiting.el2.getBBox()));
    });

    QUnit.test('should keep the worker when a layout still waiting its turn is aborted', async(assert) => {

        const busy = createGraph();
        const aborted = createGraph();
        const workerCount = startedWorkers.length;
        const controller = new AbortController();

        const busyResult = joint.layout.ELK.layout({ graph: busy.graph });
        const abortedResult = joint.layout.ELK.layout({ graph: aborted.graph }, { signal: controller.signal });
        controller.abort();

        await assert.rejects(abortedResult, (error) => error.name === 'AbortError');
        await busyResult;

        assert.equal(startedWorkers.length, workerCount);
        assert.notOk(joint.g.intersection.exists(busy.el1.getBBox(), busy.el2.getBBox()));
        assert.ok(joint.g.intersection.exists(aborted.el1.getBBox(), aborted.el2.getBBox()));
    });

    QUnit.test('should not start a worker given `thread: main`', async(assert) => {

        const { graph, el1, el2 } = createGraph();
        const workerCount = startedWorkers.length;
        const messageCount = workerMessageCount;

        await joint.layout.ELK.layout({ graph }, { thread: 'main' });

        assert.equal(startedWorkers.length, workerCount);
        assert.equal(workerMessageCount, messageCount);
        assert.notOk(joint.g.intersection.exists(el1.getBBox(), el2.getBBox()));
    });

    QUnit.test('should run in the worker given `thread: worker`', async(assert) => {

        const { graph, el1, el2 } = createGraph();
        const messageCount = workerMessageCount;

        await joint.layout.ELK.layout({ graph }, { thread: 'worker' });

        assert.ok(workerMessageCount > messageCount);
        assert.notOk(joint.g.intersection.exists(el1.getBBox(), el2.getBBox()));
    });

    QUnit.test('should reject a layout the worker crashes during - a new worker takes over the layouts still waiting', async(assert) => {

        const crashed = createGraph();
        const waiting = createGraph();
        const workerCount = startedWorkers.length;

        const crashedResult = joint.layout.ELK.layout({ graph: crashed.graph });
        const waitingResult = joint.layout.ELK.layout({ graph: waiting.graph });
        // E.g. out of memory - not retried on the main thread.
        startedWorkers[startedWorkers.length - 1].dispatchEvent(new ErrorEvent('error', { message: 'out of memory' }));

        await assert.rejects(crashedResult, /the ELK worker crashed during the layout \(out of memory\)/);
        await waitingResult;

        assert.equal(startedWorkers.length, workerCount + 1);
        assert.ok(joint.g.intersection.exists(crashed.el1.getBBox(), crashed.el2.getBBox()));
        assert.notOk(joint.g.intersection.exists(waiting.el1.getBBox(), waiting.el2.getBBox()));

        // The new worker lays out later layouts too.
        const messageCount = workerMessageCount;
        await joint.layout.ELK.layout(createGraph());
        assert.equal(startedWorkers.length, workerCount + 1);
        assert.ok(workerMessageCount > messageCount);
    });

    QUnit.test('should retry a layout on the main thread when the worker fails to load - and stay there', async(assert) => {

        // A crash restarts the worker - with a script that doesn't exist (e.g. one a bundler
        // didn't emit), which fails to load.
        workerUrl = '/base/missing-elk-worker.js';
        const warnings = [];
        const warn = console.warn;
        console.warn = (message) => warnings.push(message);
        const crashedResult = joint.layout.ELK.layout(createGraph());
        startedWorkers[startedWorkers.length - 1].dispatchEvent(new ErrorEvent('error'));
        await assert.rejects(crashedResult);

        const { graph, el1, el2 } = createGraph();
        const workerOnly = createGraph();
        // Posted to the worker still loading - ELK itself would never settle them.
        // Not retried on the main thread - rejected (handled right away: before the layout below).
        const workerOnlyRejected = assert.rejects(
            joint.layout.ELK.layout({ graph: workerOnly.graph }, { thread: 'worker' }),
            /the ELK Web Worker failed to load, and `thread: 'worker'` rules out/
        );
        try {
            await joint.layout.ELK.layout({ graph });
        } finally {
            console.warn = warn;
        }
        assert.notOk(joint.g.intersection.exists(el1.getBBox(), el2.getBBox()));
        await workerOnlyRejected;
        assert.ok(joint.g.intersection.exists(workerOnly.el1.getBBox(), workerOnly.el2.getBBox()));
        // Reported - layouts still work, but now block the page.
        assert.equal(warnings.length, 1);
        assert.ok(/the ELK Web Worker failed to load - running ELK on the main thread instead/.test(warnings[0]));

        // No new worker is started for later layouts.
        workerUrl = WORKER_URL;
        const workerCount = startedWorkers.length;
        const { graph: nextGraph, el1: nextEl1, el2: nextEl2 } = createGraph();
        await joint.layout.ELK.layout({ graph: nextGraph });
        assert.equal(startedWorkers.length, workerCount);
        assert.notOk(joint.g.intersection.exists(nextEl1.getBBox(), nextEl2.getBBox()));
        await assert.rejects(joint.layout.ELK.layout(createGraph(), { thread: 'worker' }), /the ELK Web Worker failed to load/);
    });
});
