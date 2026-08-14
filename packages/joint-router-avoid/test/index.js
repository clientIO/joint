// These tests exercise `RouterService` end-to-end against the real
// `MainThreadProvider` (and, through it, the actual libavoid WASM engine).
//
// Note: within a single `addCell()`/`addCells()` call, list an element
// before any link that references it. `onCellAdded` reacts to each cell as
// it is added and never revisits a link once its elements are added later
// in the same call, so such a link is left on its fallback route forever.
// `resetCells()` doesn't have this restriction, since it re-derives shapes
// and connectors from the graph's final state rather than from add-event
// order - as does the initial sync `RouterService` performs on start-up
// (see the "cells present before init()" module below).

async function initRouterWithLink(sourcePosition, targetPosition, options = {}) {
    const graph = new joint.dia.Graph();
    const routerService = await joint.routers.avoid.initAvoidRouter(graph, options);

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
        assert.ok(typeof joint.routers.avoid.initAvoidRouter === 'function');
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
        routerService.on('link:pending', (l) => pendingLinks.push(l));

        target.position(300, 400);

        assert.equal(pendingLinks.length, 1);
        assert.equal(pendingLinks[0], link);
        assert.ok(isOrthogonalPath(link), 'the route only bends at right angles');

        routerService.removeGraphListeners();
    });

    QUnit.test('resizing a connected element triggers "pending"', async assert => {
        const { routerService, target, link } = await initRouterWithLink({ x: 0, y: 0 }, { x: 300, y: 0 });

        const pendingLinks = [];
        routerService.on('link:pending', (l) => pendingLinks.push(l));

        target.resize(50, 50);

        assert.equal(pendingLinks.length, 1);
        assert.equal(pendingLinks[0], link);

        routerService.removeGraphListeners();
    });

    QUnit.test('rewiring a link\'s source to another element triggers "pending" and results in an orthogonal route', async assert => {
        const { graph, routerService, link } = await initRouterWithLink({ x: 0, y: 0 }, { x: 300, y: 0 });

        // Elements must be registered with the router (via `add`/`reset`)
        // before a link can reference them.
        const other = new joint.shapes.standard.Rectangle({ position: { x: 0, y: 400 }, size: { width: 100, height: 100 }});
        graph.addCell(other);

        const pendingLinks = [];
        routerService.on('link:pending', (l) => pendingLinks.push(l));

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
        const routerService = await joint.routers.avoid.initAvoidRouter(graph, {});

        const routedLinks = [];
        routerService.on('link:routed', (l) => routedLinks.push(l));

        const source = new joint.shapes.standard.Rectangle({ position: { x: 0, y: 0 }, size: { width: 100, height: 100 }});
        const target = new joint.shapes.standard.Rectangle({ position: { x: 300, y: 0 }, size: { width: 100, height: 100 }});
        const link = new joint.shapes.standard.Link({ source: { id: source.id }, target: { id: target.id }});
        graph.resetCells([source, target, link]);

        assert.equal(routedLinks.length, 1, '"routed" fires once avoid computes the initial route');
        assert.deepEqual(
            routerService.getRoute(link.id).map((p) => ({ x: p.x, y: p.y })),
            [{ x: 50, y: 50 }, { x: 350, y: 50 }]
        );

        target.position(300, 400);

        // A position change applies an interim fallback route silently (see
        // the "pending event & immediate fallback route" module) and fires
        // "pending"; "routed" fires again once avoid recomputes the real
        // route asynchronously.
        assert.equal(routedLinks.length, 2, '"routed" fires again once avoid recomputes the route');
        assert.ok(Array.isArray(routerService.getRoute(link.id)));
        assert.ok(isOrthogonalPath(link));

        routerService.removeGraphListeners();
    });

    QUnit.test('returns undefined for a link that has not been registered with avoid yet', async assert => {
        const graph = new joint.dia.Graph();
        const routerService = await joint.routers.avoid.initAvoidRouter(graph, {});

        const source = new joint.shapes.standard.Rectangle({ position: { x: 0, y: 0 }, size: { width: 100, height: 100 }});
        const link = new joint.shapes.standard.Link({ source: { id: source.id }, target: { x: 400, y: 400 }});
        graph.resetCells([source, link]);

        // A point-ended link is never registered with avoid, so it never
        // receives a route through `getRoute()`.
        assert.strictEqual(routerService.getRoute(link.id), undefined);

        routerService.removeGraphListeners();
    });
});

QUnit.module('routed carries a fallback flag and never leaves a link stuck pending', () => {
    QUnit.test('"routed" reports fallback: false for a route avoid actually computed', async assert => {
        const { graph, routerService, source, link } = await initRouterWithLink({ x: 0, y: 0 }, { x: 300, y: 0 });

        const other = new joint.shapes.standard.Rectangle({ position: { x: 300, y: 400 }, size: { width: 100, height: 100 }});
        graph.addCell(other);

        const routedEvents = [];
        routerService.on('link:routed', (l, opt) => routedEvents.push(opt));

        link.target({ id: other.id });

        // The rewire applies an interim fallback route silently (see the
        // "pending event & immediate fallback route" module), then "routed"
        // fires once avoid computes the real route (fallback: false).
        assert.equal(routedEvents.length, 1);
        assert.notOk(routedEvents[0].fallback, 'avoid computed the final route, so it is not a fallback');
        assert.notEqual(link.getTargetElement(), source, 'sanity: the rewire actually took effect');

        routerService.removeGraphListeners();
    });

    // With `MainThreadProvider`, avoid responds synchronously within the
    // same `provider.updateConnector()` call, so there's no natural gap
    // between "pending" and avoid's answer to race a detach into. A
    // `pending` listener that itself mutates the link (as application code
    // reacting to `pending` well might) reproduces the same gap
    // deterministically: the link is detached, from `RouterService`'s
    // perspective, while its avoid computation is still outstanding -
    // exactly what happens with a `useWorker: true` provider, whose
    // response is genuinely asynchronous.
    QUnit.test('detaching a link while its avoid computation is still outstanding closes the pending cycle via the fallback route', async assert => {
        const { graph, routerService, link } = await initRouterWithLink({ x: 0, y: 0 }, { x: 300, y: 0 });

        const other = new joint.shapes.standard.Rectangle({ position: { x: 0, y: 400 }, size: { width: 100, height: 100 }});
        graph.addCell(other);

        const events = [];
        routerService.on('link:pending', (l) => {
            events.push({ type: 'pending', link: l });
            link.target({ x: 500, y: 500 });
        });
        routerService.on('link:routed', (l, opt) => events.push({ type: 'routed', link: l, fallback: opt.fallback }));

        link.target({ id: other.id });

        // The rewire applies an interim fallback route silently and fires
        // "pending", same as any other source/target change. The detach
        // happens inside the "pending" listener, closing the cycle with
        // "routed" instead of leaving it stuck.
        assert.deepEqual(
            events.map((e) => e.type),
            ['pending', 'routed'],
            'the pending cycle is closed, not left stuck'
        );
        assert.strictEqual(events[1].fallback, true, 'closed via the fallback route, not an avoid response');
        assert.ok(isOrthogonalPath(link));

        routerService.removeGraphListeners();
    });
});

QUnit.module('skipLink', () => {
    QUnit.test('a skipped link never receives "pending"/"routed" or a route, regardless of endpoint moves', async assert => {
        const graph = new joint.dia.Graph();
        const routerService = await joint.routers.avoid.initAvoidRouter(graph, {
            skipLink: ({ link }) => link.get('doNotRoute')
        });

        const source = new joint.shapes.standard.Rectangle({ position: { x: 0, y: 0 }, size: { width: 100, height: 100 }});
        const target = new joint.shapes.standard.Rectangle({ position: { x: 300, y: 0 }, size: { width: 100, height: 100 }});
        const link = new joint.shapes.standard.Link({
            source: { id: source.id },
            target: { id: target.id },
            doNotRoute: true
        });
        graph.resetCells([source, target, link]);

        const pendingLinks = [];
        const routedLinks = [];
        routerService.on('link:pending', (l) => pendingLinks.push(l));
        routerService.on('link:routed', (l) => routedLinks.push(l));

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

QUnit.module('skipElement', () => {
    // Note: `skipElement` only controls whether an element is registered
    // as an avoid *shape* - it does not also exclude links between such
    // elements from being registered as avoid *connectors*, and a connector
    // referencing an unregistered shape crashes the underlying WASM engine.
    // `skipLink` is set here too so this link is skipped entirely,
    // sidestepping that crash while still exercising the `skipElement`
    // guard on the position/size handler.
    QUnit.test('moving a skipped element does not trigger "pending" for its connected links', async assert => {
        const graph = new joint.dia.Graph();
        const routerService = await joint.routers.avoid.initAvoidRouter(graph, {
            skipElement: ({ element }) => element.get('doNotRoute'),
            skipLink: ({ link }) => link.get('doNotRoute')
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
        routerService.on('link:pending', (l) => pendingLinks.push(l));

        target.position(300, 400);

        assert.equal(pendingLinks.length, 0);

        routerService.removeGraphListeners();
    });
});

QUnit.module('links with a loose end', () => {
    QUnit.test('changing a link\'s target to a loose point applies a fallback route but never "pending", and "routed" carries fallback: true', async assert => {
        const { routerService, link } = await initRouterWithLink({ x: 0, y: 0 }, { x: 300, y: 0 });

        const pendingLinks = [];
        const routedEvents = [];
        routerService.on('link:pending', (l) => pendingLinks.push(l));
        routerService.on('link:routed', (l, opt) => routedEvents.push(opt));

        link.target({ x: 500, y: 500 });

        assert.equal(pendingLinks.length, 0, 'a point-ended link is excluded from avoid, so it is never "pending"');
        assert.equal(routedEvents.length, 1, 'the fallback route still closes out with "routed"');
        assert.strictEqual(routedEvents[0].fallback, true, 'avoid never gets to compute a route for it - this is the fallback');
        assert.ok(isOrthogonalPath(link), 'it still gets a sane fallback route');

        routerService.removeGraphListeners();
    });

    QUnit.test('a link added with a point end already set gets a fallback route immediately', async assert => {
        const graph = new joint.dia.Graph();
        const routerService = await joint.routers.avoid.initAvoidRouter(graph, {});

        const source = new joint.shapes.standard.Rectangle({ position: { x: 0, y: 0 }, size: { width: 100, height: 100 }});
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

QUnit.module('interceptUnroutableLink', () => {
    QUnit.test('is called with "unconnected" for a loose end and can suppress the built-in fallback route', async assert => {
        const calls = [];
        const { link, routerService } = await initRouterWithLink({ x: 0, y: 0 }, { x: 300, y: 0 }, {
            interceptUnroutableLink: ({ reason }) => {
                calls.push(reason);
                return true;
            }
        });

        const routedEvents = [];
        routerService.on('link:routed', (l, opt) => routedEvents.push(opt));

        link.target({ x: 500, y: 500 });

        assert.deepEqual(calls, ['unconnected']);
        assert.deepEqual(link.vertices(), [], 'the built-in rightAngle fallback was skipped, so vertices are untouched');
        assert.equal(routedEvents.length, 0, 'the link was never pending, so claiming it fires no event at all');

        routerService.removeGraphListeners();
    });

    QUnit.test('is called with "untracked-element" for a link into an element excluded via skipElement', async assert => {
        const graph = new joint.dia.Graph();
        const calls = [];
        const routerService = await joint.routers.avoid.initAvoidRouter(graph, {
            skipElement: ({ element }) => element.get('doNotRoute'),
            interceptUnroutableLink: ({ reason }) => {
                calls.push(reason);
                return true;
            }
        });

        const source = new joint.shapes.standard.Rectangle({ position: { x: 0, y: 0 }, size: { width: 100, height: 100 }});
        const target = new joint.shapes.standard.Rectangle({
            position: { x: 300, y: 0 }, size: { width: 100, height: 100 }, doNotRoute: true
        });
        const link = new joint.shapes.standard.Link({ source: { id: source.id }, target: { id: target.id }});
        graph.resetCells([source, target, link]);

        assert.deepEqual(calls, ['untracked-element']);

        routerService.removeGraphListeners();
    });

    QUnit.test('returning false falls through to the built-in fallback route, unchanged from today\'s behavior', async assert => {
        const calls = [];
        const { link, routerService } = await initRouterWithLink({ x: 0, y: 0 }, { x: 300, y: 0 }, {
            interceptUnroutableLink: ({ reason }) => {
                calls.push(reason);
                return false;
            }
        });

        link.target({ x: 500, y: 500 });

        assert.deepEqual(calls, ['unconnected']);
        assert.ok(isOrthogonalPath(link), 'the built-in rightAngle fallback still applies');

        routerService.removeGraphListeners();
    });

    QUnit.test('is invoked again when a connected element moves while the link stays unroutable', async assert => {
        const calls = [];
        const { source, link, routerService } = await initRouterWithLink({ x: 0, y: 0 }, { x: 300, y: 0 }, {
            interceptUnroutableLink: ({ reason }) => {
                calls.push(reason);
                return true;
            }
        });

        link.target({ x: 500, y: 500 });
        assert.equal(calls.length, 1);

        // The link's remaining end (source) is still connected, so moving it
        // re-runs the position/size handler for this link.
        source.position(0, 200);
        assert.equal(calls.length, 2, 'moving the still-connected source element re-invokes the callback');

        routerService.removeGraphListeners();
    });
});

QUnit.module('addGraphListeners / removeGraphListeners', () => {
    QUnit.test('removeGraphListeners stops reacting to graph changes; addGraphListeners resumes it', async assert => {
        const { routerService, target } = await initRouterWithLink({ x: 0, y: 0 }, { x: 300, y: 0 });

        const pendingLinks = [];
        routerService.on('link:pending', (l) => pendingLinks.push(l));

        routerService.removeGraphListeners();
        target.position(300, 400);
        assert.equal(pendingLinks.length, 0, 'no longer reacts once listeners are removed');

        routerService.addGraphListeners();
        target.position(300, 500);
        assert.equal(pendingLinks.length, 1, 'reacts again once listeners are re-added');

        routerService.removeGraphListeners();
    });
});

QUnit.module('cells present before init() or listener (re)attachment', () => {
    // `RouterService` used to only react to future graph changes. Elements
    // and links already in the graph when `init()` was called (or added
    // while `removeGraphListeners()`/`addGraphListeners()` had listeners
    // detached) were never registered as avoid shapes/connectors.
    // Referencing such an unregistered shape later - e.g. by rewiring a
    // link - aborted the underlying WASM module irrecoverably.

    QUnit.test('a link whose elements already existed before init() gets registered and can be safely rewired', async assert => {
        const graph = new joint.dia.Graph();

        const source = new joint.shapes.standard.Rectangle({ position: { x: 0, y: 0 }, size: { width: 100, height: 100 }});
        const target = new joint.shapes.standard.Rectangle({ position: { x: 300, y: 0 }, size: { width: 100, height: 100 }});
        const other = new joint.shapes.standard.Rectangle({ position: { x: 0, y: 400 }, size: { width: 100, height: 100 }});
        const link = new joint.shapes.standard.Link({ source: { id: source.id }, target: { id: target.id }});
        graph.resetCells([source, target, other, link]);

        // init() is called AFTER the cells already exist in the graph.
        const routerService = await joint.routers.avoid.initAvoidRouter(graph, {});

        const routedLinks = [];
        routerService.on('link:routed', (l) => routedLinks.push(l));

        link.source({ id: other.id });

        // The rewire applies an interim fallback route silently, then
        // "routed" fires once avoid computes the real route.
        assert.equal(routedLinks.length, 1, 'the pre-existing link is routed by avoid once rewired');
        assert.ok(isOrthogonalPath(link));

        routerService.removeGraphListeners();
    });

    QUnit.test('cells added while listeners are detached are synced once addGraphListeners() resumes', async assert => {
        const { graph, routerService, link } = await initRouterWithLink({ x: 0, y: 0 }, { x: 300, y: 0 });

        routerService.removeGraphListeners();

        const other = new joint.shapes.standard.Rectangle({ position: { x: 0, y: 400 }, size: { width: 100, height: 100 }});
        graph.addCell(other);
        // Rewired while detached: avoid never sees this change.
        link.source({ id: other.id });

        routerService.addGraphListeners();

        const routedLinks = [];
        routerService.on('link:routed', (l) => routedLinks.push(l));

        // Nudging `other` forces avoid to (re)compute the route; this used
        // to abort the module since neither `other`'s shape nor the link's
        // connector had ever been registered while listeners were off.
        other.position(0, 500);

        assert.ok(routedLinks.length > 0, 'the connector was synced on resume and got routed');
        assert.ok(isOrthogonalPath(link));

        routerService.removeGraphListeners();
    });
});
