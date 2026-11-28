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

QUnit.module('routes avoid cannot find', () => {
    // Elements walling in the target: avoid finds no route to it and falls
    // back to a straight line between the ends. With the ends aligned, that
    // line looks like a valid route, but it runs through the wall.
    async function initWalledInTarget({ withGap }) {
        const graph = new joint.dia.Graph();
        const rect = (x, y, width, height) => new joint.shapes.standard.Rectangle({ position: { x, y }, size: { width, height }});
        const source = rect(0, 0, 100, 60);
        const target = rect(320, 0, 100, 60);
        const walls = [
            rect(270, -50, 200, 20),
            rect(270, 90, 200, 20),
            rect(270, -30, 20, 120),
            ...(withGap ? [] : [rect(450, -30, 20, 120)])
        ];
        const link = new joint.shapes.standard.Link({ source: { id: source.id }, target: { id: target.id }});
        graph.resetCells([source, target, ...walls, link]);

        const routerService = await joint.routers.avoid.initAvoidRouter(graph, {});
        const routedEvents = [];
        routerService.on('link:routed', (l, opt) => routedEvents.push(opt));
        routerService.start();
        return { routerService, routedEvents };
    }

    QUnit.test('a link to a walled-in target gets the fallback route', async assert => {
        const { routerService, routedEvents } = await initWalledInTarget({ withGap: false });

        assert.equal(routedEvents.length, 1);
        assert.strictEqual(routedEvents[0].origin, 'fallback', 'avoid found no route, so its straight line is not applied');

        routerService.stop();
    });

    QUnit.test('a link to a target reachable through a gap in the wall gets the avoid route', async assert => {
        const { routerService, routedEvents } = await initWalledInTarget({ withGap: true });

        assert.equal(routedEvents.length, 1);
        assert.strictEqual(routedEvents[0].origin, 'avoid', 'avoid found a route through the gap');

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

    // No public API exposes the router or tells whether it was freed: read
    // it off the provider and spy on its `delete()`, which frees it.
    function spyOnAvoidDestroy(routerService) {
        const { avoidRouter } = routerService.provider;
        const spy = { calls: 0, restore: () => { delete avoidRouter.delete; } };
        const freeRouter = avoidRouter.delete;
        avoidRouter.delete = function() {
            spy.calls++;
            return freeRouter.apply(this, arguments);
        };
        return spy;
    }

    QUnit.test('frees the avoid router', async assert => {
        const { routerService } = await initRouterWithLink({ x: 0, y: 0 }, { x: 300, y: 0 });
        const spy = spyOnAvoidDestroy(routerService);

        try {
            routerService.destroy();
        } finally {
            spy.restore();
        }

        assert.equal(spy.calls, 1, 'the router and everything added to it are freed');
    });

    QUnit.test('called from a link:routing handler during a graph change, the change still completes', async assert => {
        const { graph, routerService, source, target } = await initRouterWithLink({ x: 0, y: 0 }, { x: 300, y: 0 });

        routerService.on('link:routing', () => {
            routerService.destroy();
        });

        // The new link's fallback route fires `link:routing` before the
        // link is registered with the (by then destroyed) provider.
        const link = new joint.shapes.standard.Link({ source: { id: source.id }, target: { id: target.id }});
        graph.addCell(link);

        assert.ok(graph.getCell(link.id), 'the link was added without an error');
    });

    QUnit.test('called from a link:routed handler, frees the avoid router once the pass returns', async assert => {
        const { routerService, source } = await initRouterWithLink({ x: 0, y: 0 }, { x: 300, y: 0 });
        const spy = spyOnAvoidDestroy(routerService);

        // `link:routed` fires from the connector callback, while avoid is
        // still inside `processTransaction()`.
        let callsDuringPass;
        routerService.on('link:routed', () => {
            routerService.destroy();
            callsDuringPass = spy.calls;
        });

        try {
            source.position(0, 200);
        } finally {
            spy.restore();
        }

        assert.strictEqual(callsDuringPass, 0, 'the router is not freed under its own running transaction');
        assert.equal(spy.calls, 1, 'the router is freed once the pass has returned');
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

QUnit.module('start() during an in-flight one-shot pass', () => {
    // Regression: a queued `routeSubgraph()` pass used to run AFTER
    // `start()`'s full-graph sync and replaced the engine's content with
    // only the subgraph - leaving the live graph listener working against
    // an engine that no longer held the rest of the graph (a listener
    // referencing an element the engine does not hold aborts the WASM
    // module irrecoverably). The queued pass is now superseded: it resolves
    // as cancelled and the engine keeps holding the full graph.
    QUnit.test('a queued routeSubgraph() pass is superseded by start(), leaving the engine holding the full graph', async assert => {
        const graph = new joint.dia.Graph();
        const size = { width: 100, height: 100 };
        const a = new joint.shapes.standard.Rectangle({ position: { x: 0, y: 0 }, size });
        const b = new joint.shapes.standard.Rectangle({ position: { x: 300, y: 0 }, size });
        const linkAB = new joint.shapes.standard.Link({ source: { id: a.id }, target: { id: b.id }});
        const c = new joint.shapes.standard.Rectangle({ position: { x: 0, y: 400 }, size });
        const d = new joint.shapes.standard.Rectangle({ position: { x: 300, y: 400 }, size });
        const linkCD = new joint.shapes.standard.Link({ source: { id: c.id }, target: { id: d.id }});
        graph.resetCells([a, b, linkAB, c, d, linkCD]);

        const routerService = await joint.routers.avoid.initAvoidRouter(graph, {});

        const subgraphPass = routerService.routeSubgraph([a, b, linkAB]);
        routerService.start();
        const result = await subgraphPass;
        assert.equal(result.status, 'cancelled', 'the queued one-shot pass reports it was superseded');

        const routedLinks = [];
        routerService.on('link:routed', (l) => routedLinks.push(l));

        c.position(0, 800);

        assert.ok(routedLinks.includes(linkCD), 'a link outside the one-shot subset is still routed while started');
        assert.ok(isOrthogonalPath(linkCD), 'and its route is a real avoid route');

        routerService.destroy();
    });

    QUnit.test('start() with no pass in flight still applies routes synchronously (main thread)', async assert => {
        const graph = new joint.dia.Graph();
        const size = { width: 100, height: 100 };
        const source = new joint.shapes.standard.Rectangle({ position: { x: 0, y: 0 }, size });
        const target = new joint.shapes.standard.Rectangle({ position: { x: 300, y: 0 }, size });
        const link = new joint.shapes.standard.Link({ source: { id: source.id }, target: { id: target.id }});
        graph.resetCells([source, target, link]);

        const routerService = await joint.routers.avoid.initAvoidRouter(graph, {});

        const routedLinks = [];
        routerService.on('link:routed', (l) => routedLinks.push(l));

        routerService.start();

        assert.equal(routedLinks.length, 1, 'the initial sync ran during start(), not a microtask later');

        routerService.destroy();
    });
});

QUnit.module('idle after incremental changes (main thread)', () => {
    // `MainThreadProvider` routes synchronously, so `idle` (driven by the
    // provider's `processed`) must fire during the originating graph change,
    // not only after `start()`'s initial sync / `routeAll()`.
    QUnit.test('an element move fires idle', async assert => {
        const { routerService, source } = await initRouterWithLink({ x: 0, y: 0 }, { x: 300, y: 0 });

        let idleCount = 0;
        routerService.on('idle', () => idleCount++);

        source.position(50, 50);
        assert.equal(idleCount, 1, 'idle fired for the element move');
    });

    QUnit.test('a link removal fires idle', async assert => {
        const { routerService, link } = await initRouterWithLink({ x: 0, y: 0 }, { x: 300, y: 0 });

        let idleCount = 0;
        routerService.on('idle', () => idleCount++);

        link.remove();
        assert.equal(idleCount, 1, 'idle fired for the link removal');
    });
});

QUnit.module('experimental_isJunction', () => {

    // Three 100x100 nodes and a 10x10 junction; A and B feed the junction, the junction feeds C.
    function createJunctionGraph(junctionPosition = { x: 250, y: 195 }, junctionAttributes = {}) {
        const graph = new joint.dia.Graph();
        const size = { width: 100, height: 100 };
        const a = new joint.shapes.standard.Rectangle({ position: { x: 0, y: 0 }, size });
        const b = new joint.shapes.standard.Rectangle({ position: { x: 0, y: 300 }, size });
        const c = new joint.shapes.standard.Rectangle({ position: { x: 400, y: 150 }, size });
        const junction = new joint.shapes.standard.Circle({ position: junctionPosition, size: { width: 10, height: 10 }, ...junctionAttributes });
        const links = [
            new joint.shapes.standard.Link({ source: { id: a.id }, target: { id: junction.id }}),
            new joint.shapes.standard.Link({ source: { id: b.id }, target: { id: junction.id }}),
            new joint.shapes.standard.Link({ source: { id: junction.id }, target: { id: c.id }})
        ];
        graph.resetCells([a, b, c, junction, ...links]);
        return { graph, a, b, c, junction, links };
    }

    function junctionEndPoint(link, junction) {
        return (link.source().id === junction.id) ? link.getSourcePoint() : link.getTargetPoint();
    }

    QUnit.test('routes links to a junction element', async assert => {
        // A fixed junction keeps its position, so the links end at its center.
        const { graph, junction, links } = createJunctionGraph(undefined, { junctionFixed: true });
        const routerService = await joint.routers.avoid.initAvoidRouter(graph, {
            experimental_isJunction: ({ element }) => element === junction
        });
        const routed = [];
        routerService.on('link:routed', (link, options) => routed.push({ link, ...options }));
        routerService.start();

        links.forEach((link, index) => {
            const result = routed.find((r) => r.link === link);
            assert.equal(result && result.origin, 'avoid', `link ${index} routed by avoid`);
            assert.ok(isOrthogonalPath(link), `link ${index} is orthogonal`);
            const endPoint = junctionEndPoint(link, junction);
            assert.ok(endPoint.distance(junction.getBBox().center()) <= 1, `link ${index} ends at the junction center (${endPoint})`);
        });

        routerService.destroy();
    });

    QUnit.test('routes a port to a junction just outside the element', async assert => {
        // The junction is closer to the port than the shape buffer distance.
        const graph = new joint.dia.Graph();
        const a = new joint.shapes.standard.Rectangle({
            position: { x: 0, y: 0 },
            size: { width: 100, height: 100 },
            ports: { groups: { bottom: { position: 'bottom' }}, items: [{ id: 'out', group: 'bottom' }] }
        });
        const c = new joint.shapes.standard.Rectangle({ position: { x: 400, y: 300 }, size: { width: 100, height: 100 }});
        const junction = new joint.shapes.standard.Circle({ position: { x: 45, y: 115 }, size: { width: 10, height: 10 }, junctionFixed: true });
        const link = new joint.shapes.standard.Link({ source: { id: a.id, port: 'out' }, target: { id: junction.id }});
        graph.resetCells([a, c, junction, link, new joint.shapes.standard.Link({ source: { id: junction.id }, target: { id: c.id }})]);
        const routerService = await joint.routers.avoid.initAvoidRouter(graph, {
            shapeBufferDistance: 20,
            experimental_isJunction: ({ element }) => element === junction
        });
        const routed = [];
        routerService.on('link:routed', (routedLink, options) => routed.push({ link: routedLink, ...options }));
        routerService.start();

        const result = routed.find((r) => r.link === link);
        assert.equal(result && result.origin, 'avoid', 'routed by avoid, not the fallback');
        assert.ok(isOrthogonalPath(link), 'the link is orthogonal');

        routerService.destroy();
    });

    QUnit.test('moves the junction before its links are routed', async assert => {
        const { graph, junction, links } = createJunctionGraph({ x: 600, y: 600 });
        const routerService = await joint.routers.avoid.initAvoidRouter(graph, {
            experimental_isJunction: ({ element }) => element === junction
        });
        // What each link looks like when it is reported as routed.
        const orthogonalWhenRouted = new Map();
        routerService.on('link:routed', (link) => orthogonalWhenRouted.set(link, isOrthogonalPath(link)));
        routerService.start();

        assert.notOk(junction.getBBox().center().equals({ x: 605, y: 605 }), 'the junction moved');
        links.forEach((link, index) => {
            assert.ok(orthogonalWhenRouted.get(link), `link ${index} is orthogonal when routed`);
        });

        routerService.destroy();
    });

    QUnit.test('moves a free junction to the recommended position', async assert => {
        const { graph, junction, links } = createJunctionGraph({ x: 600, y: 600 });
        const routerService = await joint.routers.avoid.initAvoidRouter(graph, {
            experimental_isJunction: ({ element }) => element === junction
        });
        const routedCount = new Map();
        routerService.on('link:routed', (link) => routedCount.set(link, (routedCount.get(link) || 0) + 1));
        routerService.start();

        const center = junction.getBBox().center();
        assert.notOk(center.equals({ x: 605, y: 605 }), `the junction moved (${center})`);
        links.forEach((link, index) => {
            assert.ok(junctionEndPoint(link, junction).distance(center) <= 1, `link ${index} ends at the junction center`);
            assert.ok(isOrthogonalPath(link), `link ${index} is orthogonal`);
            assert.ok(routedCount.get(link) <= 2, `link ${index} routed at most twice (${routedCount.get(link)})`);
        });

        routerService.destroy();
    });

    QUnit.test('the routes avoid computes end at the final junction position', async assert => {
        const { graph, b, junction, links } = createJunctionGraph({ x: 600, y: 600 });
        const routerService = await joint.routers.avoid.initAvoidRouter(graph, {
            experimental_isJunction: ({ element }) => element === junction
        });
        // The last route avoid reported for each link, as computed (not as applied).
        const lastRoutes = {};
        routerService.provider.on('connector:changed', (linkId, points) => { lastRoutes[linkId] = points; });
        routerService.start();
        b.position(0, 600);

        const center = junction.getBBox().center();
        links.forEach((link, index) => {
            const route = lastRoutes[link.id];
            const end = (link.source().id === junction.id) ? route[0] : route[route.length - 1];
            assert.ok(end.distance(center) <= 1, `link ${index} route ends at the junction (${end} vs ${center})`);
        });

        routerService.destroy();
    });

    QUnit.test('keeps a fixed junction in place', async assert => {
        const { graph, junction } = createJunctionGraph({ x: 600, y: 600 }, { junctionFixed: true });
        const routerService = await joint.routers.avoid.initAvoidRouter(graph, {
            experimental_isJunction: ({ element }) => element === junction
        });
        routerService.start();

        assert.deepEqual(junction.get('position'), { x: 600, y: 600 }, 'the junction did not move');

        routerService.destroy();
    });

    QUnit.test('unfixing a junction moves it to the recommended position', async assert => {
        const { graph, junction } = createJunctionGraph({ x: 600, y: 600 }, { junctionFixed: true });
        const routerService = await joint.routers.avoid.initAvoidRouter(graph, {
            experimental_isJunction: ({ element }) => element === junction
        });
        routerService.start();

        junction.set('junctionFixed', false);

        assert.notDeepEqual(junction.get('position'), { x: 600, y: 600 }, 'the junction moved');

        routerService.destroy();
    });

    QUnit.test('removing a junction element falls back without errors', async assert => {
        const { graph, junction, links } = createJunctionGraph();
        const routerService = await joint.routers.avoid.initAvoidRouter(graph, {
            experimental_isJunction: ({ element }) => element === junction
        });
        routerService.start();
        assert.ok(routerService.provider.junctionRefs[junction.id], 'the element is an avoid junction');

        junction.remove({ disconnectLinks: true });

        links.forEach((link, index) => {
            assert.ok(graph.getCell(link.id), `link ${index} still in the graph`);
        });
        assert.notOk(routerService.provider.hasShape(junction.id), 'junction removed from avoid');
        assert.notOk(routerService.provider.junctionRefs[junction.id], 'junction ref deleted');

        routerService.destroy();
    });

    QUnit.test('routes a link between two junctions', async assert => {
        const graph = new joint.dia.Graph();
        const size = { width: 100, height: 100 };
        const a = new joint.shapes.standard.Rectangle({ position: { x: 0, y: 0 }, size });
        const b = new joint.shapes.standard.Rectangle({ position: { x: 600, y: 0 }, size });
        const j1 = new joint.shapes.standard.Circle({ position: { x: 200, y: 45 }, size: { width: 10, height: 10 }});
        const j2 = new joint.shapes.standard.Circle({ position: { x: 400, y: 45 }, size: { width: 10, height: 10 }});
        const between = new joint.shapes.standard.Link({ source: { id: j1.id }, target: { id: j2.id }});
        graph.resetCells([a, b, j1, j2,
            new joint.shapes.standard.Link({ source: { id: a.id }, target: { id: j1.id }}),
            between,
            new joint.shapes.standard.Link({ source: { id: j2.id }, target: { id: b.id }})
        ]);
        const routerService = await joint.routers.avoid.initAvoidRouter(graph, {
            experimental_isJunction: ({ element }) => element === j1 || element === j2
        });
        const routed = [];
        routerService.on('link:routed', (link, options) => routed.push({ link, ...options }));
        routerService.start();

        const result = routed.find((r) => r.link === between);
        assert.equal(result && result.origin, 'avoid', 'the junction-to-junction link is routed by avoid');
        assert.ok(routerService.provider.junctionRefs[j1.id] && routerService.provider.junctionRefs[j2.id], 'both elements are avoid junctions');
        assert.ok(between.getSourcePoint().distance(j1.getBBox().center()) <= 1, 'starts at the first junction');
        assert.ok(between.getTargetPoint().distance(j2.getBBox().center()) <= 1, 'ends at the second junction');

        routerService.destroy();
    });
});

QUnit.module('experimental_checkpointsAttribute', () => {

    async function initCheckpointsRouter(checkpoints) {
        const graph = new joint.dia.Graph();
        const size = { width: 100, height: 100 };
        const a = new joint.shapes.standard.Rectangle({ position: { x: 0, y: 0 }, size });
        const b = new joint.shapes.standard.Rectangle({ position: { x: 400, y: 0 }, size });
        const link = new joint.shapes.standard.Link({ source: { id: a.id }, target: { id: b.id }, checkpoints });
        graph.resetCells([a, b, link]);
        const routerService = await joint.routers.avoid.initAvoidRouter(graph, {
            experimental_checkpointsAttribute: 'checkpoints'
        });
        routerService.start();
        return { graph, routerService, a, b, link };
    }

    function routeDistanceTo(link, point) {
        const polyline = new joint.g.Polyline([link.getSourcePoint(), ...link.vertices(), link.getTargetPoint()]);
        return polyline.closestPoint(point).distance(point);
    }

    QUnit.test('the route passes through the checkpoints', async assert => {
        const { routerService, link } = await initCheckpointsRouter([{ x: 250, y: 300 }]);

        assert.ok(routeDistanceTo(link, { x: 250, y: 300 }) < 1, 'the route passes through the checkpoint');
        assert.ok(isOrthogonalPath(link), 'the route is orthogonal');
        assert.deepEqual(link.get('checkpoints'), [{ x: 250, y: 300 }], 'the checkpoints are left unchanged');

        routerService.destroy();
    });

    QUnit.test('changing the checkpoints reroutes', async assert => {
        const { routerService, link } = await initCheckpointsRouter([{ x: 250, y: 300 }]);
        const events = [];
        routerService.on('link:routing', () => events.push('routing'));
        routerService.on('link:routed', () => events.push('routed'));

        link.set('checkpoints', [{ x: 250, y: -200 }]);

        assert.deepEqual(events, ['routing', 'routed'], 'the link is rerouted');
        assert.ok(routeDistanceTo(link, { x: 250, y: -200 }) < 1, 'the route passes through the new checkpoint');

        routerService.destroy();
    });

    QUnit.test('clearing the checkpoints reroutes without them', async assert => {
        const { routerService, link } = await initCheckpointsRouter([{ x: 250, y: 300 }]);

        link.set('checkpoints', []);

        assert.ok(link.vertices().every((vertex) => vertex.y < 150), 'the route no longer goes below the elements');

        routerService.destroy();
    });

    QUnit.test('a checkpoint inside an element is skipped', async assert => {
        const { routerService, link } = await initCheckpointsRouter([{ x: 450, y: 50 }]);

        assert.ok(isOrthogonalPath(link), 'the route is orthogonal');

        routerService.destroy();
    });
});

QUnit.module('experimental options: final review fixes', () => {

    QUnit.test('a checkpoint inside another element does not route the link through it', async assert => {
        const graph = new joint.dia.Graph();
        const size = { width: 100, height: 100 };
        const a = new joint.shapes.standard.Rectangle({ position: { x: 0, y: 0 }, size });
        const b = new joint.shapes.standard.Rectangle({ position: { x: 600, y: 0 }, size });
        const obstacle = new joint.shapes.standard.Rectangle({ position: { x: 250, y: 250 }, size });
        const link = new joint.shapes.standard.Link({ source: { id: a.id }, target: { id: b.id }, checkpoints: [{ x: 300, y: 300 }] });
        graph.resetCells([a, b, obstacle, link]);
        const routerService = await joint.routers.avoid.initAvoidRouter(graph, { experimental_checkpointsAttribute: 'checkpoints' });
        routerService.start();

        const points = [link.getSourcePoint(), ...link.vertices(), link.getTargetPoint()];
        const bbox = obstacle.getBBox();
        const crosses = points.slice(1).some((point, i) => new joint.g.Line(points[i], point).intersect(bbox));
        assert.notOk(crosses, `the route does not cross the obstacle (${points.map(String).join(' ')})`);

        routerService.destroy();
    });

    QUnit.test('a listener changing the graph while routes are announced does not leave stale routes', async assert => {
        const graph = new joint.dia.Graph();
        const size = { width: 100, height: 100 };
        const a = new joint.shapes.standard.Rectangle({ position: { x: 0, y: 0 }, size });
        const b = new joint.shapes.standard.Rectangle({ position: { x: 300, y: 0 }, size });
        const c = new joint.shapes.standard.Rectangle({ position: { x: 0, y: 300 }, size });
        const ab = new joint.shapes.standard.Link({ source: { id: a.id }, target: { id: b.id }});
        const ac = new joint.shapes.standard.Link({ source: { id: a.id }, target: { id: c.id }});
        graph.resetCells([a, b, c, ab, ac]);
        const routerService = await joint.routers.avoid.initAvoidRouter(graph, {});
        let moved = false;
        routerService.on('link:routed', () => {
            if (moved) return;
            moved = true;
            c.position(300, 300);
        });
        routerService.start();

        const end = ac.getTargetPoint();
        assert.ok(c.getBBox().containsPoint(end), `the link ends at the moved element (${end})`);
        assert.ok(isOrthogonalPath(ac), 'the route is orthogonal');

        routerService.destroy();
    });

    QUnit.test('destroy() from a listener after a nested pass frees the router once', async assert => {
        const graph = new joint.dia.Graph();
        const size = { width: 100, height: 100 };
        const a = new joint.shapes.standard.Rectangle({ position: { x: 0, y: 0 }, size });
        const b = new joint.shapes.standard.Rectangle({ position: { x: 300, y: 0 }, size });
        const c = new joint.shapes.standard.Rectangle({ position: { x: 0, y: 300 }, size });
        graph.resetCells([a, b, c,
            new joint.shapes.standard.Link({ source: { id: a.id }, target: { id: b.id }}),
            new joint.shapes.standard.Link({ source: { id: a.id }, target: { id: c.id }})
        ]);
        const routerService = await joint.routers.avoid.initAvoidRouter(graph, {});
        let count = 0;
        routerService.on('link:routed', () => {
            count++;
            if (count === 1) c.position(300, 300);
            if (count === 2) routerService.destroy();
        });

        routerService.start();
        assert.ok(true, 'no error');
    });

    QUnit.test('switching an element between junction and shape replaces its avoid object', async assert => {
        const graph = new joint.dia.Graph();
        const size = { width: 100, height: 100 };
        const a = new joint.shapes.standard.Rectangle({ position: { x: 0, y: 0 }, size });
        const b = new joint.shapes.standard.Rectangle({ position: { x: 400, y: 0 }, size });
        const j = new joint.shapes.standard.Circle({ position: { x: 200, y: 45 }, size: { width: 10, height: 10 }, isJunction: true, junctionFixed: true });
        graph.resetCells([a, b, j,
            new joint.shapes.standard.Link({ source: { id: a.id }, target: { id: j.id }}),
            new joint.shapes.standard.Link({ source: { id: j.id }, target: { id: b.id }})
        ]);
        const routerService = await joint.routers.avoid.initAvoidRouter(graph, {
            experimental_isJunction: ({ element }) => !!element.get('isJunction')
        });
        routerService.start();
        const { provider } = routerService;

        j.set('isJunction', false);
        j.translate(0, 10);
        assert.notOk(provider.junctionRefs[j.id], 'junction to shape: no junction left');
        assert.ok(provider.shapeRefs[j.id], 'junction to shape: a shape');

        j.set('isJunction', true);
        j.translate(0, 10);
        assert.ok(provider.junctionRefs[j.id], 'shape to junction: a junction');
        assert.notOk(provider.shapeRefs[j.id], 'shape to junction: no shape left');

        routerService.destroy();
    });

    QUnit.test('a listener snapping a moved junction does not loop', async assert => {
        const graph = new joint.dia.Graph();
        const size = { width: 100, height: 100 };
        const a = new joint.shapes.standard.Rectangle({ position: { x: 0, y: 0 }, size });
        const b = new joint.shapes.standard.Rectangle({ position: { x: 0, y: 300 }, size });
        const c = new joint.shapes.standard.Rectangle({ position: { x: 400, y: 150 }, size });
        const j = new joint.shapes.standard.Circle({ position: { x: 603, y: 603 }, size: { width: 10, height: 10 }});
        graph.resetCells([a, b, c, j,
            new joint.shapes.standard.Link({ source: { id: a.id }, target: { id: j.id }}),
            new joint.shapes.standard.Link({ source: { id: b.id }, target: { id: j.id }}),
            new joint.shapes.standard.Link({ source: { id: j.id }, target: { id: c.id }})
        ]);
        // Snap the junction to a 7px grid, without the router's change flag.
        j.on('change:position', (element, position, opt) => {
            if (opt.snapped) return;
            element.position(Math.round(position.x / 7) * 7 + 3, Math.round(position.y / 7) * 7 + 3, { snapped: true });
        });
        const routerService = await joint.routers.avoid.initAvoidRouter(graph, {
            experimental_isJunction: ({ element }) => element === j
        });

        routerService.start();
        assert.ok(true, 'no infinite loop');

        routerService.destroy();
    });
});

QUnit.module('experimental_checkpointsAttribute: fallback route', () => {

    QUnit.test('the fallback route passes through the checkpoints', async assert => {
        const graph = new joint.dia.Graph();
        const a = new joint.shapes.standard.Rectangle({ position: { x: 0, y: 0 }, size: { width: 50, height: 50 }});
        const b = new joint.shapes.standard.Rectangle({ position: { x: 300, y: 0 }, size: { width: 50, height: 50 }});
        // A closed ring of obstacles around `b`.
        const wall = (x, y, width, height) => new joint.shapes.standard.Rectangle({ position: { x, y }, size: { width, height }});
        const ring = [wall(240, -60, 170, 20), wall(240, 90, 170, 20), wall(240, -60, 20, 170), wall(390, -60, 20, 170)];
        // Off the route the fallback takes without checkpoints.
        const checkpoints = [{ x: 100, y: 200 }, { x: 200, y: 250 }];
        const link = new joint.shapes.standard.Link({ source: { id: a.id }, target: { id: b.id }, checkpoints });
        graph.resetCells([a, b, ...ring, link]);
        const routerService = await joint.routers.avoid.initAvoidRouter(graph, { shapeBufferDistance: 5, experimental_checkpointsAttribute: 'checkpoints' });
        const routed = [];
        routerService.on('link:routed', (routedLink, options) => {
            if (routedLink === link) routed.push(options.origin);
        });
        routerService.start();

        assert.deepEqual(routed, ['fallback'], 'avoid found no route, so the fallback route is applied');
        const route = new joint.g.Polyline([link.getSourcePoint(), ...link.vertices(), link.getTargetPoint()]);
        checkpoints.forEach((checkpoint) => {
            assert.ok(route.closestPoint(checkpoint).distance(checkpoint) < 0.5, `the route passes through ${checkpoint.x},${checkpoint.y}`);
        });

        routerService.destroy();
    });

    QUnit.test('a route that skips a checkpoint gets the fallback route', async assert => {
        const graph = new joint.dia.Graph();
        const a = new joint.shapes.standard.Rectangle({ position: { x: 0, y: 0 }, size: { width: 50, height: 50 }});
        const b = new joint.shapes.standard.Rectangle({ position: { x: 400, y: 0 }, size: { width: 50, height: 50 }});
        // Reaching the checkpoint from below needs a detour avoid does not
        // find: it drops the checkpoint and still reports a valid route.
        const checkpoints = [{ x: 225, y: 200, arrival: 'bottom' }];
        const link = new joint.shapes.standard.Link({ source: { id: a.id }, target: { id: b.id }, checkpoints });
        graph.resetCells([a, b, link]);
        const routerService = await joint.routers.avoid.initAvoidRouter(graph, { experimental_checkpointsAttribute: 'checkpoints' });
        const routed = [];
        routerService.on('link:routed', (routedLink, options) => {
            if (routedLink === link) routed.push(options.origin);
        });
        routerService.start();

        assert.deepEqual(routed, ['fallback'], 'the fallback route is applied');
        const route = new joint.g.Polyline([link.getSourcePoint(), ...link.vertices(), link.getTargetPoint()]);
        checkpoints.forEach((checkpoint) => {
            assert.ok(route.closestPoint(checkpoint).distance(checkpoint) < 0.5, `the route passes through ${checkpoint.x},${checkpoint.y}`);
        });

        routerService.destroy();
    });
});

QUnit.module('experimental_checkpointsAttribute: directions', () => {

    const checkpoint = { x: 250, y: 250 };

    // The sides of the checkpoint the route comes from and leaves toward.
    function getCheckpointSides(link) {
        const view = link.findView(paper);
        const points = [view.sourcePoint, ...link.vertices(), view.targetPoint].map((p) => new joint.g.Point(p));
        const sideOf = (point) => {
            if (point.x === checkpoint.x) return (point.y < checkpoint.y) ? 'top' : 'bottom';
            return (point.x < checkpoint.x) ? 'left' : 'right';
        };
        for (let i = 1; i < points.length; i++) {
            const segment = new joint.g.Line(points[i - 1], points[i]);
            if (segment.pointOffset(checkpoint) !== 0 || segment.closestPoint(checkpoint).distance(checkpoint) > 0.5) continue;
            const before = points[i - 1].equals(checkpoint) ? points[i - 2] : points[i - 1];
            const after = points[i].equals(checkpoint) ? points[i + 1] : points[i];
            return { arrival: sideOf(before), departure: sideOf(after) };
        }
        return null;
    }

    let paper;

    async function route(checkpointAttributes) {
        const graph = new joint.dia.Graph();
        paper = new joint.dia.Paper({ model: graph, async: false });
        const size = { width: 50, height: 50 };
        const a = new joint.shapes.standard.Rectangle({ position: { x: 0, y: 0 }, size });
        const b = new joint.shapes.standard.Rectangle({ position: { x: 450, y: 450 }, size });
        const link = new joint.shapes.standard.Link({
            source: { id: a.id },
            target: { id: b.id },
            checkpoints: [{ ...checkpoint, ...checkpointAttributes }]
        });
        graph.resetCells([a, b, link]);
        const routerService = await joint.routers.avoid.initAvoidRouter(graph, { experimental_checkpointsAttribute: 'checkpoints' });
        routerService.start();
        return { routerService, link };
    }

    [
        [{ arrival: 'left' }, 'arrival', 'left'],
        [{ arrival: 'top' }, 'arrival', 'top'],
        [{ arrival: 'bottom' }, 'arrival', 'bottom'],
        [{ departure: 'right' }, 'departure', 'right'],
        [{ departure: 'bottom' }, 'departure', 'bottom'],
        [{ departure: 'top' }, 'departure', 'top'],
    ].forEach(([attributes, kind, side]) => {
        QUnit.test(`${kind}: '${side}'`, async assert => {
            const { routerService, link } = await route(attributes);
            const sides = getCheckpointSides(link);
            assert.ok(sides, 'the route passes through the checkpoint');
            assert.equal(sides && sides[kind], side, `the route ${kind === 'arrival' ? 'comes from' : 'leaves toward'} the ${side}`);
            paper.remove();
            routerService.destroy();
        });
    });
});
