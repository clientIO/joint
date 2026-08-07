// These tests exercise `RouterService` end-to-end against the real
// `MainThreadProvider` (and, through it, the actual libavoid WASM engine).
//
// IMPORTANT: `init()` must always be called before cells are added to the
// graph (matching real usage). Referencing an element in a link before the
// router has registered it as an avoid shape crashes the underlying WASM
// module irrecoverably, failing every subsequent test in this file.

async function initRouterWithLink(sourcePosition, targetPosition, options) {
    const graph = new joint.dia.Graph();
    const routerService = await joint.routers.avoid.init(Object.assign({ graph }, options));

    const size = { width: 100, height: 100 };
    const source = new joint.shapes.standard.Rectangle({ position: sourcePosition, size });
    const target = new joint.shapes.standard.Rectangle({ position: targetPosition, size });
    const link = new joint.shapes.standard.Link({
        source: { id: source.id },
        target: { id: target.id }
    });
    graph.resetCells([source, target, link]);

    return { graph, routerService, source, target, link };
}

// A `rightAngle`/avoid orthogonal-router path should only ever bend at
// horizontal or vertical segments.
function isOrthogonalPath(link) {
    const points = [link.getSourcePoint()].concat(link.vertices(), [link.getTargetPoint()]);
    for (let i = 1; i < points.length; i++) {
        if (points[i - 1].x !== points[i].x && points[i - 1].y !== points[i].y) {
            return false;
        }
    }
    return true;
}

QUnit.module('sanity', () => {
    QUnit.test('should load', assert => {
        assert.ok(typeof joint.routers.avoid !== 'undefined');
        assert.ok(typeof joint.routers.avoid.init === 'function');
    });

    QUnit.test('init() resolves with the expected RouterService API', async assert => {
        const { routerService } = await initRouterWithLink({ x: 0, y: 0 }, { x: 300, y: 0 });

        assert.equal(typeof routerService.on, 'function');
        assert.equal(typeof routerService.off, 'function');
        assert.equal(typeof routerService.trigger, 'function');
        assert.equal(typeof routerService.getRoute, 'function');
        assert.equal(typeof routerService.addGraphListeners, 'function');
        assert.equal(typeof routerService.removeGraphListeners, 'function');

        routerService.removeGraphListeners();
    });
});

QUnit.module('pending event & immediate fallback route', () => {
    QUnit.test('moving a connected element triggers "pending" and results in an orthogonal route', async assert => {
        const { routerService, target, link } = await initRouterWithLink({ x: 0, y: 0 }, { x: 300, y: 0 });

        const pendingLinks = [];
        routerService.on('pending', (l) => pendingLinks.push(l));

        target.position(300, 400);

        assert.equal(pendingLinks.length, 1);
        assert.equal(pendingLinks[0], link);
        assert.ok(isOrthogonalPath(link), 'the route only bends at right angles');

        routerService.removeGraphListeners();
    });

    QUnit.test('resizing a connected element triggers "pending"', async assert => {
        const { routerService, target, link } = await initRouterWithLink({ x: 0, y: 0 }, { x: 300, y: 0 });

        const pendingLinks = [];
        routerService.on('pending', (l) => pendingLinks.push(l));

        target.resize(50, 50);

        assert.equal(pendingLinks.length, 1);
        assert.equal(pendingLinks[0], link);

        routerService.removeGraphListeners();
    });

    QUnit.test('rewiring a link\'s source to another element triggers "pending" and results in an orthogonal route', async assert => {
        const { graph, routerService, link } = await initRouterWithLink({ x: 0, y: 0 }, { x: 300, y: 0 });

        // Elements must be registered with the router (via `add`/`reset`)
        // before a link can reference them.
        const other = new joint.shapes.standard.Rectangle({ position: { x: 0, y: 400 }, size: { width: 100, height: 100 } });
        graph.addCell(other);

        const pendingLinks = [];
        routerService.on('pending', (l) => pendingLinks.push(l));

        link.source({ id: other.id });

        assert.equal(pendingLinks.length, 1);
        assert.ok(isOrthogonalPath(link));

        routerService.removeGraphListeners();
    });

    QUnit.test('a straight, already-aligned link is left without vertices', async assert => {
        const { link, routerService } = await initRouterWithLink({ x: 0, y: 0 }, { x: 300, y: 0 });

        assert.deepEqual(link.vertices(), []);

        routerService.removeGraphListeners();
    });
});

QUnit.module('routed event & getRoute', () => {
    QUnit.test('"routed" fires and getRoute() reflects avoid\'s raw route as cells are added and moved', async assert => {
        const graph = new joint.dia.Graph();
        const routerService = await joint.routers.avoid.init({ graph });

        const routedLinks = [];
        routerService.on('routed', (l) => routedLinks.push(l));

        const source = new joint.shapes.standard.Rectangle({ position: { x: 0, y: 0 }, size: { width: 100, height: 100 } });
        const target = new joint.shapes.standard.Rectangle({ position: { x: 300, y: 0 }, size: { width: 100, height: 100 } });
        const link = new joint.shapes.standard.Link({ source: { id: source.id }, target: { id: target.id } });
        graph.resetCells([source, target, link]);

        assert.equal(routedLinks.length, 1, '"routed" fires once avoid computes the initial route');
        assert.deepEqual(
            routerService.getRoute(link.id).map((p) => ({ x: p.x, y: p.y })),
            [{ x: 50, y: 50 }, { x: 350, y: 50 }]
        );

        target.position(300, 400);

        assert.equal(routedLinks.length, 2, '"routed" fires again once avoid recomputes the route');
        assert.ok(Array.isArray(routerService.getRoute(link.id)));
        assert.ok(isOrthogonalPath(link));

        routerService.removeGraphListeners();
    });

    QUnit.test('returns undefined for a link that has not been registered with avoid yet', async assert => {
        const graph = new joint.dia.Graph();
        const routerService = await joint.routers.avoid.init({ graph });

        const source = new joint.shapes.standard.Rectangle({ position: { x: 0, y: 0 }, size: { width: 100, height: 100 } });
        const link = new joint.shapes.standard.Link({ source: { id: source.id }, target: { x: 400, y: 400 } });
        graph.resetCells([source, link]);

        // A point-ended link is never registered with avoid, so it never
        // receives a route through `getRoute()`.
        assert.strictEqual(routerService.getRoute(link.id), undefined);

        routerService.removeGraphListeners();
    });
});

QUnit.module('filterLink', () => {
    QUnit.test('a filtered-out link never receives "pending"/"routed" or a route, regardless of endpoint moves', async assert => {
        const graph = new joint.dia.Graph();
        const routerService = await joint.routers.avoid.init({
            graph,
            filterLink: (l) => !l.get('doNotRoute')
        });

        const source = new joint.shapes.standard.Rectangle({ position: { x: 0, y: 0 }, size: { width: 100, height: 100 } });
        const target = new joint.shapes.standard.Rectangle({ position: { x: 300, y: 0 }, size: { width: 100, height: 100 } });
        const link = new joint.shapes.standard.Link({
            source: { id: source.id },
            target: { id: target.id },
            doNotRoute: true
        });
        graph.resetCells([source, target, link]);

        const pendingLinks = [];
        const routedLinks = [];
        routerService.on('pending', (l) => pendingLinks.push(l));
        routerService.on('routed', (l) => routedLinks.push(l));

        target.position(300, 400);
        link.target({ x: 500, y: 500 });

        assert.equal(pendingLinks.length, 0);
        assert.equal(routedLinks.length, 0);
        assert.deepEqual(link.vertices(), []);
        assert.notOk(link.source().anchor);
        assert.notOk(link.target().anchor);
        assert.strictEqual(routerService.getRoute(link.id), undefined);

        routerService.removeGraphListeners();
    });
});

QUnit.module('filterElement', () => {
    // Note: `filterElement` only controls whether an element is registered
    // as an avoid *shape* - it does not also exclude links between such
    // elements from being registered as avoid *connectors*, and a connector
    // referencing an unregistered shape crashes the underlying WASM engine.
    // `filterLink` is set here too so this link is skipped entirely,
    // sidestepping that crash while still exercising the `filterElement`
    // guard on the position/size handler.
    QUnit.test('moving a filtered-out element does not trigger "pending" for its connected links', async assert => {
        const graph = new joint.dia.Graph();
        const routerService = await joint.routers.avoid.init({
            graph,
            filterElement: (el) => !el.get('doNotRoute'),
            filterLink: (l) => !l.get('doNotRoute')
        });

        const source = new joint.shapes.standard.Rectangle({
            position: { x: 0, y: 0 }, size: { width: 100, height: 100 }, doNotRoute: true
        });
        const target = new joint.shapes.standard.Rectangle({
            position: { x: 300, y: 0 }, size: { width: 100, height: 100 }, doNotRoute: true
        });
        const link = new joint.shapes.standard.Link({
            source: { id: source.id },
            target: { id: target.id },
            doNotRoute: true
        });
        graph.resetCells([source, target, link]);

        const pendingLinks = [];
        routerService.on('pending', (l) => pendingLinks.push(l));

        target.position(300, 400);

        assert.equal(pendingLinks.length, 0);

        routerService.removeGraphListeners();
    });
});

QUnit.module('links with a loose end', () => {
    QUnit.test('changing a link\'s target to a loose point applies a fallback route but never "pending"/"routed"', async assert => {
        const { routerService, link } = await initRouterWithLink({ x: 0, y: 0 }, { x: 300, y: 0 });

        const pendingLinks = [];
        const routedLinks = [];
        routerService.on('pending', (l) => pendingLinks.push(l));
        routerService.on('routed', (l) => routedLinks.push(l));

        link.target({ x: 500, y: 500 });

        assert.equal(pendingLinks.length, 0, 'a point-ended link is excluded from avoid, so it is never "pending"');
        assert.equal(routedLinks.length, 0, 'and avoid never gets to compute a route for it either');
        assert.ok(isOrthogonalPath(link), 'it still gets a sane fallback route');

        routerService.removeGraphListeners();
    });

    QUnit.test('a link added with a point end already set gets a fallback route immediately', async assert => {
        const graph = new joint.dia.Graph();
        const routerService = await joint.routers.avoid.init({ graph });

        const source = new joint.shapes.standard.Rectangle({ position: { x: 0, y: 0 }, size: { width: 100, height: 100 } });
        graph.addCell(source);

        const link = new joint.shapes.standard.Link({
            source: { id: source.id },
            target: { x: 400, y: 400 }
        });
        graph.addCell(link);

        assert.ok(isOrthogonalPath(link));

        routerService.removeGraphListeners();
    });
});

QUnit.module('addGraphListeners / removeGraphListeners', () => {
    QUnit.test('removeGraphListeners stops reacting to graph changes; addGraphListeners resumes it', async assert => {
        const { routerService, target } = await initRouterWithLink({ x: 0, y: 0 }, { x: 300, y: 0 });

        const pendingLinks = [];
        routerService.on('pending', (l) => pendingLinks.push(l));

        routerService.removeGraphListeners();
        target.position(300, 400);
        assert.equal(pendingLinks.length, 0, 'no longer reacts once listeners are removed');

        routerService.addGraphListeners();
        target.position(300, 500);
        assert.equal(pendingLinks.length, 1, 'reacts again once listeners are re-added');

        routerService.removeGraphListeners();
    });
});
