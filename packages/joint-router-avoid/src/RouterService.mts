import { g, mvc, util, alg } from '@joint/core';

import type { dia, anchors } from '@joint/core';
import type { ConnDirFlags } from 'libavoid-js';
import type { Connector, Provider, Shape } from './providers/Provider.mjs';

const DEFAULT_PIN_CLASS_ID = 1;

export interface RouterServiceOptions {
    graph: dia.Graph;
    provider: Provider;
    filterLink?: (link: dia.Link) => boolean;
    filterElement?: (element: dia.Element) => boolean;
    margin?: number;
}

export class RouterService {

    private static instances: Map<dia.Graph, RouterService> = new Map();

    // Provided by the `mvc.Events` mixin applied below the class body.
    // Allows `RouterService` instances to emit `pending`/`routed` events for
    // their links. See `Keyboard` in `@joint/keyboard` for the same pattern.
    declare on: mvc.Events_On<RouterService>;
    declare off: mvc.Events_Off<RouterService>;
    declare trigger: mvc.Events_Trigger<RouterService>;

    private readonly defaultFilterLink = (_link: dia.Link) => true;
    private readonly defaultFilterElement = (_element: dia.Element) => true;

    static getInstance(graph: dia.Graph): RouterService | undefined {
        return RouterService.instances.get(graph);
    }

    static create(options: RouterServiceOptions): RouterService {
        const instance =  new RouterService(options);
        this.instances.set(options.graph, instance);
        return instance;
    }

    private readonly graph: dia.Graph;
    private readonly provider: Provider;
    private readonly pinIds: Record<string, number> = {};
    private readonly connectorRoutes: Record<dia.Cell.ID, dia.Point[]> = {};
    private readonly filterLink: (link: dia.Link) => boolean;
    private readonly filterElement: (element: dia.Element) => boolean;

    // Anchors of a link as they were before the router first modified them.
    // Used as the base for delta calculations so that adjustments don't
    // accumulate on top of anchors the router itself already changed.
    private readonly originalAnchors: WeakMap<dia.Link, {
        source: anchors.AnchorJSON | undefined;
        target: anchors.AnchorJSON | undefined;
    }> = new WeakMap();

    readonly margin: number;

    private nextPinId = 100000;
    private graphListener?: mvc.Listener<[]>;

    private connectionDirections: {
        top: ConnDirFlags;
        right: ConnDirFlags;
        bottom: ConnDirFlags;
        left: ConnDirFlags;
        all: ConnDirFlags;
    };

    private constructor(options: RouterServiceOptions) {
        this.graph = options.graph;
        this.margin = options.margin ?? 0;
        this.provider = options.provider;

        this.filterLink = options.filterLink ?? this.defaultFilterLink;
        this.filterElement = options.filterElement ?? this.defaultFilterElement;

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
    addGraphListeners(): void {
        this.removeGraphListeners();

        const listener = new mvc.Listener<[]>();
        listener.listenTo(this.graph, {
            remove: (cell: dia.Cell) => this.onCellRemoved(cell),
            add: (cell: dia.Cell) => this.onCellAdded(cell),
            change: (cell: dia.Cell, opt: dia.Cell.Options) => this.onCellChanged(cell, opt),
            reset: (_collection: unknown, opt: { previousModels: dia.Cell[] }) => this.onGraphReset(opt.previousModels),
        });

        this.graphListener = listener;
    }

    // Stops listening to graph changes.
    removeGraphListeners(): void {
        this.graphListener?.stopListening();
        this.graphListener = undefined;
    }

    public getRoute(linkId: dia.Cell.ID): dia.Point[] | undefined {
        return this.connectorRoutes[linkId];
    }

    private onCellRemoved(cell: dia.Cell): void {
        if (cell.isElement() && this.filterElement(cell)) {
            this.provider.deleteShape(cell.id);
        } else if (cell.isLink() && this.filterLink(cell)) {
            this.provider.deleteConnector(cell.id);
            this.originalAnchors.delete(cell);
        }
    }

    private onCellAdded(cell: dia.Cell): void {
        if (cell.isElement() && this.filterElement(cell)) {
            this.provider.updateShape(this.getAvoidShape(cell));
        } else if (cell.isLink() && this.filterLink(cell)) {
            this.provider.updateConnector(this.getAvoidConnector(cell));
        }
    }

    private onCellChanged(cell: dia.Cell, opt: dia.Cell.Options & { avoidRouter?: boolean }): void {
        if (opt.avoidRouter) return;

        if ('source' in cell.changed || 'target' in cell.changed) {
            if (!cell.isLink() || !this.filterLink(cell)) return;
            if (cell.changed.source?.anchor || cell.changed.target?.anchor) {
                this.originalAnchors.delete(cell);
            }
            this.trigger('pending', cell);
            this.provider.updateConnector(this.getAvoidConnector(cell));
        }

        if ('position' in cell.changed || 'size' in cell.changed) {
            if (!cell.isElement() || !this.filterElement(cell)) return;
            this.graph.getConnectedLinks(cell).forEach((link) => {
                if (this.filterLink(link)) {
                    this.trigger('pending', link);
                }
            });
            this.provider.updateShape(this.getAvoidShape(cell));
        }
    }

    private onGraphReset(previousModels: dia.Cell[]): void {
        if (previousModels) {
            previousModels.forEach((cell) => {
                if (cell.isElement() && this.filterElement(cell)) {
                    this.provider.deleteShape(cell.id, false);
                } else if (cell.isLink() && this.filterLink(cell)) {
                    this.provider.deleteConnector(cell.id, false);
                    this.originalAnchors.delete(cell);
                }
            });
        }

        this.provider.updateGraph(
            this.graph.getElements().filter(this.filterElement).map((element) => this.getAvoidShape(element)),
            this.graph.getLinks().filter(this.filterLink).map((link) => this.getAvoidConnector(link))
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

    private routeLink(linkId: dia.Cell.ID, points: dia.Point[]): void {
        const link = this.graph.getCell(linkId) as dia.Link | undefined;
        if (!link) return;
        this.connectorRoutes[linkId] = points;
        this.trigger('routed', link);
        if (!points || !this.isRouteValid(points, link)) {
            const { source: originalSourceAnchor, target: originalTargetAnchor } = this.getOriginalLinkAnchors(link);

            // Restore the original anchors before computing the fallback route,
            // since it derives its points from the link's current anchors.
            link.set({
                source: {
                    ...link.source(),
                    anchor: originalSourceAnchor
                },
                target: {
                    ...link.target(),
                    anchor: originalTargetAnchor
                }
            }, { avoidRouter: true });

            const rightAngleVertices = this.getFallbackRoute(link);

            link.set('vertices', rightAngleVertices, { avoidRouter: true });
            return;
        }

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
        link.set(linkAttributes, { avoidRouter: true });
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
            margin: this.margin,
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
            x0: targetBBox?.x ?? targetPoint.x,
            y0: targetBBox?.y ?? targetPoint.y,
            width: targetBBox?.width ?? 0,
            height: targetBBox?.height ?? 0,
            side: targetSide,
            margin: this.margin,
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

        const size = route.length; // +2 for source and target points
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

        if (sourcePortId && targetElement!.getBBox().inflate(this.margin).containsPoint(sourcePoint)) {
            // The source point is inside the target element.
            return false;
        }

        if (targetPortId && sourceElement!.getBBox().inflate(this.margin).containsPoint(targetPoint)) {
            // The target point is inside the source element.
            return false;
        }

        return true;
    }


    // Returns the anchors of the link as they were before the router first
    // modified them, capturing them lazily on first access.
    private getOriginalLinkAnchors(link: dia.Link): {
        source: anchors.AnchorJSON | undefined;
        target: anchors.AnchorJSON | undefined;
    } {
        let originalAnchors = this.originalAnchors.get(link);
        if (!originalAnchors) {
            originalAnchors = {
                source: link.source().anchor,
                target: link.target().anchor
            };
            this.originalAnchors.set(link, originalAnchors);
        }
        return originalAnchors;
    }

    private getUpdatedRoute(route: dia.Point[], link: dia.Link): { sourceAnchor: anchors.AnchorJSON, targetAnchor: anchors.AnchorJSON, vertices: dia.Point[] } {
        const { port: sourcePortId = null } = link.source();
        const { port: targetPortId = null } = link.target();
        const { source: baseSourceAnchor, target: baseTargetAnchor } = this.getOriginalLinkAnchors(link);

        const sourceElement = link.getSourceElement() as dia.Element;
        const targetElement = link.getTargetElement() as dia.Element;

        const sourcePoint = route[0]!;
        const targetPoint = route[route.length - 1]!;
        const vertices = route.slice(1, -1);

        const sourceAnchorDelta = this.getLinkAnchorDelta(sourceElement, sourcePortId, sourcePoint);
        const targetAnchorDelta = this.getLinkAnchorDelta(targetElement, targetPortId, targetPoint);

        // temporarily set the anchors to the new positions so that the link is drawn correctly
        let sourceAnchor;
        if (!baseSourceAnchor) {
            sourceAnchor = {
                name: 'modelCenter',
                args: {
                    dx: sourceAnchorDelta.x,
                    dy: sourceAnchorDelta.y
                }
            };
        } else {
            sourceAnchor = util.cloneDeep(baseSourceAnchor);
            if (!sourceAnchor.args) {
                sourceAnchor.args = {};
            }
            sourceAnchor.args.dx = (sourceAnchor.args.dx ?? 0) + sourceAnchorDelta.x;
            sourceAnchor.args.dy = (sourceAnchor.args.dy ?? 0) + sourceAnchorDelta.y;
        }

        let targetAnchor;
        if (!baseTargetAnchor) {
            targetAnchor = {
                name: 'modelCenter',
                args: {
                    dx: targetAnchorDelta.x,
                    dy: targetAnchorDelta.y
                }
            };
        } else {
            targetAnchor = util.cloneDeep(baseTargetAnchor);
            if (!targetAnchor.args) {
                targetAnchor.args = {};
            }
            targetAnchor.args.dx = (targetAnchor.args.dx ?? 0) + targetAnchorDelta.x;
            targetAnchor.args.dy = (targetAnchor.args.dy ?? 0) + targetAnchorDelta.y;
        }

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
}

Object.assign(RouterService.prototype, mvc.Events);
