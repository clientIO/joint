// These tests exercise `RouterService` end-to-end against the real
// `MainThreadProvider` (and, through it, the actual libavoid WASM engine).
//
// Note: within a single `addCell()`/`addCells()` call, list an element
// before any link that references it. `onCellAdded` reacts to each cell as
// it is added and never revisits a link once its elements are added later
// in the same call, so such a link is left on its fallback route forever.
// `resetCells()` doesn't have this restriction, since it re-derives shapes
// and connectors from the graph's final state rather than from add-event
// order - as does the initial sync `start()` performs on start-up
// (see the "cells present before start()" module below).

async function initRouterWithLink(sourcePosition, targetPosition, options = {}) {
    const graph = new joint.dia.Graph();

    const size = { width: 100, height: 100 };
    const source = new joint.shapes.standard.Rectangle({ position: sourcePosition, size });
    const target = new joint.shapes.standard.Rectangle({ position: targetPosition, size });
    const link = new joint.shapes.standard.Link({
        source: { id: source.id },
        target: { id: target.id }
    });
    graph.resetCells([source, target, link]);

    const routerService = await joint.routers.avoid.initAvoidRouter(graph, options);
    routerService.start();

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

    QUnit.test('initAvoidRouter() resolves with the expected RouterService API', async assert => {
        const { routerService } = await initRouterWithLink({ x: 0, y: 0 }, { x: 300, y: 0 });

        assert.equal(typeof routerService.on, 'function');
        assert.equal(typeof routerService.off, 'function');
        assert.equal(typeof routerService.trigger, 'function');
        assert.equal(typeof routerService.start, 'function');
        assert.equal(typeof routerService.stop, 'function');
        assert.equal(typeof routerService.destroy, 'function');
        assert.equal(typeof routerService.routeAll, 'function');
        assert.equal(typeof routerService.routeSubgraph, 'function');
        assert.equal(typeof routerService.isStarted, 'boolean');

        routerService.stop();
    });
});

QUnit.module('routing event & immediate fallback route', () => {
    QUnit.test('moving a connected element triggers "routing" and results in an orthogonal route', async assert => {
        const { routerService, target, link } = await initRouterWithLink({ x: 0, y: 0 }, { x: 300, y: 0 });

        const routingLinks = [];
        routerService.on('link:routing', (l) => routingLinks.push(l));

        target.position(300, 400);

        assert.equal(routingLinks.length, 1);
        assert.equal(routingLinks[0], link);
        assert.ok(isOrthogonalPath(link), 'the route only bends at right angles');

        routerService.stop();
    });

    QUnit.test('resizing a connected element triggers "routing"', async assert => {
        const { routerService, target, link } = await initRouterWithLink({ x: 0, y: 0 }, { x: 300, y: 0 });

        const routingLinks = [];
        routerService.on('link:routing', (l) => routingLinks.push(l));

        target.resize(50, 50);

        assert.equal(routingLinks.length, 1);
        assert.equal(routingLinks[0], link);

        routerService.stop();
    });

    QUnit.test('rewiring a link\'s source to another element triggers "routing" and results in an orthogonal route', async assert => {
        const { graph, routerService, link } = await initRouterWithLink({ x: 0, y: 0 }, { x: 300, y: 0 });

        // Elements must be registered with the router (via `add`/`reset`)
        // before a link can reference them.
        const other = new joint.shapes.standard.Rectangle({ position: { x: 0, y: 400 }, size: { width: 100, height: 100 }});
        graph.addCell(other);

        const routingLinks = [];
        routerService.on('link:routing', (l) => routingLinks.push(l));

        link.source({ id: other.id });

        assert.equal(routingLinks.length, 1);
        assert.ok(isOrthogonalPath(link));

        routerService.stop();
    });

    QUnit.test('a straight, already-aligned link is left without vertices', async assert => {
        const { link, routerService } = await initRouterWithLink({ x: 0, y: 0 }, { x: 300, y: 0 });

        assert.deepEqual(link.vertices(), []);

        routerService.stop();
    });
});

QUnit.module('routed event', () => {
    QUnit.test('"routed" fires as cells are added and moved', async assert => {
        const graph = new joint.dia.Graph();
        const source = new joint.shapes.standard.Rectangle({ position: { x: 0, y: 0 }, size: { width: 100, height: 100 }});
        const target = new joint.shapes.standard.Rectangle({ position: { x: 300, y: 0 }, size: { width: 100, height: 100 }});
        const link = new joint.shapes.standard.Link({ source: { id: source.id }, target: { id: target.id }});
        graph.resetCells([source, target, link]);

        const routerService = await joint.routers.avoid.initAvoidRouter(graph, {});

        const routedLinks = [];
        routerService.on('link:routed', (l) => routedLinks.push(l));

        routerService.start();

        assert.equal(routedLinks.length, 1, '"routed" fires once avoid computes the initial route');

        target.position(300, 400);

        // A position change applies an interim fallback route silently (see
        // the "routing event & immediate fallback route" module) and fires
        // "routing"; "routed" fires again once avoid recomputes the real
        // route asynchronously.
        assert.equal(routedLinks.length, 2, '"routed" fires again once avoid recomputes the route');
        assert.ok(isOrthogonalPath(link));

        routerService.stop();
    });
});

QUnit.module('routed carries a fallback flag and never leaves a link stuck routing', () => {
    QUnit.test('"routed" reports fallback: false for a route avoid actually computed', async assert => {
        const { graph, routerService, source, link } = await initRouterWithLink({ x: 0, y: 0 }, { x: 300, y: 0 });

        const other = new joint.shapes.standard.Rectangle({ position: { x: 300, y: 400 }, size: { width: 100, height: 100 }});
        graph.addCell(other);

        const routedEvents = [];
        routerService.on('link:routed', (l, opt) => routedEvents.push(opt));

        link.target({ id: other.id });

        // The rewire applies an interim fallback route silently (see the
        // "routing event & immediate fallback route" module), then "routed"
        // fires once avoid computes the real route (origin: 'avoid').
        assert.equal(routedEvents.length, 1);
        assert.strictEqual(routedEvents[0].origin, 'avoid', 'avoid computed the final route, so its origin is "avoid"');
        assert.notEqual(link.getTargetElement(), source, 'sanity: the rewire actually took effect');

        routerService.stop();
    });

    // With `MainThreadProvider`, avoid responds synchronously within the
    // same `provider.setConnector()` call, so there's no natural gap
    // between "routing" and avoid's answer to race a detach into. A
    // `routing` listener that itself mutates the link (as application code
    // reacting to `routing` well might) reproduces the same gap
    // deterministically: the link is detached, from `RouterService`'s
    // perspective, while its avoid computation is still outstanding -
    // exactly what happens with a `useWorker: true` provider, whose
    // response is genuinely asynchronous.
    QUnit.test('detaching a link while its avoid computation is still outstanding closes the routing cycle via the fallback route', async assert => {
        const { graph, routerService, link } = await initRouterWithLink({ x: 0, y: 0 }, { x: 300, y: 0 });

        const other = new joint.shapes.standard.Rectangle({ position: { x: 0, y: 400 }, size: { width: 100, height: 100 }});
        graph.addCell(other);

        const events = [];
        routerService.on('link:routing', (l) => {
            events.push({ type: 'routing', link: l });
            link.target({ x: 500, y: 500 });
        });
        routerService.on('link:routed', (l, opt) => events.push({ type: 'routed', link: l, origin: opt.origin }));

        link.target({ id: other.id });

        // The rewire applies an interim fallback route silently and fires
        // "routing", same as any other source/target change. The detach
        // happens inside the "routing" listener, closing the cycle with
        // "routed" instead of leaving it stuck.
        assert.deepEqual(
            events.map((e) => e.type),
            ['routing', 'routed'],
            'the routing cycle is closed, not left stuck'
        );
        assert.strictEqual(events[1].origin, 'fallback', 'closed via the fallback route, not an avoid response');
        assert.ok(isOrthogonalPath(link));

        routerService.stop();
    });
});

QUnit.module('trackLink', () => {
    QUnit.test('an untracked link never receives "routing"/"routed" or a route, regardless of endpoint moves', async assert => {
        const graph = new joint.dia.Graph();
        const source = new joint.shapes.standard.Rectangle({ position: { x: 0, y: 0 }, size: { width: 100, height: 100 }});
        const target = new joint.shapes.standard.Rectangle({ position: { x: 300, y: 0 }, size: { width: 100, height: 100 }});
        const link = new joint.shapes.standard.Link({
            source: { id: source.id },
            target: { id: target.id },
            doNotRoute: true
        });
        graph.resetCells([source, target, link]);

        const routerService = await joint.routers.avoid.initAvoidRouter(graph, {
            trackLink: ({ link }) => !link.get('doNotRoute')
        });
        routerService.start();

        const routingLinks = [];
        const routedLinks = [];
        routerService.on('link:routing', (l) => routingLinks.push(l));
        routerService.on('link:routed', (l) => routedLinks.push(l));

        target.position(300, 400);
        link.target({ x: 500, y: 500 });

        assert.equal(routingLinks.length, 0);
        assert.equal(routedLinks.length, 0);
        assert.deepEqual(link.vertices(), []);
        assert.notOk(link.source().anchor);
        assert.notOk(link.target().anchor);

        routerService.stop();
    });
});

QUnit.module('trackElement', () => {
    // Note: `trackElement` only controls whether an element is registered
    // as an avoid *shape* - it does not also exclude links between such
    // elements from being registered as avoid *connectors*, and a connector
    // referencing an unregistered shape crashes the underlying WASM engine.
    // `trackLink` is set here too so this link is excluded entirely,
    // sidestepping that crash while still exercising the `trackElement`
    // guard on the position/size handler.
    QUnit.test('moving an untracked element does not trigger "routing" for its connected links', async assert => {
        const graph = new joint.dia.Graph();
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

        const routerService = await joint.routers.avoid.initAvoidRouter(graph, {
            trackElement: ({ element }) => !element.get('doNotRoute'),
            trackLink: ({ link }) => !link.get('doNotRoute')
        });
        routerService.start();

        const routingLinks = [];
        routerService.on('link:routing', (l) => routingLinks.push(l));

        target.position(300, 400);

        assert.equal(routingLinks.length, 0);

        routerService.stop();
    });
});

QUnit.module('links with a loose end', () => {
    QUnit.test('changing a link\'s target to a loose point applies a fallback route but never "routing", and "routed" carries origin: "fallback"', async assert => {
        const { routerService, link } = await initRouterWithLink({ x: 0, y: 0 }, { x: 300, y: 0 });

        const routingLinks = [];
        const routedEvents = [];
        routerService.on('link:routing', (l) => routingLinks.push(l));
        routerService.on('link:routed', (l, opt) => routedEvents.push(opt));

        link.target({ x: 500, y: 500 });

        assert.equal(routingLinks.length, 0, 'a point-ended link is excluded from avoid, so it never enters a "routing" cycle');
        assert.equal(routedEvents.length, 1, 'the fallback route still closes out with "routed"');
        assert.strictEqual(routedEvents[0].origin, 'fallback', 'avoid never gets to compute a route for it - this is the fallback');
        assert.ok(isOrthogonalPath(link), 'it still gets a sane fallback route');

        routerService.stop();
    });

    QUnit.test('a link added with a point end already set gets a fallback route immediately', async assert => {
        const graph = new joint.dia.Graph();
        const source = new joint.shapes.standard.Rectangle({ position: { x: 0, y: 0 }, size: { width: 100, height: 100 }});
        const link = new joint.shapes.standard.Link({
            source: { id: source.id },
            target: { x: 400, y: 400 }
        });
        graph.resetCells([source, link]);

        const routerService = await joint.routers.avoid.initAvoidRouter(graph, {});
        routerService.start();

        assert.ok(isOrthogonalPath(link));

        routerService.stop();
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
        assert.equal(routedEvents.length, 0, 'the link was never routing, so claiming it fires no event at all');

        routerService.stop();
    });

    QUnit.test('is called with "untracked" for a link into an element excluded via trackElement', async assert => {
        const graph = new joint.dia.Graph();
        const calls = [];
        const source = new joint.shapes.standard.Rectangle({ position: { x: 0, y: 0 }, size: { width: 100, height: 100 }});
        const target = new joint.shapes.standard.Rectangle({
            position: { x: 300, y: 0 }, size: { width: 100, height: 100 }, doNotRoute: true
        });
        const link = new joint.shapes.standard.Link({ source: { id: source.id }, target: { id: target.id }});
        graph.resetCells([source, target, link]);

        const routerService = await joint.routers.avoid.initAvoidRouter(graph, {
            trackElement: ({ element }) => !element.get('doNotRoute'),
            interceptUnroutableLink: ({ reason }) => {
                calls.push(reason);
                return true;
            }
        });
        routerService.start();

        assert.deepEqual(calls, ['untracked']);

        routerService.stop();
    });

    QUnit.test('is called with "unsupported" for a link connected to another link', async assert => {
        const graph = new joint.dia.Graph();
        const calls = [];
        const source = new joint.shapes.standard.Rectangle({ position: { x: 0, y: 0 }, size: { width: 100, height: 100 }});
        const target = new joint.shapes.standard.Rectangle({ position: { x: 300, y: 0 }, size: { width: 100, height: 100 }});
        const embeddedLink = new joint.shapes.standard.Link({ source: { id: source.id }, target: { id: target.id }});
        const linkToLink = new joint.shapes.standard.Link({ source: { id: embeddedLink.id }, target: { id: target.id }});
        graph.resetCells([source, target, embeddedLink, linkToLink]);

        const routerService = await joint.routers.avoid.initAvoidRouter(graph, {
            interceptUnroutableLink: ({ reason }) => {
                calls.push(reason);
                return true;
            }
        });
        routerService.start();

        assert.deepEqual(calls, ['unsupported']);

        routerService.stop();
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

        routerService.stop();
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

        routerService.stop();
    });
});

QUnit.module('start / stop', () => {
    QUnit.test('stop() stops reacting to graph changes; start() resumes it', async assert => {
        const { routerService, target } = await initRouterWithLink({ x: 0, y: 0 }, { x: 300, y: 0 });

        const routingLinks = [];
        routerService.on('link:routing', (l) => routingLinks.push(l));

        routerService.stop();
        target.position(300, 400);
        assert.equal(routingLinks.length, 0, 'no longer reacts once stopped');

        routerService.start();
        // start() re-syncs the graph, which immediately applies a fallback
        // route (and fires "routing") for every routable link, not just
        // ones that changed since the last sync.
        assert.equal(routingLinks.length, 1, 'the resync on start() fires "routing" for the existing link');

        target.position(300, 500);
        assert.equal(routingLinks.length, 2, 'reacts again once started');

        routerService.stop();
    });
});

QUnit.module('cells present before start() or listener (re)attachment', () => {
    // Elements and links already in the graph when `start()` is called (or
    // added while stopped) are registered as avoid shapes/connectors by
    // `start()`'s initial sync. Referencing an unregistered shape later -
    // e.g. by rewiring a link - aborts the underlying WASM module
    // irrecoverably.

    QUnit.test('a link whose elements already existed before start() gets registered and can be safely rewired', async assert => {
        const graph = new joint.dia.Graph();

        const source = new joint.shapes.standard.Rectangle({ position: { x: 0, y: 0 }, size: { width: 100, height: 100 }});
        const target = new joint.shapes.standard.Rectangle({ position: { x: 300, y: 0 }, size: { width: 100, height: 100 }});
        const other = new joint.shapes.standard.Rectangle({ position: { x: 0, y: 400 }, size: { width: 100, height: 100 }});
        const link = new joint.shapes.standard.Link({ source: { id: source.id }, target: { id: target.id }});
        graph.resetCells([source, target, other, link]);

        // start() is called AFTER the cells already exist in the graph.
        const routerService = await joint.routers.avoid.initAvoidRouter(graph, {});
        routerService.start();

        const routedLinks = [];
        routerService.on('link:routed', (l) => routedLinks.push(l));

        link.source({ id: other.id });

        // The rewire applies an interim fallback route silently, then
        // "routed" fires once avoid computes the real route.
        assert.equal(routedLinks.length, 1, 'the pre-existing link is routed by avoid once rewired');
        assert.ok(isOrthogonalPath(link));

        routerService.stop();
    });

    QUnit.test('cells added while stopped are synced once start() resumes', async assert => {
        const { graph, routerService, link } = await initRouterWithLink({ x: 0, y: 0 }, { x: 300, y: 0 });

        routerService.stop();

        const other = new joint.shapes.standard.Rectangle({ position: { x: 0, y: 400 }, size: { width: 100, height: 100 }});
        graph.addCell(other);
        // Rewired while stopped: avoid never sees this change.
        link.source({ id: other.id });

        routerService.start();

        const routedLinks = [];
        routerService.on('link:routed', (l) => routedLinks.push(l));

        // Nudging `other` forces avoid to (re)compute the route; this used
        // to abort the module since neither `other`'s shape nor the link's
        // connector had ever been registered while stopped.
        other.position(0, 500);

        assert.ok(routedLinks.length > 0, 'the connector was synced on resume and got routed');
        assert.ok(isOrthogonalPath(link));

        routerService.stop();
    });
});

QUnit.module('idle event', () => {
    QUnit.test('fires once a sync has been fully processed', async assert => {
        const { routerService } = await initRouterWithLink({ x: 0, y: 0 }, { x: 300, y: 0 });

        let idleCount = 0;
        routerService.on('idle', () => idleCount++);

        // routeAll()/routeSubgraph() require the router to be stopped first.
        routerService.stop();
        await routerService.routeAll();

        assert.equal(idleCount, 1);
    });
});

QUnit.module('routeSubgraph()', () => {
    // Two entirely independent source/target/link triples, so a subgraph
    // built from one of them shares nothing with the other.
    function createPair(sourcePosition, targetPosition) {
        const size = { width: 100, height: 100 };
        const source = new joint.shapes.standard.Rectangle({ position: sourcePosition, size });
        const target = new joint.shapes.standard.Rectangle({ position: targetPosition, size });
        const link = new joint.shapes.standard.Link({
            source: { id: source.id },
            target: { id: target.id }
        });
        return { source, target, link, cells: [source, target, link] };
    }

    QUnit.test('throws if the router is currently started', async assert => {
        const { routerService } = await initRouterWithLink({ x: 0, y: 0 }, { x: 300, y: 0 });

        let error;
        try {
            await routerService.routeSubgraph([]);
        } catch (e) {
            error = e;
        }

        assert.ok(error instanceof Error, 'routeSubgraph() rejects while the router is started');
        assert.ok(/already started/i.test(error.message), 'the error explains why');

        routerService.stop();
    });

    QUnit.test('does not throw once the router has been stopped', async assert => {
        const { routerService, source, target, link } = await initRouterWithLink({ x: 0, y: 0 }, { x: 300, y: 0 });

        routerService.stop();

        await routerService.routeSubgraph([source, target, link]);

        assert.ok(true, 'routeSubgraph() resolved without throwing');
    });

    QUnit.test('routes only the given cells, leaving the rest of the graph untouched', async assert => {
        const graph = new joint.dia.Graph();

        const pairA = createPair({ x: 0, y: 0 }, { x: 300, y: 200 });
        const pairB = createPair({ x: 0, y: 400 }, { x: 300, y: 600 });
        graph.resetCells([...pairA.cells, ...pairB.cells]);

        const routerService = await joint.routers.avoid.initAvoidRouter(graph, {});

        const routedLinks = [];
        routerService.on('link:routed', (l) => routedLinks.push(l));

        await routerService.routeSubgraph(pairA.cells);

        assert.deepEqual(routedLinks, [pairA.link], 'only the given subgraph\'s link was routed');
        assert.ok(isOrthogonalPath(pairA.link), 'the routed link gets a sane route');
        assert.deepEqual(pairB.link.vertices(), [], 'the link outside the subgraph is left exactly as it was');
    });

    QUnit.test('a later call for a different subgraph does not undo an earlier one\'s routes', async assert => {
        const graph = new joint.dia.Graph();

        const pairA = createPair({ x: 0, y: 0 }, { x: 300, y: 200 });
        const pairB = createPair({ x: 0, y: 400 }, { x: 300, y: 600 });
        graph.resetCells([...pairA.cells, ...pairB.cells]);

        const routerService = await joint.routers.avoid.initAvoidRouter(graph, {});

        await routerService.routeSubgraph(pairA.cells);
        assert.ok(isOrthogonalPath(pairA.link), 'the first subgraph is routed');
        const verticesAfterFirstCall = pairA.link.vertices();

        await routerService.routeSubgraph(pairB.cells);
        assert.ok(isOrthogonalPath(pairB.link), 'the second subgraph is routed independently');

        assert.deepEqual(
            pairA.link.vertices(),
            verticesAfterFirstCall,
            'routing the second subgraph left the first subgraph\'s already-applied route untouched'
        );
    });
});

QUnit.module('destroy()', () => {
    // With `MainThreadProvider`, avoid answers synchronously, so a link's
    // routing cycle only stays open for the moment between `link:routing`
    // firing and avoid's answer arriving - there's no window left for a
    // normal, top-level `destroy()` call to observe it still open. Calling
    // `destroy()` from within the `link:routing` handler itself reproduces
    // that window deterministically (and is a realistic pattern in its own
    // right - e.g. a "cancel routing" action wired to the same event).
    QUnit.test('cancels any link with an open routing cycle instead of leaving it stuck', async assert => {
        const graph = new joint.dia.Graph();
        const source = new joint.shapes.standard.Rectangle({ position: { x: 0, y: 0 }, size: { width: 100, height: 100 }});
        const target = new joint.shapes.standard.Rectangle({ position: { x: 300, y: 0 }, size: { width: 100, height: 100 }});
        const link = new joint.shapes.standard.Link({ source: { id: source.id }, target: { id: target.id }});
        graph.resetCells([source, target, link]);

        const routerService = await joint.routers.avoid.initAvoidRouter(graph, {});

        const cancelledLinks = [];
        routerService.on('link:routing:cancelled', (l) => cancelledLinks.push(l));
        routerService.on('link:routing', () => {
            routerService.destroy();
        });

        routerService.start();

        assert.deepEqual(cancelledLinks, [link], 'the still-routing link is cancelled by destroy()');
    });

    QUnit.test('does nothing if there are no links with an open routing cycle', async assert => {
        const { routerService } = await initRouterWithLink({ x: 0, y: 0 }, { x: 300, y: 0 });

        const cancelledLinks = [];
        routerService.on('link:routing:cancelled', (l) => cancelledLinks.push(l));

        // By the time start() returns, MainThreadProvider has already
        // resolved every link's routing cycle synchronously.
        routerService.destroy();

        assert.deepEqual(cancelledLinks, []);
    });
});
