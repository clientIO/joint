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
        await assert.rejects(joint.layout.ELK.layout(graph), error);
        assert.ok(joint.g.intersection.exists(el1.getBBox(), el2.getBBox()));

        delete window.__loadMainThreadElk;
        await joint.layout.ELK.layout(graph);
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

        await joint.layout.ELK.layout(graph);

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

        const { elkGraph } = await joint.layout.ELK.layout(graph);

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

        const { elkGraph } = await joint.layout.ELK.layout(graph, {
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

        const { elkGraph } = await joint.layout.ELK.layout(graph, {
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

        await joint.layout.ELK.layout(graph);

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
        await joint.layout.ELK.layout(graph, {
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
        const { elkGraph } = await joint.layout.ELK.layout(graph, {
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

        const { elkGraph } = await joint.layout.ELK.layout(graph);

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

        await joint.layout.ELK.layout(graph, {
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

        await joint.layout.ELK.layout(graph, {
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

        await joint.layout.ELK.layout(graph, {
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

        await joint.layout.ELK.layout(graph);
        const firstPosition = el1.getPortRelativePosition('out1');

        // Laying out the same, already laid out graph again should not move the
        // port any further - each call is independent, not cumulative.
        await joint.layout.ELK.layout(graph);
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

        const { elkGraph } = await joint.layout.ELK.layout(graph, {
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

        const { elkGraph } = await joint.layout.ELK.layout(graph, {
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

        const { elkGraph } = await joint.layout.ELK.layout(graph);
        assert.equal(elkGraph.edges[0].labels[0].layoutOptions['elk.edgeLabels.inline'], 'true');

        const { elkGraph: optedOutElkGraph } = await joint.layout.ELK.layout(graph, {
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

        const { elkGraph } = await joint.layout.ELK.layout(graph, {
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

        const { elkGraph } = await joint.layout.ELK.layout(graph, {
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

        const { elkGraph } = await joint.layout.ELK.layout(graph, {
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

    QUnit.test('should drop only that port\'s label when exportPortLabel returns false', async(assert) => {

        const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        const el1 = new joint.shapes.standard.Rectangle({
            id: 'a',
            size: { width: 100, height: 100 },
            ports: {
                groups: { out: { position: 'right' }},
                items: [{ id: 'out1', group: 'out' }, { id: 'out2', group: 'out' }]
            }
        });

        graph.resetCells([el1]);

        const { elkGraph } = await joint.layout.ELK.layout(graph, {
            exportPortLabel: ({ portId, elkPortLabel }) => {
                // Sized either way - `false` drops it regardless.
                elkPortLabel.width = 40;
                elkPortLabel.height = 20;
                if (portId === 'out1') return false;
            }
        });

        const elkNode = elkGraph.children.find((node) => node.id === 'a');
        assert.deepEqual(elkNode.ports.find((port) => port.id === 'a:out1').labels, []);
        assert.equal(elkNode.ports.find((port) => port.id === 'a:out2').labels.length, 1);
    });

    QUnit.test('should return a zero-size bbox for an empty graph', async(assert) => {

        const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });

        const { bbox, elkGraph } = await joint.layout.ELK.layout(graph);

        assert.equal(bbox.width, 0);
        assert.equal(bbox.height, 0);
        assert.deepEqual(elkGraph.children, []);
    });

    QUnit.test('should apply the layout in a single `layout` batch', async(assert) => {

        const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        const el1 = new joint.shapes.standard.Rectangle({ id: 'a', size: { width: 100, height: 100 }});
        graph.resetCells([el1]);

        const batches = [];
        graph.on('batch:start', ({ batchName }) => batches.push(`start:${batchName}`));
        graph.on('batch:stop', ({ batchName }) => batches.push(`stop:${batchName}`));

        await joint.layout.ELK.layout(graph);

        assert.deepEqual(batches, ['start:layout', 'stop:layout']);
        assert.notOk(graph.hasActiveBatch());
    });

    QUnit.test('should close the batch when an import callback throws', async(assert) => {

        const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        const el1 = new joint.shapes.standard.Rectangle({ id: 'a', size: { width: 100, height: 100 }});
        graph.resetCells([el1]);

        const error = new Error('setElementAttributes failed');
        await assert.rejects(joint.layout.ELK.layout(graph, {
            setElementAttributes: () => { throw error; }
        }), error);

        assert.notOk(graph.hasActiveBatch());
    });

    QUnit.test('should leave out a link connected to another link', async(assert) => {

        const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        const el1 = new joint.shapes.standard.Rectangle({ id: 'a', size: { width: 50, height: 50 }});
        const el2 = new joint.shapes.standard.Rectangle({ id: 'b', size: { width: 50, height: 50 }});
        const el3 = new joint.shapes.standard.Rectangle({ id: 'c', size: { width: 50, height: 50 }});
        const link = new joint.shapes.standard.Link({ id: 'ab', source: { id: 'a' }, target: { id: 'b' }});
        // `getSourceElement()` walks through a chain of links - this one must not be taken
        // for a link between `c` and `b`.
        const toLink = new joint.shapes.standard.Link({ id: 'toLink', source: { id: 'c' }, target: { id: 'ab' }});

        graph.resetCells([el1, el2, el3, link, toLink]);

        const { elkGraph } = await joint.layout.ELK.layout(graph);

        assert.deepEqual(elkGraph.edges.map((edge) => edge.id), ['ab']);
        assert.notOk(toLink.source().anchor);
        assert.notOk(toLink.target().anchor);
        assert.notOk(toLink.vertices().length);
    });

    QUnit.test('should anchor a link end on the element when it references a port the element does not have', async(assert) => {

        const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        const el1 = new joint.shapes.standard.Rectangle({
            id: 'a',
            size: { width: 50, height: 50 },
            ports: { items: [{ id: 'out' }] }
        });
        const el2 = new joint.shapes.standard.Rectangle({ id: 'b', size: { width: 50, height: 50 }});
        const link = new joint.shapes.standard.Link({ id: 'ab', source: { id: 'a', port: 'gone' }, target: { id: 'b' }});

        graph.resetCells([el1, el2, link]);

        const { elkGraph } = await joint.layout.ELK.layout(graph);

        // A dangling port reference would make ELK reject the whole graph.
        assert.deepEqual(elkGraph.edges[0].sources, ['a']);
        // JointJS renders such an end against the element's bbox - the anchor matches.
        assert.ok(link.source().anchor);
    });

    QUnit.test('should keep a link label\'s other position settings', async(assert) => {

        const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        const el1 = new joint.shapes.standard.Rectangle({ id: 'a', size: { width: 50, height: 50 }});
        const el2 = new joint.shapes.standard.Rectangle({ id: 'b', size: { width: 50, height: 50 }});
        const link = new joint.shapes.standard.Link({ id: 'ab', source: { id: 'a' }, target: { id: 'b' }});
        link.labels([{
            size: { width: 40, height: 20 },
            position: { distance: 0.5, angle: 45, args: { keepGradient: true }}
        }]);

        graph.resetCells([el1, el2, link]);

        await joint.layout.ELK.layout(graph);

        const { position } = link.label(0);
        // Only the label's place along the link is ELK's to decide.
        assert.equal(position.angle, 45);
        assert.deepEqual(position.args, { keepGradient: true });
        assert.ok('distance' in position);
        assert.ok('offset' in position);
    });

    QUnit.test('should measure a link end\'s anchor from the position ELK computed, not the one the element has', async(assert) => {

        const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        const el1 = new joint.shapes.standard.Rectangle({ id: 'a', size: { width: 50, height: 50 }, position: { x: 400, y: 400 }});
        const el2 = new joint.shapes.standard.Rectangle({ id: 'b', size: { width: 50, height: 50 }, position: { x: 700, y: 700 }});
        const link = new joint.shapes.standard.Link({ id: 'ab', source: { id: 'a' }, target: { id: 'b' }});

        graph.resetCells([el1, el2, link]);

        // A `setElementAttributes` is free to defer the position (the README suggests a
        // `transition()`), so the element still sits where it was while links are imported.
        const { elkGraph } = await joint.layout.ELK.layout(graph, {
            setElementAttributes: () => { /* applied later */ }
        });

        assert.deepEqual(el1.position().toJSON(), { x: 400, y: 400 });

        const node = elkGraph.children.find((child) => child.id === 'a');
        const { startPoint } = elkGraph.edges[0].sections[0];
        const { args } = link.source().anchor;

        assert.equal(args.dx, startPoint.x - node.x);
        assert.equal(args.dy, startPoint.y - node.y);
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

            await assert.rejects(joint.layout.ELK.layout(graph, { signal: AbortSignal.abort(), exportElement }), isAbortError);

            await wait(50);
            assert.ok(joint.g.intersection.exists(el1.getBBox(), el2.getBBox()));
        });

        QUnit.test('should reject with the signal\'s reason, and apply nothing, when aborted during the layout', async(assert) => {

            const { graph, el1, el2 } = createGraph();
            const controller = new AbortController();
            const reason = new Error('graph changed');

            const result = joint.layout.ELK.layout(graph, { signal: controller.signal });
            controller.abort(reason);

            await assert.rejects(result, reason);
            // ELK's own result (on the main thread, it can't be stopped) is ignored.
            await wait(100);
            assert.ok(joint.g.intersection.exists(el1.getBBox(), el2.getBBox()));
        });

        QUnit.test('should reject with the signal\'s reason even when it is `null`', async(assert) => {

            const { graph } = createGraph();
            const controller = new AbortController();

            const result = joint.layout.ELK.layout(graph, { signal: controller.signal });
            controller.abort(null);

            let error = 'not rejected';
            try {
                await result;
            } catch (reason) {
                error = reason;
            }
            assert.strictEqual(error, null);
        });

        QUnit.test('should apply the layout when the signal is not aborted', async(assert) => {

            const { graph, el1, el2 } = createGraph();

            await joint.layout.ELK.layout(graph, { signal: new AbortController().signal });

            assert.notOk(joint.g.intersection.exists(el1.getBBox(), el2.getBBox()));
        });

        QUnit.test('should reject when aborted during the layout of a custom `elk` instance', async(assert) => {

            const { graph, el1, el2 } = createGraph();
            const controller = new AbortController();

            const result = joint.layout.ELK.layout(graph, { elk: new window.ELK(), signal: controller.signal });
            controller.abort();

            await assert.rejects(result, isAbortError);
            await wait(100);
            assert.ok(joint.g.intersection.exists(el1.getBBox(), el2.getBBox()));
        });
    });

    QUnit.module('given a list of cells', () => {

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

            const { elkGraph } = await joint.layout.ELK.layout([a, b, ab, bc]);

            assert.deepEqual(ids(elkGraph.children), ['a', 'b']);
            // `bc` is given, but `c` isn't - `ac` isn't given at all.
            assert.deepEqual(ids(elkGraph.edges), ['ab']);
            // What's left out is left alone.
            assert.deepEqual(c.position().toJSON(), { x: 1000, y: 1000 });
            assert.notOk(bc.vertices().length);
            assert.notOk(ac.vertices().length);
        });

        QUnit.test('should take the elements and the links from one list, whatever their order in it', async(assert) => {

            const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
            const [a, b, c] = [rect('a'), rect('b'), rect('c')];
            const ab = edge('ab', 'a', 'b');
            const bc = edge('bc', 'b', 'c');
            graph.resetCells([a, b, c, ab, bc]);

            // `bc` is listed, but `c` isn't.
            const { elkGraph: withElements } = await joint.layout.ELK.layout([b, a, ab, bc]);
            assert.deepEqual(ids(withElements.children), ['b', 'a']);
            assert.deepEqual(ids(withElements.edges), ['ab']);

            // A link may be listed before the elements it connects.
            const { elkGraph: withLinks } = await joint.layout.ELK.layout([bc, a, b, c]);
            assert.deepEqual(ids(withLinks.children), ['a', 'b', 'c']);
            assert.deepEqual(ids(withLinks.edges), ['bc']);
        });

        QUnit.test('should follow the given order for the top-level elements and links', async(assert) => {

            const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
            const [a, b, c] = [rect('a'), rect('b'), rect('c')];
            const ab = edge('ab', 'a', 'b');
            const bc = edge('bc', 'b', 'c');
            graph.resetCells([a, b, c, ab, bc]);

            const { elkGraph } = await joint.layout.ELK.layout([c, a, b, bc, ab]);

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
            const { elkGraph } = await joint.layout.ELK.layout([parent, b, a, ba, ab]);

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

            const { elkGraph } = await joint.layout.ELK.layout([a, b, ab]);

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

            const { bbox, elkGraph } = await joint.layout.ELK.layout([]);

            assert.ok(bbox.equals(new joint.g.Rect(0, 0, 0, 0)));
            assert.deepEqual(elkGraph.children, []);
            assert.deepEqual(elkGraph.edges, []);
            assert.deepEqual(a.position().toJSON(), { x: 500, y: 500 });
            assert.notOk(ab.vertices().length);
        });

        QUnit.test('should lay out a cell listed more than once only once', async(assert) => {

            const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
            const [a, b] = [rect('a'), rect('b')];
            const ab = edge('ab', 'a', 'b');
            graph.resetCells([a, b, ab]);

            const { elkGraph } = await joint.layout.ELK.layout([a, a, b, ab, ab]);

            assert.deepEqual(ids(elkGraph.children), ['a', 'b']);
            assert.deepEqual(ids(elkGraph.edges), ['ab']);
        });

        QUnit.test('should lay out the elements inside a container that is in no graph', async(assert) => {

            const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
            const [a, b] = [rect('a'), rect('b')];
            // Only there to group `a` and `b` for the layout - never added to the graph,
            // so its children come from their own `parent`, not from the graph.
            const container = rect('container');
            graph.resetCells([a, b]);
            a.set('parent', 'container');
            b.set('parent', 'container');

            const { elkGraph } = await joint.layout.ELK.layout([a, b, container]);

            assert.deepEqual(ids(elkGraph.children), ['container']);
            assert.deepEqual(ids(elkGraph.children[0].children), ['a', 'b']);
        });

        QUnit.test('should batch on the graph the cells are in, whichever of them is in none', async(assert) => {

            const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
            const [a, b] = [rect('a'), rect('b')];
            const container = rect('container');
            graph.resetCells([a, b]);
            a.set('parent', 'container');
            b.set('parent', 'container');

            const batches = [];
            graph.on('batch:start', ({ batchName }) => batches.push(`start:${batchName}`));
            graph.on('batch:stop', ({ batchName }) => batches.push(`stop:${batchName}`));

            await joint.layout.ELK.layout([a, b, container]);

            assert.deepEqual(batches, ['start:layout', 'stop:layout']);
            assert.notOk(graph.hasActiveBatch());
        });

        QUnit.test('should reject two cells whose ids differ only in type', async(assert) => {

            const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
            // Distinct cells for JointJS, one and the same id for ELK, which identifies
            // everything by a string.
            const numeric = new joint.shapes.standard.Rectangle({ id: 5, size: { width: 50, height: 50 }});
            const textual = new joint.shapes.standard.Rectangle({ id: '5', size: { width: 50, height: 50 }});
            graph.resetCells([numeric, textual]);

            assert.equal(graph.getCells().length, 2);
            await assert.rejects(joint.layout.ELK.layout(graph), /collides/);
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

        const { elkGraph } = await joint.layout.ELK.layout(graph, {
            exportElement: ({ element }) => element.id !== 'parent'
        });

        // Neither `parent` nor its embedded `child` (dropped along with it) made it in -
        // and, since `child` never did, the link connected to it wasn't routed either.
        assert.notOk(elkGraph.children.some((node) => node.id === 'parent' || node.id === 'child'));
        assert.deepEqual(elkGraph.edges, []);
    });

    QUnit.test('should lay out a container whose embeds exportElement all dropped as a leaf, with its own size', async(assert) => {

        const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        const container = new joint.shapes.standard.Rectangle({ id: 'container', size: { width: 300, height: 200 }});
        const child = new joint.shapes.standard.Rectangle({ id: 'child', size: { width: 50, height: 50 }});
        const other = new joint.shapes.standard.Rectangle({ id: 'other', size: { width: 100, height: 100 }});
        const link = new joint.shapes.standard.Link({ source: { id: 'container' }, target: { id: 'other' }});
        container.embed(child);

        graph.resetCells([container, child, other, link]);

        const { elkGraph } = await joint.layout.ELK.layout(graph, {
            exportElement: ({ element }) => element.id !== 'child'
        });

        const elkNode = elkGraph.children.find((node) => node.id === 'container');
        assert.notOk(elkNode.children && elkNode.children.length);
        assert.equal(elkNode.width, 300);
        assert.equal(elkNode.height, 200);
        // ELK made room for it - and it kept its size.
        assert.deepEqual(container.size(), { width: 300, height: 200 });
        assert.notOk(joint.g.intersection.exists(container.getBBox(), other.getBBox()));
    });

    QUnit.test('should keep the size `exportElement` set on a container whose embeds it dropped, and the element\'s own for the rest', async(assert) => {

        const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        const container = new joint.shapes.standard.Rectangle({ id: 'container', size: { width: 300, height: 200 }});
        const child = new joint.shapes.standard.Rectangle({ id: 'child', size: { width: 50, height: 50 }});
        const other = new joint.shapes.standard.Rectangle({ id: 'other', size: { width: 100, height: 100 }});
        const link = new joint.shapes.standard.Link({ source: { id: 'container' }, target: { id: 'other' }});
        container.embed(child);

        graph.resetCells([container, child, other, link]);

        const { elkGraph } = await joint.layout.ELK.layout(graph, {
            exportElement: ({ element, elkNode }) => {
                if (element.id === 'child') return false;
                // Only one of the two dimensions - the other is the element's own.
                if (element.id === 'container') elkNode.width = 500;
            }
        });

        const elkNode = elkGraph.children.find((node) => node.id === 'container');
        assert.equal(elkNode.width, 500);
        assert.equal(elkNode.height, 200);
        // A node ELK thinks is zero high gets no room, and its neighbour moves into it.
        assert.notOk(joint.g.intersection.exists(container.getBBox(), other.getBBox()));
    });

    QUnit.test('should keep ELK ids unique whatever the cell and port ids', async(assert) => {

        const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        const size = { width: 100, height: 100 };
        // Element `a`'s port `p` would share its ELK id with element `a:p`, and element
        // `root` with the root node, without escaping.
        const a = new joint.shapes.standard.Rectangle({
            id: 'a',
            size,
            ports: { groups: { in: { position: 'left' }}, items: [{ id: 'p', group: 'in' }] }
        });
        const ap = new joint.shapes.standard.Rectangle({ id: 'a:p', size });
        const root = new joint.shapes.standard.Rectangle({ id: 'root', size });
        const b = new joint.shapes.standard.Rectangle({ id: 'b\\', size });
        const toPort = new joint.shapes.standard.Link({ id: 'l1', source: { id: 'b\\' }, target: { id: 'a', port: 'p' }});
        const toElement = new joint.shapes.standard.Link({ id: 'l:2', source: { id: 'b\\' }, target: { id: 'a:p' }});
        const toRoot = new joint.shapes.standard.Link({ id: 'l3', source: { id: 'b\\' }, target: { id: 'root' }});

        graph.resetCells([a, ap, root, b, toPort, toElement, toRoot]);

        const { elkGraph } = await joint.layout.ELK.layout(graph);

        const nodeIds = elkGraph.children.map((node) => node.id);
        assert.deepEqual(nodeIds, ['a', 'a\\:p', 'root', 'b\\\\']);
        assert.deepEqual(elkGraph.children[0].ports.map((port) => port.id), ['a:p']);
        assert.notOk(nodeIds.includes(elkGraph.id));

        const targetsByEdgeId = {};
        elkGraph.edges.forEach((edge) => { targetsByEdgeId[edge.id] = edge.targets; });
        assert.deepEqual(targetsByEdgeId, { l1: ['a:p'], 'l\\:2': ['a\\:p'], l3: ['root'] });

        // Every element laid out where ELK put it, and every link routed - the one to the
        // element (not the port) anchored on it.
        const elements = [a, ap, root, b];
        elements.forEach((el1, i) => elements.slice(i + 1).forEach((el2) => {
            assert.notOk(joint.g.intersection.exists(el1.getBBox(), el2.getBBox()), `${el1.id} / ${el2.id}`);
        }));
        assert.ok(toElement.target().anchor);
        assert.notOk(toPort.target().anchor);
    });

    QUnit.test('should drop only that port when exportPort returns false - and the links connected to it', async(assert) => {

        const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        const el1 = new joint.shapes.standard.Rectangle({
            id: 'a',
            size: { width: 100, height: 100 },
            ports: {
                groups: { out: { position: 'right' }},
                items: [{ id: 'out1', group: 'out' }, { id: 'out2', group: 'out' }]
            }
        });
        const el2 = new joint.shapes.standard.Rectangle({ id: 'b', size: { width: 100, height: 100 }});
        const onDroppedPort = new joint.shapes.standard.Link({ id: 'dropped', source: { id: 'a', port: 'out1' }, target: { id: 'b' }});
        const onKeptPort = new joint.shapes.standard.Link({ id: 'kept', source: { id: 'a', port: 'out2' }, target: { id: 'b' }});

        graph.resetCells([el1, el2, onDroppedPort, onKeptPort]);

        const { elkGraph } = await joint.layout.ELK.layout(graph, {
            exportPort: ({ portId }) => (portId === 'out1') ? false : undefined
        });

        const elkNode = elkGraph.children.find((node) => node.id === 'a');
        assert.deepEqual(elkNode.ports.map((port) => port.id), ['a:out2']);

        // Only the link on the port that is still in the ELK graph is laid out.
        assert.deepEqual(elkGraph.edges.map((edge) => edge.id), ['kept']);
        assert.deepEqual(elkGraph.edges[0].sources, ['a:out2']);

        // The one left out keeps its route, and no anchor is written onto its end.
        assert.notOk(onDroppedPort.vertices().length);
        assert.notOk(onDroppedPort.source().anchor);
    });

    QUnit.test('should drop a link when exportLink returns false - it is not routed at all', async(assert) => {

        const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        const el1 = new joint.shapes.standard.Rectangle({ id: 'a', size: { width: 100, height: 100 }});
        const el2 = new joint.shapes.standard.Rectangle({ id: 'b', size: { width: 100, height: 100 }});
        const link = new joint.shapes.standard.Link({ source: { id: 'a' }, target: { id: 'b' }});

        graph.resetCells([el1, el2, link]);

        const { elkGraph } = await joint.layout.ELK.layout(graph, {
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

        const { elkGraph } = await joint.layout.ELK.layout(graph, {
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

        const { elkGraph } = await joint.layout.ELK.layout(graph, {
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

QUnit.module('createWorkerElk()', (hooks) => {

    const WORKER_URL = '/base/node_modules/elkjs/lib/elk-worker.min.js';
    // A script that doesn't exist - e.g. one a bundler didn't emit - fails to load.
    const MISSING_WORKER_URL = '/base/missing-elk-worker.js';

    // Every worker started by `createWorker()` below, and how many messages they've sent back.
    let startedWorkers;
    let workerMessageCount;
    // Instances to terminate after each test.
    let elks;

    hooks.beforeEach(() => {
        startedWorkers = [];
        workerMessageCount = 0;
        elks = [];
    });

    hooks.afterEach(() => {
        elks.forEach((elk) => elk.terminate());
    });

    const createElk = (getUrl = () => WORKER_URL) => {
        const elk = joint.layout.ELK.createWorkerElk(() => {
            const worker = new Worker(getUrl());
            worker.addEventListener('message', () => workerMessageCount++);
            startedWorkers.push(worker);
            return worker;
        });
        elks.push(elk);
        return elk;
    };

    const createGraph = () => {
        const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        const el1 = new joint.shapes.standard.Rectangle({ id: 'a', size: { width: 100, height: 100 }});
        const el2 = new joint.shapes.standard.Rectangle({ id: 'b', size: { width: 100, height: 100 }});
        const link = new joint.shapes.standard.Link({ source: { id: 'a' }, target: { id: 'b' }});
        graph.resetCells([el1, el2, link]);
        return { graph, el1, el2 };
    };

    const isLaidOut = ({ el1, el2 }) => !joint.g.intersection.exists(el1.getBBox(), el2.getBBox());

    QUnit.test('should lay out in a worker - started on the first layout, then shared', async(assert) => {

        const elk = createElk();
        assert.equal(startedWorkers.length, 0);

        const first = createGraph();
        await joint.layout.ELK.layout(first.graph, { elk });

        assert.equal(startedWorkers.length, 1);
        // The layout came from the worker.
        assert.ok(workerMessageCount > 0);
        assert.ok(isLaidOut(first));

        const messageCount = workerMessageCount;
        const second = createGraph();
        await joint.layout.ELK.layout(second.graph, { elk });
        assert.equal(startedWorkers.length, 1);
        assert.ok(workerMessageCount > messageCount);
        assert.ok(isLaidOut(second));
    });

    QUnit.test('should terminate the worker busy with an aborted layout - a new one takes over the layouts still waiting', async(assert) => {

        const elk = createElk();
        const aborted = createGraph();
        const waiting = createGraph();
        const controller = new AbortController();

        const abortedResult = joint.layout.ELK.layout(aborted.graph, { elk, signal: controller.signal });
        const waitingResult = joint.layout.ELK.layout(waiting.graph, { elk });
        controller.abort();

        await assert.rejects(abortedResult, (error) => error.name === 'AbortError');
        await waitingResult;

        assert.equal(startedWorkers.length, 2);
        assert.notOk(isLaidOut(aborted));
        assert.ok(isLaidOut(waiting));
    });

    QUnit.test('should keep the worker when a layout still waiting its turn is aborted', async(assert) => {

        const elk = createElk();
        const busy = createGraph();
        const aborted = createGraph();
        const controller = new AbortController();

        const busyResult = joint.layout.ELK.layout(busy.graph, { elk });
        const abortedResult = joint.layout.ELK.layout(aborted.graph, { elk, signal: controller.signal });
        controller.abort();

        await assert.rejects(abortedResult, (error) => error.name === 'AbortError');
        await busyResult;

        assert.equal(startedWorkers.length, 1);
        assert.ok(isLaidOut(busy));
        assert.notOk(isLaidOut(aborted));
    });

    QUnit.test('should reject a layout the worker crashes during - a new worker takes over the layouts still waiting', async(assert) => {

        const elk = createElk();
        const crashed = createGraph();
        const waiting = createGraph();

        const crashedResult = joint.layout.ELK.layout(crashed.graph, { elk });
        const waitingResult = joint.layout.ELK.layout(waiting.graph, { elk });
        // Loaded by now - e.g. out of memory.
        await new Promise((resolve) => startedWorkers[0].addEventListener('message', resolve, { once: true }));
        startedWorkers[0].dispatchEvent(new ErrorEvent('error', { message: 'out of memory' }));

        await assert.rejects(crashedResult, /the ELK worker crashed during the layout \(out of memory\)/);
        await waitingResult;

        assert.equal(startedWorkers.length, 2);
        assert.notOk(isLaidOut(crashed));
        assert.ok(isLaidOut(waiting));
    });

    QUnit.test('should reject every layout when the worker fails to load - the next one starts a new worker', async(assert) => {

        let url = MISSING_WORKER_URL;
        const elk = createElk(() => url);
        const first = createGraph();
        const second = createGraph();

        // Handled right away - both reject while the other is still pending.
        const rejected = Promise.all([
            assert.rejects(joint.layout.ELK.layout(first.graph, { elk }), /the ELK worker failed to load/),
            assert.rejects(joint.layout.ELK.layout(second.graph, { elk }), /the ELK worker failed to load/)
        ]);
        await rejected;
        assert.notOk(isLaidOut(first));
        assert.notOk(isLaidOut(second));

        // E.g. the script is served by now.
        url = WORKER_URL;
        const next = createGraph();
        await joint.layout.ELK.layout(next.graph, { elk });
        assert.equal(startedWorkers.length, 2);
        assert.ok(isLaidOut(next));
    });

    QUnit.test('should reject a layout when no worker can be started', async(assert) => {

        const error = new Error('blocked by CSP');
        const elk = joint.layout.ELK.createWorkerElk(() => { throw error; });
        const { graph, el1, el2 } = createGraph();

        await assert.rejects(joint.layout.ELK.layout(graph, { elk }), error);
        assert.notOk(isLaidOut({ el1, el2 }));
    });

    QUnit.test('should reject the layouts not settled yet when terminated - a later layout starts a new worker', async(assert) => {

        const elk = createElk();
        const terminated = createGraph();

        const terminatedResult = joint.layout.ELK.layout(terminated.graph, { elk });
        elk.terminate();

        await assert.rejects(terminatedResult, /the ELK worker was terminated/);
        assert.notOk(isLaidOut(terminated));

        const next = createGraph();
        await joint.layout.ELK.layout(next.graph, { elk });
        assert.equal(startedWorkers.length, 2);
        assert.ok(isLaidOut(next));
    });
    // Settles as `promise` does, or with 'pending' if it hasn't within `ms` - so a layout
    // left pending fails its test instead of hanging the suite.
    const settledWithin = (promise, ms) => Promise.race([
        promise.then(() => 'resolved', (error) => `rejected: ${error.message}`),
        new Promise((resolve) => setTimeout(() => resolve('pending'), ms))
    ]);

    QUnit.test('should not blame a crash during a layout aborted while waiting on the layout waiting behind it', async(assert) => {

        const elk = createElk();
        const controller = new AbortController();

        const first = createGraph();
        const firstResult = joint.layout.ELK.layout(first.graph, { elk });
        const abortedResult = joint.layout.ELK.layout(createGraph().graph, { elk, signal: controller.signal });
        controller.abort();
        await assert.rejects(abortedResult, (error) => error.name === 'AbortError');
        await firstResult;

        // The worker is busy with the aborted layout now (its result ignored) - `waiting`
        // waits behind it, and the crash is no fault of its own.
        const waiting = createGraph();
        const waitingResult = joint.layout.ELK.layout(waiting.graph, { elk });
        startedWorkers[0].dispatchEvent(new ErrorEvent('error', { message: 'out of memory' }));

        assert.equal(await settledWithin(waitingResult, 5000), 'resolved');
        assert.equal(startedWorkers.length, 2);
        assert.ok(isLaidOut(waiting));
    });

    QUnit.test('should reject a layout that can\'t be posted to the worker - without holding up the others', async(assert) => {

        const elk = createElk();
        // Started and loaded.
        await joint.layout.ELK.layout(createGraph().graph, { elk });

        // A function can't be cloned into the worker.
        const unpostable = createGraph();
        await assert.rejects(joint.layout.ELK.layout(unpostable.graph, {
            elk,
            exportElement: ({ elkNode }) => {
                elkNode.layoutOptions['elk.custom'] = () => {};
            }
        }), (error) => error.name === 'DataCloneError');
        assert.notOk(isLaidOut(unpostable));

        // Aborting the layout the worker is busy with still terminates it - a new worker
        // takes over the one waiting.
        const controller = new AbortController();
        const abortedResult = joint.layout.ELK.layout(createGraph().graph, { elk, signal: controller.signal });
        const waiting = createGraph();
        const waitingResult = joint.layout.ELK.layout(waiting.graph, { elk });
        controller.abort();
        await assert.rejects(abortedResult, (error) => error.name === 'AbortError');
        assert.equal(await settledWithin(waitingResult, 5000), 'resolved');
        assert.equal(startedWorkers.length, 2);
        assert.ok(isLaidOut(waiting));

        // A crash rejects the layout the worker is busy with - and a new worker takes over
        // the one waiting (the layout that couldn't be posted isn't re-posted either).
        const crashedResult = joint.layout.ELK.layout(createGraph().graph, { elk });
        const afterCrash = createGraph();
        const afterCrashResult = joint.layout.ELK.layout(afterCrash.graph, { elk });
        startedWorkers[1].dispatchEvent(new ErrorEvent('error', { message: 'out of memory' }));
        await assert.rejects(crashedResult, /the ELK worker crashed during the layout/);
        assert.equal(await settledWithin(afterCrashResult, 5000), 'resolved');
        assert.equal(startedWorkers.length, 3);
        assert.ok(isLaidOut(afterCrash));
    });
});
