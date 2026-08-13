import { g, mvc, alg } from '@joint/core';

import type { dia, anchors } from '@joint/core';
import type { ConnDirFlags } from 'libavoid-js';
import type { Connector, Provider, Shape } from './providers/Provider.mjs';

const DEFAULT_PIN_CLASS_ID = 1;

export interface FallbackRouteAttributes {
    vertices: dia.Point[];
}

export interface RouteAttributes {
    source: dia.Link.EndJSON;
    target: dia.Link.EndJSON;
    vertices: dia.Point[];
}

export type SkipLinkCallback = (link: dia.Link) => boolean;
export type SkipElementCallback = (element: dia.Element) => boolean;
export type SetRouteAttributesCallback = (link: dia.Link, attributes: RouteAttributes, options?: { fallback?: boolean }) => void;

// 'unconnected' - one or both ends aren't connected to an element at all.
// 'untracked-element' - both ends are connected, but at least one connected
// element is excluded from the router via `skipElement`.
export type UnroutableReason = 'unconnected' | 'untracked-element';
export type UnroutableLinkCallback = (link: dia.Link, reason: UnroutableReason) => boolean;

export interface RouterServiceOptions {
    skipLink?: SkipLinkCallback;
    skipElement?: SkipElementCallback;
    setRouteAttributes?: SetRouteAttributesCallback;
    handleUnroutableLink?: UnroutableLinkCallback;
    // The margin to apply around elements when computing fallback route.
    elementMargin?: number;
    eventFlagName?: string;
}

export class RouterService {

    // Provided by the `mvc.Events` mixin applied below the class body.
    // Allows `RouterService` instances to emit `pending`/`routed` events for
    // their links. See `Keyboard` in `@joint/keyboard` for the same pattern.
    declare on: mvc.Events_On<RouterService>;
    declare off: mvc.Events_Off<RouterService>;
    declare trigger: mvc.Events_Trigger<RouterService>;

    private readonly defaultSkipLink = (_link: dia.Link) => false;
    private readonly defaultSkipElement = (_element: dia.Element) => false;

    private readonly pinIds: Record<string, number> = {};
    private readonly connectorRoutes: Record<dia.Cell.ID, dia.Point[]> = {};
    private readonly skipLink: (link: dia.Link) => boolean;
    private readonly skipElement: (element: dia.Element) => boolean;

    // Links with an open `pending` cycle, i.e. `link:pending` was emitted for
    // them and `link:routed` hasn't closed it out yet. Checked wherever avoid is
    // definitively given up on for a change (rather than merely retried),
    // so a link detached mid-flight - while avoid was still computing its
    // route - gets its stranded cycle closed instead of staying stuck.
    private readonly pendingLinks: WeakSet<dia.Link> = new WeakSet();

    private nextPinId = 100000;
    private graphListener?: mvc.Listener<[]>;
    private destroyed = false;

    private connectionDirections: {
        top: ConnDirFlags;
        right: ConnDirFlags;
        bottom: ConnDirFlags;
        left: ConnDirFlags;
        all: ConnDirFlags;
    };

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

    // Starts listening to graph changes and automatically updates the router.
    // Also (re-)syncs any cells the graph already holds - e.g. cells added
    // before `init()` was called, or while listeners were detached - since
    // referencing an element that was never registered as an avoid shape
    // aborts the underlying WASM module irrecoverably.
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

    // Stops listening to graph changes.
    removeGraphListeners(): void {
        this.graphListener?.stopListening();
        this.graphListener = undefined;
    }

    // Returns the route computed by avoid for the link with the given id, or
    // `undefined` if avoid has not computed a route for it yet. The route is
    // an array of points including the source and target points.
    getRoute(linkId: dia.Cell.ID): dia.Point[] | undefined {
        return this.connectorRoutes[linkId];
    }

    // Stops routing this graph and releases the resources held by this
    // instance and its provider (e.g. terminates a Worker thread). The
    // instance must not be used after calling this.
    destroy(): void {
        if (this.destroyed) return;
        this.destroyed = true;

        this.removeGraphListeners();
        this.provider.destroy();
    }

    private onCellRemoved(cell: dia.Cell): void {
        if (cell.isElement()) {
            this.deletePinIds(cell.id);
            if (!this.skipElement(cell)) {
                this.provider.deleteShape(cell.id);
            }
        } else if (cell.isLink() && !this.skipLink(cell)) {
            if (this.pendingLinks.has(cell)) {
                this.setPendingCanceled(cell);
            }
            delete this.connectorRoutes[cell.id];
            this.provider.deleteConnector(cell.id);
        }
    }

    // Removes the pin ids allocated for the element's ports so `pinIds`
    // does not grow unboundedly as elements are added and removed over
    // the lifetime of the router.
    private deletePinIds(elementId: dia.Cell.ID): void {
        const prefix = `${elementId}:`;
        Object.keys(this.pinIds).forEach((pinKey) => {
            if (pinKey.startsWith(prefix)) {
                delete this.pinIds[pinKey];
            }
        });
    }

    private onCellAdded(cell: dia.Cell): void {
        if (cell.isElement() && !this.skipElement(cell)) {
            this.provider.updateShape(this.getAvoidShape(cell));
            return;
        }

        if (!cell.isLink() || this.skipLink(cell)) return;

        if (!this.validateEnds(cell)) {
            // In scope for the router, but avoid can't route a link that
            // isn't connected to an element on both ends.
            this.applyUnroutableFallback(cell);
            return;
        }

        this.provider.updateConnector(this.getAvoidConnector(cell));
    }

    private onCellChanged(cell: dia.Cell, opt: dia.Cell.Options = {}): void {
        if (opt[this.options.eventFlagName!]) return;

        if ('source' in cell.changed || 'target' in cell.changed) {
            if (!cell.isLink() || this.skipLink(cell)) return;

            if (!this.validateEnds(cell)) {
                // Giving up on avoid for this change - hand off to the
                // consumer via `handleUnroutableLink`, or fall back to the
                // built-in rightAngle route.
                this.applyUnroutableFallback(cell);
                this.provider.deleteConnector(cell.id);
                return;
            }

            this.applyFallbackRoute(cell);
            this.setPending(cell);
            this.provider.updateConnector(this.getAvoidConnector(cell));
        }

        if ('position' in cell.changed || 'size' in cell.changed) {
            if (!cell.isElement()) return;

            this.graph.getConnectedLinks(cell).filter((link) => !this.skipLink(link)).forEach((link) => {
                if (!this.validateEnds(link)) {
                    this.applyUnroutableFallback(link);
                    return;
                }

                this.applyFallbackRoute(link);
                this.setPending(link);
            });

            if (this.skipElement(cell)) return;

            this.provider.updateShape(this.getAvoidShape(cell));
        }
    }

    private onGraphReset(): void {
        const routableLinks: dia.Link[] = [];
        this.graph.getLinks().filter((link) => !this.skipLink(link)).forEach((link) => {
            if (!this.validateEnds(link)) {
                this.applyUnroutableFallback(link);
                return;
            }

            routableLinks.push(link);
        });

        this.provider.resetGraph(
            this.graph.getElements().filter((element) => !this.skipElement(element)).map((element) => this.getAvoidShape(element)),
            routableLinks.map((link) => this.getAvoidConnector(link))
        );
    }

    // Maps a JointJS port id to an avoid pin id (a number). The pin id
    // does not need to be unique across the whole diagram, only per shape.
    private getConnectionPinId(elementId: dia.Cell.ID, portId: string): number {
        const pinKey = `${elementId}:${portId}`;
        const existingPinId = this.pinIds[pinKey];
        if (existingPinId !== undefined) return existingPinId;
        const pinId = this.nextPinId++;
        this.pinIds[pinKey] = pinId;
        return pinId;
    }

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

    // Marks `link` as having an in-flight routing computation and emits
    // `link:pending`. Every call must be paired with a later `setRouted` call
    // for the same link, closing the cycle - see `setRouted`.
    private setPending(link: dia.Link): void {
        this.pendingLinks.add(link);
        this.trigger('link:pending', link);
    }

    // Closes `link`'s pending cycle, if one is open, and emits `link:routed`.
    // `fallback` tells listeners whether the final route came from avoid
    // (false) or from `applyFallbackRoute` (true) - e.g. because the link
    // was detached while avoid was still computing its route.
    private setRouted(link: dia.Link, fallback?: boolean): void {
        this.pendingLinks.delete(link);
        this.trigger('link:routed', link, { fallback });
    }

    private setPendingCanceled(link: dia.Link): void {
        this.pendingLinks.delete(link);
        this.trigger('link:pending:cancelled', link);
    }

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

    // Applies the route computed by avoid to the link, updating its source/target
    private applyRoute(link: dia.Link, points: dia.Point[]): void {
        const updatedRoute = this.getUpdatedRoute(points, link);
        const linkAttributes = {
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
            this.options.setRouteAttributes(link, linkAttributes);
            this.setRouted(link);
            return;
        }

        link.set(linkAttributes, { [this.options.eventFlagName!]: true });
        this.setRouted(link);
    }

    // Applies the manual `rightAngle` route directly to the link, bypassing
    // avoid. Used when a route computed by avoid should not be trusted.
    private applyFallbackRoute(link: dia.Link): void {
        const rightAngleVertices = this.getFallbackRoute(link);

        if (this.options.setRouteAttributes) {
            this.options.setRouteAttributes(link, {
                source: link.source(),
                target: link.target(),
                vertices: rightAngleVertices
            }, { fallback: true });
            return;
        }

        link.set('vertices', rightAngleVertices, { [this.options.eventFlagName!]: true });
    }

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
            point: sourcePoint,
            x0: sourceBBox.x,
            y0: sourceBBox.y,
            width: sourceBBox.width,
            height: sourceBBox.height,
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
            point: targetPoint,
            x0: targetBBox.x,
            y0: targetBBox.y,
            width: targetBBox.width,
            height: targetBBox.height,
            side: targetSide,
            margin: this.options.elementMargin ?? 0,
        };

        return alg.rightAnglePath(source, target);
    }

    // Determines whether the avoid route should be used or whether to
    // fall back to the `rightAngle` router. Avoid does not expose a
    // dedicated way to check this, so heuristics are used instead.
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

    // A link cannot be routed by avoid when one of its ends is a loose
    // point rather than being connected to an element.
    private validateEnds(link: dia.Link): boolean {
        const sourceElement = link.getSourceElement();
        const targetElement = link.getTargetElement();

        if (!sourceElement || !targetElement) {
            return false;
        }

        if (this.skipElement(sourceElement) || this.skipElement(targetElement)) {
            return false;
        }

        return true;
    }

    // Determines why `validateEnds(link)` failed, for `handleUnroutableLink`.
    // Only meaningful when `validateEnds` has already returned false.
    private getUnroutableReason(link: dia.Link): UnroutableReason {
        const sourceElement = link.getSourceElement();
        const targetElement = link.getTargetElement();

        if (!sourceElement || !targetElement) {
            return 'unconnected';
        }

        return 'untracked-element';
    }

    // Gives the consumer first refusal on a link that failed `validateEnds`.
    // If `handleUnroutableLink` claims it (returns true), the pending cycle
    // is closed and the built-in rightAngle route is skipped entirely.
    // Otherwise falls through to the built-in `applyFallbackRoute`.
    private applyUnroutableFallback(link: dia.Link): void {
        if (this.pendingLinks.has(link)) {
            this.setPendingCanceled(link);
        }
        // Clean up any route that may have been computed by avoid before the link became unroutable.
        delete this.connectorRoutes[link.id];

        const { handleUnroutableLink } = this.options;
        if (handleUnroutableLink && handleUnroutableLink(link, this.getUnroutableReason(link))) {
            return;
        }
        this.applyFallbackRoute(link);
        this.setRouted(link, true);
    }
}

Object.assign(RouterService.prototype, mvc.Events);
