import { g, mvc, alg } from '@joint/core';

import type { dia, anchors } from '@joint/core';
import type { ConnDirFlags } from 'libavoid-js';
import type { Connector, Provider, Shape } from './providers/Provider.mjs';

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

/** Parameters passed to a {@link SkipLinkCallback}. */
export type SkipLinkCallbackParameters = {
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
export type SkipLinkCallback = (params: SkipLinkCallbackParameters) => boolean;

/** Parameters passed to a {@link SkipElementCallback}. */
export type SkipElementCallbackParameters = {
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
export type SkipElementCallback = (params: SkipElementCallbackParameters) => boolean;

/** Parameters passed to a {@link SetRouteAttributesCallback}. */
export type SetRouteAttributesCallbackParameters = {
    /** The link the route applies to. */
    link: dia.Link;
    /** The computed route attributes to apply to the link. */
    attributes: RouteAttributes;
    /** Whether `attributes` came from the built-in fallback route rather than avoid. */
    fallback?: boolean;
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
export type UnroutableReason = 'unconnected' | 'untracked-element';

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
    /** Excludes links from routing. Defaults to routing every link. */
    skipLink?: SkipLinkCallback;
    /** Excludes elements from routing. Defaults to routing every element. */
    skipElement?: SkipElementCallback;
    /** Overrides how computed route attributes are applied to a link. Defaults to calling `link.set()` directly. */
    setRouteAttributes?: SetRouteAttributesCallback;
    /** Gives the consumer first refusal on links avoid cannot route. Defaults to always falling back to the built-in `rightAngle` route. */
    interceptUnroutableLink?: UnroutableLinkCallback;
    /** The margin to apply around elements when computing fallback route. */
    elementMargin?: number;
    /** Name of the `opt` flag set on `link.set()` calls made by this instance, so its own changes can be told apart from the consumer's. Defaults to `'avoidRouter'`. */
    eventFlagName?: string;
}

/**
 * Keeps a JointJS graph's links routed via the
 * [libavoid](https://www.adaptagrams.org/documentation/annotated.html)
 * orthogonal routing library, delegating the actual route computation to a
 * {@link Provider} (either on the main thread or inside a Worker).
 *
 * Instances are normally created via `initAvoidRouter()` rather than
 * directly. A `RouterService` listens to its graph for as long as it is
 * not {@link destroy}ed, and emits `link:pending`/`link:routed`/
 * `link:pending:cancelled` events as links are (re-)routed.
 */
export class RouterService {

    // Provided by the `mvc.Events` mixin applied below the class body.
    // Allows `RouterService` instances to emit `pending`/`routed` events for
    // their links. See `Keyboard` in `@joint/keyboard` for the same pattern.
    declare on: mvc.Events_On<RouterService>;
    declare off: mvc.Events_Off<RouterService>;
    declare trigger: mvc.Events_Trigger<RouterService>;

    private readonly defaultSkipLink: SkipLinkCallback = () => false;
    private readonly defaultSkipElement: SkipElementCallback = () => false;

    /** Maps `${elementId}:${portId}` to the avoid pin id allocated for that port. */
    private readonly pinIds: Record<string, number> = {};
    /** The last route avoid computed for each link, keyed by link id. */
    private readonly connectorRoutes: Record<dia.Cell.ID, dia.Point[]> = {};
    private readonly skipLink: SkipLinkCallback;
    private readonly skipElement: SkipElementCallback;

    // Links with an open `pending` cycle, i.e. `link:pending` was emitted for
    // them and `link:routed` hasn't closed it out yet. Checked wherever avoid is
    // definitively given up on for a change (rather than merely retried),
    // so a link detached mid-flight - while avoid was still computing its
    // route - gets its stranded cycle closed instead of staying stuck.
    private readonly pendingLinks: WeakSet<dia.Link> = new WeakSet();

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
        if (this.options.elementMargin == null) {
            this.options.elementMargin = 0;
        }
        if (this.options.eventFlagName == null) {
            this.options.eventFlagName = 'avoidRouter';
        }

        this.skipLink = options.skipLink ?? this.defaultSkipLink;
        this.skipElement = options.skipElement ?? this.defaultSkipElement;

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

        this.provider.onConnectorChanged = (linkId, points) => this.routeLink(linkId, points);

        this.addGraphListeners();
    }

    /**
     * Starts listening to graph changes and automatically updates the
     * router. Also (re-)syncs any cells the graph already holds - e.g.
     * cells added before `init()` was called, or while listeners were
     * detached - since referencing an element that was never registered
     * as an avoid shape aborts the underlying WASM module irrecoverably.
     */
    addGraphListeners(): void {
        this.removeGraphListeners();

        const listener = new mvc.Listener<[]>();
        listener.listenTo(this.graph, {
            remove: (cell: dia.Cell) => this.onCellRemoved(cell),
            add: (cell: dia.Cell) => this.onCellAdded(cell),
            change: (cell: dia.Cell, opt: dia.Cell.Options) => this.onCellChanged(cell, opt),
            reset: (_collection: unknown) => this.onGraphReset(),
        });

        this.graphListener = listener;

        this.onGraphReset();
    }

    /** Stops listening to graph changes. */
    removeGraphListeners(): void {
        this.graphListener?.stopListening();
        this.graphListener = undefined;
    }

    /**
     * Returns the route computed by avoid for the link with the given id.
     * The route is an array of points including the source and target
     * points.
     *
     * @param linkId - Id of the link to look up.
     * @returns The link's current route, or `undefined` if avoid has not computed one yet.
     */
    getRoute(linkId: dia.Cell.ID): dia.Point[] | undefined {
        return this.connectorRoutes[linkId];
    }

    /**
     * Stops routing this graph and releases the resources held by this
     * instance and its provider (e.g. terminates a Worker thread). The
     * instance must not be used after calling this.
     */
    destroy(): void {
        if (this.destroyed) return;
        this.destroyed = true;

        this.removeGraphListeners();
        this.provider.destroy();
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
            if (!this.skipElement({ element: cell })) {
                this.provider.deleteShape(cell.id);
            }
        } else if (cell.isLink() && !this.skipLink({ link: cell })) {
            if (this.pendingLinks.has(cell)) {
                this.setPendingCanceled(cell);
            }
            delete this.connectorRoutes[cell.id];
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
        if (cell.isElement() && !this.skipElement({ element: cell })) {
            this.provider.updateShape(this.getAvoidShape(cell));
            return;
        }

        if (!cell.isLink() || this.skipLink({ link: cell })) return;

        if (!this.validateEnds(cell)) {
            // In scope for the router, but avoid can't route a link that
            // isn't connected to an element on both ends.
            this.resolveUnroutableLink(cell);
            return;
        }

        this.provider.updateConnector(this.getAvoidConnector(cell));
    }

    /**
     * Handles a cell's attributes changing: re-registers its avoid
     * shape/connector, and re-routes any links affected by the change.
     *
     * @param cell - The cell that changed.
     * @param opt - The options the change was made with; changes flagged with `options.eventFlagName` (this instance's own writes) are ignored.
     */
    private onCellChanged(cell: dia.Cell, opt: dia.Cell.Options = {}): void {
        if (opt[this.options.eventFlagName!]) return;

        if ('source' in cell.changed || 'target' in cell.changed) {
            if (!cell.isLink() || this.skipLink({ link: cell })) return;

            if (!this.validateEnds(cell)) {
                // Giving up on avoid for this change - hand off to the
                // consumer via `interceptUnroutableLink`, or fall back to the
                // built-in rightAngle route.
                this.resolveUnroutableLink(cell);
                this.provider.deleteConnector(cell.id);
                return;
            }

            this.applyFallbackRoute(cell);
            this.setPending(cell);
            this.provider.updateConnector(this.getAvoidConnector(cell));
        }

        if ('position' in cell.changed || 'size' in cell.changed) {
            if (!cell.isElement()) return;

            this.graph.getConnectedLinks(cell).filter((link) => !this.skipLink({ link })).forEach((link) => {
                if (!this.validateEnds(link)) {
                    this.resolveUnroutableLink(link);
                    return;
                }

                this.applyFallbackRoute(link);
                this.setPending(link);
            });

            if (this.skipElement({ element: cell })) return;

            this.provider.updateShape(this.getAvoidShape(cell));
        }
    }

    /**
     * Handles the graph being reset: re-registers every element and
     * routable link with the provider in a single transaction.
     */
    private onGraphReset(): void {
        const routableLinks: dia.Link[] = [];
        this.graph.getLinks().filter((link) => !this.skipLink({ link })).forEach((link) => {
            if (!this.validateEnds(link)) {
                this.resolveUnroutableLink(link);
                return;
            }

            routableLinks.push(link);
        });

        this.provider.resetGraph(
            this.graph.getElements().filter((element) => !this.skipElement({ element })).map((element) => this.getAvoidShape(element)),
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
     * @param link - The link entering a pending routing cycle.
     */
    private setPending(link: dia.Link): void {
        this.pendingLinks.add(link);
        this.trigger('link:pending', link);
    }

    /**
     * Closes `link`'s pending cycle, if one is open, and emits `link:routed`.
     *
     * @param link - The link whose route was just applied.
     * @param fallback - Whether the final route came from avoid (`false`/omitted) or from {@link applyFallbackRoute} (`true`) - e.g. because the link was detached while avoid was still computing its route.
     */
    private setRouted(link: dia.Link, fallback?: boolean): void {
        this.pendingLinks.delete(link);
        this.trigger('link:routed', link, { fallback });
    }

    /**
     * Closes `link`'s pending cycle without a route being applied, and
     * emits `link:pending:cancelled`.
     *
     * @param link - The link whose pending routing cycle is being abandoned.
     */
    private setPendingCanceled(link: dia.Link): void {
        this.pendingLinks.delete(link);
        this.trigger('link:pending:cancelled', link);
    }

    /**
     * Callback registered as {@link Provider.onConnectorChanged}, invoked
     * whenever avoid recomputes a link's route. Applies the route if it is
     * still valid for a still-existing link, otherwise falls back to the
     * built-in `rightAngle` route.
     *
     * @param linkId - Id of the link whose route changed.
     * @param points - The new route, including the source and target points.
     */
    private routeLink(linkId: dia.Cell.ID, points: dia.Point[]): void {
        const link = this.graph.getCell(linkId) as dia.Link | undefined;
        // The link may have been removed from the graph while avoid was still
        // computing its route or became unroutable, so check for existence and validity before applying the route.
        if (!link || !this.provider.hasConnector(linkId)) return;

        this.connectorRoutes[linkId] = points;
        const fallback = !points || !this.isRouteValid(points, link);

        if (fallback) {
            this.applyFallbackRoute(link);
            this.setRouted(link, true);
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

        // trigger change on vertices setter to update the link view
        if (this.options.setRouteAttributes) {
            this.options.setRouteAttributes({ link, attributes });
            this.setRouted(link);
            return;
        }

        link.set(attributes, { [this.options.eventFlagName!]: true });
        this.setRouted(link);
    }

    /**
     * Applies the manual `rightAngle` route directly to the link, bypassing
     * avoid. Used when a route computed by avoid should not be trusted.
     *
     * @param link - The link to update.
     */
    private applyFallbackRoute(link: dia.Link): void {
        const rightAngleVertices = this.getFallbackRoute(link);

        if (this.options.setRouteAttributes) {
            this.options.setRouteAttributes({
                link,
                attributes: {
                    source: link.source(),
                    target: link.target(),
                    vertices: rightAngleVertices
                },
                fallback: true
            });
            return;
        }

        link.set('vertices', rightAngleVertices, { [this.options.eventFlagName!]: true });
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
            margin: this.options.elementMargin ?? 0,
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
            margin: this.options.elementMargin ?? 0,
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

        if (sourcePortId && targetElement!.getBBox().inflate(this.options.elementMargin).containsPoint(sourcePoint)) {
            // The source point is inside the target element.
            return false;
        }

        if (targetPortId && sourceElement!.getBBox().inflate(this.options.elementMargin).containsPoint(targetPoint)) {
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
        const sourceElement = link.getSourceElement();
        const targetElement = link.getTargetElement();

        if (!sourceElement || !targetElement) {
            return false;
        }

        if (this.skipElement({ element: sourceElement }) || this.skipElement({ element: targetElement })) {
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
        const sourceElement = link.getSourceElement();
        const targetElement = link.getTargetElement();

        if (!sourceElement || !targetElement) {
            return 'unconnected';
        }

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
            this.setPendingCanceled(link);
        }
        // Clean up any route that may have been computed by avoid before the link became unroutable.
        delete this.connectorRoutes[link.id];

        const { interceptUnroutableLink } = this.options;
        if (interceptUnroutableLink && interceptUnroutableLink({
            link,
            reason: this.getUnroutableReason(link)
        })) {
            return;
        }

        this.applyFallbackRoute(link);
        this.setRouted(link, true);
    }
}

Object.assign(RouterService.prototype, mvc.Events);
