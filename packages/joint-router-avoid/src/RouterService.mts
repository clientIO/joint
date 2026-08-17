import { g, mvc, alg } from '@joint/core';

import type { dia, anchors } from '@joint/core';
import type { ConnDirFlags } from 'libavoid-js';
import type { Connector, Provider, ProviderEventMap, Shape } from './providers/Provider.mjs';

const DEFAULT_PIN_CLASS_ID = 1;

/** The fallback route applied directly to a link, bypassing avoid. */
export interface FallbackRouteAttributes {
    /** The route's vertices, computed by the built-in `rightAngle` path algorithm. */
    vertices: dia.Point[];
}

/** The route computed by avoid, to be applied to a link. */
export interface RouteAttributes {
    /** The link's new source end, including the anchor recomputed for the new route. */
    source: dia.Link.EndJSON;
    /** The link's new target end, including the anchor recomputed for the new route. */
    target: dia.Link.EndJSON;
    /** The route's vertices, excluding the source and target points. */
    vertices: dia.Point[];
}

/** Parameters passed to a {@link TrackLinkCallback}. */
export type TrackLinkCallbackParameters = {
    /** The link being considered. */
    link: dia.Link;
}
/**
 * Determines whether a link should be excluded from routing by this
 * {@link RouterService} instance.
 *
 * @param params - The link being considered.
 * @returns `true` to exclude the link from routing.
 */
export type TrackLinkCallback = (params: TrackLinkCallbackParameters) => boolean;

/** Parameters passed to a {@link TrackElementCallback}. */
export type TrackElementCallbackParameters = {
    /** The element being considered. */
    element: dia.Element;
}
/**
 * Determines whether an element should be excluded from routing by this
 * {@link RouterService} instance, i.e. not tracked as an avoid obstacle.
 *
 * @param params - The element being considered.
 * @returns `true` to exclude the element from routing.
 */
export type TrackElementCallback = (params: TrackElementCallbackParameters) => boolean;

export type RouteOrigin = 'avoid' | 'fallback';

/** Parameters passed to a {@link SetRouteAttributesCallback}. */
export type SetRouteAttributesCallbackParameters = {
/** The link the route applies to. */
    link: dia.Link;
    /** The computed route attributes to apply to the link. */
    attributes: RouteAttributes;
    /** Where the route came from: computed by avoid, or the built-in `rightAngle` fallback. */
    origin: RouteOrigin;
    /**
     * `true` when this route is provisional - avoid is still computing and
     * another call for the same link follows (matches the `link:routing`
     * event cycle). `false` when this is the link's final route for the
     * current change.
     */
    routing?: boolean;
    /**
     * Why avoid could not route the link. Only set when the fallback route
     * is applied because the link is unroutable (and the consumer did not
     * claim it via `interceptUnroutableLink`).
     */
    unroutableReason?: UnroutableReason;
}
/**
 * Applies computed route attributes to a link, overriding the default
 * behavior of calling `link.set()` directly. Useful for routing the update
 * through a command manager or other change-tracking layer.
 *
 * @param params - The link, its computed route attributes, and whether they came from the fallback route.
 */
export type SetRouteAttributesCallback = (params: SetRouteAttributesCallbackParameters) => void;

/**
 * Why a link could not be routed by avoid:
 * - `'unconnected'` - one or both ends aren't connected to an element at all.
 * - `'untracked-element'` - both ends are connected, but at least one connected
 *   element is excluded from the router via `skipElement`.
 */
export type UnroutableReason = 'unconnected' | 'untracked-element' | 'unsupported';

/** Parameters passed to an {@link UnroutableLinkCallback}. */
export type UnroutableLinkCallbackParameters = {
    /** The link that could not be routed by avoid. */
    link: dia.Link;
    /** Why the link could not be routed. */
    reason: UnroutableReason;
}
/**
 * Gives the consumer first refusal on a link that avoid cannot route.
 *
 * @param params - The unroutable link and the reason it could not be routed.
 * @returns `true` to claim the link, skipping the built-in `rightAngle` fallback route entirely.
 */
export type UnroutableLinkCallback = (params: UnroutableLinkCallbackParameters) => boolean;

/** Options used to configure a {@link RouterService} instance. */
export interface RouterServiceOptions {
    /** Determines which links to track for routing. Defaults to tracking every link. */
    trackLink?: TrackLinkCallback;
    /** Determines which elements to track for routing. Defaults to tracking every element as obstacle. */
    trackElement?: TrackElementCallback;
    /** Overrides how computed route attributes are applied to a link. Defaults to calling `link.set()` directly. */
    setRouteAttributes?: SetRouteAttributesCallback;
    /** Gives the consumer first refusal on links avoid cannot route. Defaults to always falling back to the built-in `rightAngle` route. */
    interceptUnroutableLink?: UnroutableLinkCallback;
    /** The margin to apply around elements when computing fallback route. */
    shapeBufferDistance?: number;
    /** Name of the `opt` flag set on `link.set()` calls made by this instance, so its own changes can be told apart from the consumer's. Defaults to `'avoidRouter'`. */
    changeFlag?: string;
}

/** Events emitted by a {@link RouterService}. */
export interface RouterServiceEventMap {
    /**
     * Emitted when a link's route is (re-)computing.
     *
     * @param link - The link entering a routing cycle.
     */
    'link:routing': (link: dia.Link) => void;
    /**
     * Emitted once a link's route has been applied.
     *
     * @param link - The link whose route was just applied.
     * @param opt - Options describing the routing outcome.
     */
    'link:routed': (link: dia.Link, opt: { origin: RouteOrigin, reason?: UnroutableReason }) => void;
    /**
     * Emitted when a link with an open `link:routing` cycle becomes
     * unroutable (e.g. disconnected) before avoid produced a route for it.
     *
     * @param link - The link whose pending routing cycle was abandoned.
     */
    'link:routing:cancelled': (link: dia.Link) => void;
    /**
     * Emitted when there are no more pending routing cycles for any links in the graph.
     */
    'idle': () => void;
}

/** Typed `on()` for a {@link RouterService}, keyed to its {@link RouterServiceEventMap}. */
export interface RouterServiceEvents_On<BaseT> {
    <T extends BaseT, K extends keyof RouterServiceEventMap>(this: T, eventName: K, callback: RouterServiceEventMap[K], context?: unknown): T;
    <T extends BaseT>(this: T, eventMap: Partial<RouterServiceEventMap>, context?: unknown): T;
}

/** Typed `trigger()` for a {@link RouterService}, keyed to its {@link RouterServiceEventMap}. */
export interface RouterServiceEvents_Trigger<BaseT> {
    <T extends BaseT, K extends keyof RouterServiceEventMap>(this: T, eventName: K, ...args: Parameters<RouterServiceEventMap[K]>): T;
}

/**
 * Keeps a JointJS graph's links routed via the
 * [libavoid](https://www.adaptagrams.org/documentation/annotated.html)
 * orthogonal routing library, delegating the actual route computation to a
 * {@link Provider} (either on the main thread or inside a Worker).
 *
 * Instances are normally created via `initAvoidRouter()` rather than
 * directly. A `RouterService` listens to its graph for as long as it is
 * not {@link destroy}ed, and emits the events in {@link RouterServiceEventMap}
 * as links are (re-)routed.
 */
export class RouterService {

    // Provided by the `mvc.Events` mixin applied below the class body.
    // Allows `RouterService` instances to emit `pending`/`routed` events for
    // their links. See `Keyboard` in `@joint/keyboard` for the same pattern.
    declare on: RouterServiceEvents_On<RouterService>;
    declare off: mvc.Events_Off<RouterService>;
    declare trigger: RouterServiceEvents_Trigger<RouterService>;

    private readonly defaultTrackLink: TrackLinkCallback = () => true;
    private readonly defaultTrackElement: TrackElementCallback = () => true;

    /** Maps `${elementId}:${portId}` to the avoid pin id allocated for that port. */
    private readonly pinIds: Record<string, number> = {};
    private readonly trackLink: TrackLinkCallback;
    private readonly trackElement: TrackElementCallback;

    // Links with an open `pending` cycle, i.e. `link:pending` was emitted for
    // them and `link:routed` hasn't closed it out yet. Checked wherever avoid is
    // definitively given up on for a change (rather than merely retried),
    // so a link detached mid-flight - while avoid was still computing its
    // route - gets its stranded cycle closed instead of staying stuck.
    private readonly pendingLinks: WeakSet<dia.Link> = new WeakSet();

    // Whether a route is currently being applied to a link.
    // This is used to avoid re-entrant calls to `link.set()` when the router
    // applies a new route to a link, which can trigger `change` events that would
    // otherwise cause the router to try to apply a new route while it's still applying the previous one.
    private applyingRoute = false;

    private nextPinId = 100000;
    private graphListener?: mvc.Listener<[]>;
    private destroyed = false;

    /** Bitmask flags, per side, of the directions from which a connector may approach a pin. */
    private connectionDirections: {
        top: ConnDirFlags;
        right: ConnDirFlags;
        bottom: ConnDirFlags;
        left: ConnDirFlags;
        all: ConnDirFlags;
    };

    /**
     * @param graph - The graph to route.
     * @param provider - Drives the underlying avoid router, either on the main thread or inside a Worker.
     * @param options - Configuration for this instance.
     */
    constructor(
        private readonly graph: dia.Graph,
        private readonly provider: Provider,
        private readonly options: RouterServiceOptions = {}
    ) {
        if (this.options.shapeBufferDistance == null) {
            this.options.shapeBufferDistance = 0;
        }
        if (this.options.changeFlag == null) {
            this.options.changeFlag = 'avoidRouter';
        }

        this.trackLink = options.trackLink ?? this.defaultTrackLink;
        this.trackElement = options.trackElement ?? this.defaultTrackElement;

        // connection directions flags for avoid shapes' pins.
        // The flags are used to indicate which directions a pin can connect to.
        // The values are defined in the `ConnDirFlags` enum in `libavoid-js`.
        this.connectionDirections = {
            top: 1,
            right: 8,
            bottom: 2,
            left: 4,
            all: 15,
        };

        this.provider.on('connector:changed', (linkId, points) => this.routeLink(linkId, points));
        this.provider.on('processed', () => this.trigger('idle'));
    }

    /**
     * Returns change flag which prevents
     * `onCellChanged` from being processed
    */
    get changeFlag() {
        return this.options.changeFlag!;
    }

    /**
     * Starts listening to graph changes and automatically updates the
     * router. Also (re-)syncs any cells the graph already holds - e.g.
     * cells added before `init()` was called, or while listeners were
     * detached - since referencing an element that was never registered
     * as an avoid shape aborts the underlying WASM module irrecoverably.
     */
    start(): void {
        this.stop();

        const listener = new mvc.Listener<[]>();
        listener.listenTo(this.graph, {
            remove: (cell: dia.Cell) => this.onCellRemoved(cell),
            add: (cell: dia.Cell) => this.onCellAdded(cell),
            change: (cell: dia.Cell, opt: dia.Cell.Options) => this.onCellChanged(cell, opt),
            reset: (_collection: unknown) => this.sync(this.graph.getCells()),
        });

        this.graphListener = listener;

        this.sync(this.graph.getCells());
    }

    /** Stops listening to graph changes. */
    stop(): void {
        this.graphListener?.stopListening();
        this.graphListener = undefined;
    }

    /**
     * Stops routing this graph and releases the resources held by this
     * instance and its provider (e.g. terminates a Worker thread). The
     * instance must not be used after calling this.
     */
    destroy(): void {
        if (this.destroyed) return;
        this.destroyed = true;

        this.stop();
        this.provider.destroy();
    }

    async routeAll(): Promise<void> {
        await this.sync(this.graph.getCells());
    }

    /**
     * Handles a cell being removed from the graph: untracks the avoid
     * shape/connector it owned, if any.
     *
     * @param cell - The cell that was removed.
     */
    private onCellRemoved(cell: dia.Cell): void {
        if (cell.isElement()) {
            this.deletePinIds(cell.id);
            if (this.trackElement({ element: cell })) {
                this.provider.deleteShape(cell.id);
            }
        } else if (cell.isLink() && this.trackLink({ link: cell })) {
            if (this.pendingLinks.has(cell)) {
                this.setRoutingCanceled(cell);
            }
            this.provider.deleteConnector(cell.id);
        }
    }

    /**
     * Removes the pin ids allocated for the element's ports so `pinIds`
     * does not grow unboundedly as elements are added and removed over
     * the lifetime of the router.
     *
     * @param elementId - Id of the element whose pin ids should be forgotten.
     */
    private deletePinIds(elementId: dia.Cell.ID): void {
        const prefix = `${elementId}:`;
        Object.keys(this.pinIds).forEach((pinKey) => {
            if (pinKey.startsWith(prefix)) {
                delete this.pinIds[pinKey];
            }
        });
    }

    /**
     * Handles a cell being added to the graph: registers its avoid
     * shape/connector, unless it (or, for a link, one of its ends) is
     * excluded from routing.
     *
     * @param cell - The cell that was added.
     */
    private onCellAdded(cell: dia.Cell): void {
        if (cell.isElement() && this.trackElement({ element: cell })) {
            this.provider.setShape(this.getAvoidShape(cell));
            return;
        }

        if (!cell.isLink() || !this.trackLink({ link: cell })) return;

        if (!this.validateEnds(cell)) {
            // In scope for the router, but avoid can't route a link that
            // isn't connected to an element on both ends.
            this.resolveUnroutableLink(cell);
            return;
        }

        this.provider.setConnector(this.getAvoidConnector(cell));
    }

    /**
     * Handles a cell's attributes changing: re-registers its avoid
     * shape/connector, and re-routes any links affected by the change.
     *
     * @param cell - The cell that changed.
     * @param opt - The options the change was made with; changes flagged with `options.eventFlagName` (this instance's own writes) are ignored.
     */
    private onCellChanged(cell: dia.Cell, opt: dia.Cell.Options = {}): void {
        if (opt[this.changeFlag] || this.applyingRoute) return;

        if ('source' in cell.changed || 'target' in cell.changed) {
            if (!cell.isLink() || !this.trackLink({ link: cell })) return;

            if (!this.validateEnds(cell)) {
                // Giving up on avoid for this change - hand off to the
                // consumer via `interceptUnroutableLink`, or fall back to the
                // built-in rightAngle route.
                this.resolveUnroutableLink(cell);
                this.provider.deleteConnector(cell.id);
                return;
            }

            this.applyFallbackRoute(cell, { routing: true });
            this.provider.setConnector(this.getAvoidConnector(cell));
        }

        if ('position' in cell.changed || 'size' in cell.changed) {
            if (!cell.isElement()) return;

            this.graph.getConnectedLinks(cell).filter((link) => this.trackLink({ link })).forEach((link) => {
                if (!this.validateEnds(link)) {
                    this.resolveUnroutableLink(link);
                    return;
                }

                this.applyFallbackRoute(link, { routing: true });
            });

            if (!this.trackElement({ element: cell })) return;

            this.provider.setShape(this.getAvoidShape(cell));
        }
    }

    /**
     * Handles the graph being reset: re-registers every element and
     * routable link with the provider in a single transaction.
     */
    private async sync(cells: dia.Cell[]): Promise<void> {
        const routableLinks: dia.Link[] = [];
        cells.filter((cell) => cell.isLink()).filter((link) => this.trackLink({ link })).forEach((link) => {
            if (!this.validateEnds(link)) {
                this.resolveUnroutableLink(link);
                return;
            }

            routableLinks.push(link);
        });

        return this.provider.sync(
            cells.filter((cell) => cell.isElement()).filter((element) => this.trackElement({ element })).map((element) => this.getAvoidShape(element)),
            routableLinks.map((link) => this.getAvoidConnector(link))
        );
    }

    /**
     * Maps a JointJS port id to an avoid pin id (a number). The pin id
     * does not need to be unique across the whole diagram, only per shape.
     *
     * @param elementId - Id of the element the port belongs to.
     * @param portId - Id of the port.
     * @returns The pin id allocated for this port, allocating a new one on first use.
     */
    private getConnectionPinId(elementId: dia.Cell.ID, portId: string): number {
        const pinKey = `${elementId}:${portId}`;
        const existingPinId = this.pinIds[pinKey];
        if (existingPinId !== undefined) return existingPinId;
        const pinId = this.nextPinId++;
        this.pinIds[pinKey] = pinId;
        return pinId;
    }

    /**
     * Builds the avoid {@link Shape} representation of a JointJS element:
     * its bounding box, a default connection pin at its center, plus one
     * pin per port.
     *
     * @param element - The element to convert.
     * @returns The avoid shape representing `element`.
     */
    private getAvoidShape(element: dia.Element): Shape {
        const pins = [];

        pins.push({
            id: DEFAULT_PIN_CLASS_ID,
            x: 0.5,
            y: 0.5,
            connectionDirection: this.connectionDirections.all,
        });

        element.getPortGroupNames().forEach((groupName) => {
            const portsPositions = element.getPortsPositions(groupName);
            const { width, height } = element.size();
            const rect = new g.Rect(0, 0, width, height);
            Object.keys(portsPositions).forEach((portId) => {
                const { x, y } = portsPositions[portId]!;
                const side = rect.sideNearestToPoint({ x, y }) as keyof typeof this.connectionDirections;
                pins.push({
                    id: this.getConnectionPinId(element.id, portId),
                    x: x / width,
                    y: y / height,
                    connectionDirection: this.connectionDirections[side]
                });
            });
        });

        return {
            id: element.id,
            bbox: element.getBBox(),
            pins
        };
    }

    /**
     * Builds the avoid {@link Connector} representation of a JointJS link:
     * the shape/pin ids its source and target ends connect to.
     *
     * @param link - The link to convert.
     * @returns The avoid connector representing `link`.
     */
    private getAvoidConnector(link: dia.Link): Connector {
        const { id: sourceId, port: sourcePortId = null } = link.source();
        const { id: targetId, port: targetPortId = null } = link.target();

        let sourcePinId: number | undefined = undefined;
        if (sourceId) {
            sourcePinId = sourcePortId
                ? this.getConnectionPinId(sourceId, sourcePortId)
                : DEFAULT_PIN_CLASS_ID;
        }

        let targetPinId: number | undefined = undefined;
        if (targetId) {
            targetPinId = targetPortId
                ? this.getConnectionPinId(targetId, targetPortId)
                : DEFAULT_PIN_CLASS_ID;
        }

        return {
            id: link.id,
            sourceId,
            sourcePinId,
            targetId,
            targetPinId
        };
    }

    /**
     * Marks `link` as having an in-flight routing computation and emits
     * `link:pending`. Every call must be paired with a later {@link setRouted}
     * call for the same link, closing the cycle.
     *
     * @param link - The link entering a routing cycle.
     */
    private setRouting(link: dia.Link): void {
        this.pendingLinks.add(link);
        this.trigger('link:routing', link);
    }

    /**
     * Closes `link`'s pending cycle, if one is open, and emits `link:routed`.
     *
     * @param link - The link whose route was just applied.
     * @param options - Options describing the routing outcome.
     */
    private setRouted(link: dia.Link, options: { origin: RouteOrigin, reason?: UnroutableReason }): void {
        this.pendingLinks.delete(link);
        this.trigger('link:routed', link, options);
    }

    /**
     * Closes `link`'s routing cycle without a route being applied, and emits `link:routing:cancelled`.
     *
     * @param link - The link whose pending routing cycle is being abandoned.
     */
    private setRoutingCanceled(link: dia.Link): void {
        this.pendingLinks.delete(link);
        this.trigger('link:routing:cancelled', link);
    }

    /**
     * Callback registered for the provider's `connector:changed` event (see
     * {@link ProviderEventMap}), invoked whenever avoid recomputes a link's
     * route. Applies the route if it is still valid for a still-existing
     * link, otherwise falls back to the built-in `rightAngle` route.
     *
     * @param linkId - Id of the link whose route changed.
     * @param points - The new route, including the source and target points.
     */
    private routeLink(linkId: dia.Cell.ID, points: dia.Point[]): void {
        const link = this.graph.getCell(linkId) as dia.Link | undefined;
        // The link may have been removed from the graph while avoid was still
        // computing its route or became unroutable, so check for existence and validity before applying the route.
        if (!link || !this.provider.hasConnector(linkId)) return;

        const fallback = !points || !this.isRouteValid(points, link);

        if (fallback) {
            this.applyFallbackRoute(link);
            return;
        }

        this.applyRoute(link, points);
    }

    /**
     * Applies the route computed by avoid to the link, updating its
     * source/target anchors and vertices, then closes its pending cycle.
     *
     * @param link - The link to update.
     * @param points - The route computed by avoid, including the source and target points.
     */
    private applyRoute(link: dia.Link, points: dia.Point[]): void {
        const updatedRoute = this.getUpdatedRoute(points, link);
        const attributes = {
            source: {
                ...link.source(),
                anchor: updatedRoute.sourceAnchor
            },
            target: {
                ...link.target(),
                anchor: updatedRoute.targetAnchor
            },
            vertices: updatedRoute.vertices
        };

        this.applyingRoute = true;
        // trigger change on vertices setter to update the link view
        if (this.options.setRouteAttributes) {
            try {
                this.options.setRouteAttributes({
                    link,
                    attributes,
                    origin: 'avoid'
                });
            } finally {
                this.applyingRoute = false;
            }
            this.setRouted(link, { origin: 'avoid' });
            return;
        }

        try {
            link.set(attributes, { [this.changeFlag]: true });
        } finally {
            this.applyingRoute = false;
        }

        this.setRouted(link, { origin: 'avoid' });
    }

    /**
     * Applies the manual `rightAngle` route directly to the link, bypassing
     * avoid. Used when a route computed by avoid should not be trusted.
     *
     * @param link - The link to update.
     */
    private applyFallbackRoute(link: dia.Link, options: { routing?: boolean, reason?: UnroutableReason } = {}): void {
        const rightAngleVertices = this.getFallbackRoute(link);

        const attributes = {
            source: {
                ...link.source(),
                anchor: {
                    name: 'modelCenter',
                }
            },
            target: {
                ...link.target(),
                anchor: {
                    name: 'modelCenter',
                }
            },
            vertices: rightAngleVertices
        };

        this.applyingRoute = true;

        if (this.options.setRouteAttributes) {
            try {
                this.options.setRouteAttributes({
                    link,
                    attributes,
                    origin: 'fallback',
                    routing: !!options.routing,
                    unroutableReason: options.reason,
                });
            } finally {
                this.applyingRoute = false;
            }
            if (options.routing) {
                this.setRouting(link);
            } else {
                this.setRouted(link, { origin: 'fallback', reason: options.reason });
            }

            return;
        }

        try {
            link.set(attributes, { [this.changeFlag]: true });
        } finally {
            this.applyingRoute = false;
        }

        if (options.routing) {
            this.setRouting(link);
        } else {
            this.setRouted(link, { origin: 'fallback', reason: options.reason });
        }
    }

    /**
     * Computes a `rightAngle`-routed fallback path for `link`, using its
     * source/target elements' bounding boxes (or a zero-size box at the
     * link's loose end point, if unconnected).
     *
     * @param link - The link to compute a fallback route for.
     * @returns The fallback route's vertices.
     */
    private getFallbackRoute(link: dia.Link): dia.Point[] {
        const sourcePoint = link.getSourcePoint();
        const targetPoint = link.getTargetPoint();

        let sourceBBox = link.getSourceElement()?.getBBox();
        if (!sourceBBox) {
            sourceBBox = new g.Rect(sourcePoint.x, sourcePoint.y, 0, 0);
        }

        const sourceSide = sourceBBox.center().equals(sourcePoint)
            ? sourceBBox.sideNearestToPoint(targetPoint)
            : sourceBBox.sideNearestToPoint(sourcePoint);

        const source = {
            endPoint: sourcePoint,
            bbox: new g.Rect(sourceBBox.x, sourceBBox.y, sourceBBox.width, sourceBBox.height),
            side: sourceSide,
            margin: this.options.shapeBufferDistance ?? 0,
        };

        let targetBBox = link.getTargetElement()?.getBBox();
        if (!targetBBox) {
            targetBBox = new g.Rect(targetPoint.x, targetPoint.y, 0, 0);
        }

        const targetSide = targetBBox.center().equals(targetPoint)
            ? targetBBox.sideNearestToPoint(sourcePoint)
            : targetBBox.sideNearestToPoint(targetPoint);

        const target = {
            endPoint: targetPoint,
            bbox: new g.Rect(targetBBox.x, targetBBox.y, targetBBox.width, targetBBox.height),
            side: targetSide,
            margin: this.options.shapeBufferDistance ?? 0,
        };

        return alg.rightAnglePath(source, target);
    }

    /**
     * Determines whether the avoid route should be used or whether to
     * fall back to the `rightAngle` router. Avoid does not expose a
     * dedicated way to check this, so heuristics are used instead.
     *
     * @param route - The route computed by avoid, including the source and target points.
     * @param link - The link the route was computed for.
     * @returns `true` if the route should be trusted and applied as-is.
     */
    private isRouteValid(
        route: dia.Point[],
        link: dia.Link
    ): boolean {
        const { port: sourcePortId = null } = link.source();
        const { port: targetPortId = null } = link.target();

        const sourceElement = link.getSourceElement() as dia.Element;
        const targetElement = link.getTargetElement() as dia.Element;

        if (!sourceElement || !targetElement) {
            return false;
        }

        const size = route.length; // includes the source and target points
        if (size > 2) {
            // A route with more than two points is considered valid.
            return true;
        }

        if (size < 2) {
            return false;
        }

        const sourcePoint = route[0]!;
        const targetPoint = route[route.length - 1]!;

        if (sourcePoint.x !== targetPoint.x && sourcePoint.y !== targetPoint.y) {
            // The route is not straight.
            return false;
        }

        if (sourcePortId && targetElement!.getBBox().inflate(this.options.shapeBufferDistance).containsPoint(sourcePoint)) {
            // The source point is inside the target element.
            return false;
        }

        if (targetPortId && sourceElement!.getBBox().inflate(this.options.shapeBufferDistance).containsPoint(targetPoint)) {
            // The target point is inside the source element.
            return false;
        }

        return true;
    }

    /**
     * Derives the link attributes to apply from a route computed by avoid:
     * anchors (as an offset from the source/target ports, so the link stays
     * attached where avoid routed it) and the vertices in between.
     *
     * @param route - The route computed by avoid, including the source and target points.
     * @param link - The link the route was computed for.
     * @returns The new source/target anchors and the route's inner vertices.
     */
    private getUpdatedRoute(route: dia.Point[], link: dia.Link): { sourceAnchor: anchors.AnchorJSON, targetAnchor: anchors.AnchorJSON, vertices: dia.Point[] } {
        const { port: sourcePortId = null } = link.source();
        const { port: targetPortId = null } = link.target();

        const sourceElement = link.getSourceElement() as dia.Element;
        const targetElement = link.getTargetElement() as dia.Element;

        const sourcePoint = route[0]!;
        const targetPoint = route[route.length - 1]!;
        const vertices = route.slice(1, -1);

        const sourceAnchorDelta = this.getLinkAnchorDelta(sourceElement, sourcePortId, sourcePoint);
        const targetAnchorDelta = this.getLinkAnchorDelta(targetElement, targetPortId, targetPoint);

        // temporarily set the anchors to the new positions so that the link is drawn correctly
        const sourceAnchor = {
            name: 'modelCenter',
            args: {
                dx: sourceAnchorDelta.x,
                dy: sourceAnchorDelta.y
            }
        };

        const targetAnchor = {
            name: 'modelCenter',
            args: {
                dx: targetAnchorDelta.x,
                dy: targetAnchorDelta.y
            }
        };

        return {
            sourceAnchor,
            targetAnchor,
            vertices
        };
    }

    /**
     * Computes the offset between a route's end point and the element's
     * port (or center, if unconnected to a port), to be used as a
     * `modelCenter` anchor delta.
     *
     * @param element - The element the link end connects to.
     * @param portId - Id of the port the link end connects to, or `null` if it connects to the element directly.
     * @param point - The route's end point on this side.
     * @returns The offset from the port's (or element's center's) position to `point`.
     */
    private getLinkAnchorDelta(element: dia.Element, portId: string | null, point: dia.Point): dia.Point {
        let anchorPosition: dia.Point;
        if (portId) {
            const port = element.getPort(portId);
            if (port) {
                const portPosition = element.getPortsPositions(port.group as string)[portId]!;
                anchorPosition = element.position().offset(portPosition);
            } else {
                anchorPosition = element.getBBox().center();
            }
        } else {
            anchorPosition = element.getBBox().center();
        }
        return new g.Point(point).difference(anchorPosition);
    }

    /**
     * A link cannot be routed by avoid when one of its ends is a loose
     * point rather than being connected to an element, or when either
     * connected element is excluded from routing via `skipElement`.
     *
     * @param link - The link to validate.
     * @returns `true` if both ends are connected to a tracked element.
     */
    private validateEnds(link: dia.Link): boolean {
        const sourceCell = link.getSourceCell();
        const targetCell = link.getTargetCell();

        // Avoid cannot route a link that is not connected to an element on both ends.
        if (!sourceCell || !targetCell) {
            return false;
        }

        // Avoid cannot route a link that is connected to another link on either end.
        if (sourceCell?.isLink() || targetCell?.isLink()) {
            return false;
        }

        // Avoid cannot route a link that is connected to an element that is excluded from routing.
        if (!this.trackElement({ element: sourceCell as dia.Element }) || !this.trackElement({ element: targetCell as dia.Element })) {
            return false;
        }

        return true;
    }

    /**
     * Determines why {@link validateEnds}`(link)` failed, for
     * `interceptUnroutableLink`. Only meaningful when `validateEnds` has
     * already returned `false`.
     *
     * @param link - The link that failed {@link validateEnds}.
     * @returns Why the link could not be routed.
     */
    private getUnroutableReason(link: dia.Link): UnroutableReason {
        const sourceCell = link.getSourceCell();
        const targetCell = link.getTargetCell();

        // Avoid cannot route a link that is not connected to a cell on both ends.
        if (!sourceCell || !targetCell) {
            return 'unconnected';
        }

        // Avoid cannot route a link that is connected to another link on either end.
        if (sourceCell?.isLink() || targetCell?.isLink()) {
            return 'unsupported';
        }

        // Avoid cannot route a link that is connected to an element that is excluded from routing.
        return 'untracked-element';
    }

    /**
     * Gives the consumer first refusal on a link that failed
     * {@link validateEnds}. If `interceptUnroutableLink` claims it (returns
     * `true`), the pending cycle is closed and the built-in `rightAngle`
     * route is skipped entirely. Otherwise falls through to the built-in
     * {@link applyFallbackRoute}.
     *
     * @param link - The unroutable link.
     */
    private resolveUnroutableLink(link: dia.Link): void {
        if (this.pendingLinks.has(link)) {
            this.setRoutingCanceled(link);
        }

        const { interceptUnroutableLink } = this.options;
        const reason = this.getUnroutableReason(link);
        if (interceptUnroutableLink && interceptUnroutableLink({
            link,
            reason
        })) {
            return;
        }

        this.applyFallbackRoute(link, { reason });
    }
}

Object.assign(RouterService.prototype, mvc.Events);
