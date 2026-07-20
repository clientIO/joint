import { g, mvc } from '@joint/core';

import type { dia } from '@joint/core';
import type { ConnDirFlags, Avoid as AvoidInstance, Router as AvoidRouter, ShapeRef, ConnRef } from 'libavoid-js';
import { avoid } from './router.mjs';

const DEFAULT_PIN_CLASS_ID = 1;

export interface AvoidRoute {
    vertices: g.Point[];
    sourcePoint: g.Point;
    targetPoint: g.Point;
}

export interface RouterServiceOptions {
    graph: dia.Graph;
    avoidInstance: AvoidInstance;
    avoidRouter: AvoidRouter;
    commitTransactions?: boolean;
    margin?: number;
}

export class RouterService {

    private static instances: Map<dia.Graph, RouterService> = new Map();

    static getInstance(graph: dia.Graph): RouterService | undefined {
        return RouterService.instances.get(graph);
    }

    static create(options: RouterServiceOptions): void {
        this.instances.set(options.graph, new RouterService(options));
    }

    private readonly graph: dia.Graph;
    private readonly avoidInstance: AvoidInstance;
    private readonly avoidRouter: AvoidRouter;
    private readonly commitTransactions: boolean;
    private readonly shapeRefs: Record<string, ShapeRef> = {};
    private readonly edgeRefs: Record<string, ConnRef> = {};
    private readonly pinIds: Record<string, number> = {};

    private readonly linksByPointer: Record<number, dia.Link> = {};
    private readonly onAvoidConnectorChange: (connRefPointer: number) => void;

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
        this.avoidInstance = options.avoidInstance;
        this.avoidRouter = options.avoidRouter;

        this.margin = options.margin ?? 0;

        this.connectionDirections = {
            top: this.avoidInstance.ConnDirUp,
            right: this.avoidInstance.ConnDirRight,
            bottom: this.avoidInstance.ConnDirDown,
            left: this.avoidInstance.ConnDirLeft,
            all: this.avoidInstance.ConnDirAll,
        };

        this.commitTransactions = options.commitTransactions ?? true;

        this.onAvoidConnectorChange = (connRefPointer) => this.routeLinkByPointer(connRefPointer);

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

    private getAvoidRectFromElement(Avoid: AvoidInstance, element: dia.Element) {
        const { x, y, width, height } = element.getBBox();
        return new Avoid.Rectangle(
            new Avoid.Point(x, y),
            new Avoid.Point(x + width, y + height)
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

    updateShape(element: dia.Element): void {
        const { shapeRefs, avoidRouter } = this;
        const shapeRect = this.getAvoidRectFromElement(this.avoidInstance, element);

        const existingShapeRef = shapeRefs[element.id];
        if (existingShapeRef) {
            // Only update the position and size of the shape.
            avoidRouter.moveShape(existingShapeRef, shapeRect);
            return;
        }

        const shapeRef = new this.avoidInstance.ShapeRef(avoidRouter, shapeRect);
        shapeRefs[element.id] = shapeRef;

        const centerPin = new this.avoidInstance.ShapeConnectionPin(
            shapeRef,
            DEFAULT_PIN_CLASS_ID, // one central pin for each shape
            0.5,
            0.5,
            true,
            0,
            this.connectionDirections.all
        );
        centerPin.setExclusive(false);

        // Add a pin for every port of the element.
        element.getPortGroupNames().forEach((groupName) => {
            const portsPositions = element.getPortsPositions(groupName);
            const { width, height } = element.size();
            const rect = new g.Rect(0, 0, width, height);
            Object.keys(portsPositions).forEach((portId) => {
                const { x, y } = portsPositions[portId]!;
                const side = rect.sideNearestToPoint({ x, y }) as keyof typeof this.connectionDirections;
                const pin = new this.avoidInstance.ShapeConnectionPin(
                    shapeRef,
                    this.getConnectionPinId(element.id, portId),
                    x / width,
                    y / height,
                    true,
                    0,
                    this.connectionDirections[side]
                );
                pin.setExclusive(false);
            });
        });
    }

    updateConnector(link: dia.Link): ConnRef | null{
        const { shapeRefs, edgeRefs } = this;

        const { id: sourceId, port: sourcePortId = null } = link.source();
        const { id: targetId, port: targetPortId = null } = link.target();

        if (!sourceId || !targetId) {
            // Links without a source or target are not supported.
            this.deleteConnector(link);
            return null;
        }

        const sourceConnEnd = new this.avoidInstance.ConnEnd(
            shapeRefs[sourceId]!,
            sourcePortId ? this.getConnectionPinId(sourceId, sourcePortId) : DEFAULT_PIN_CLASS_ID
        );
        const targetConnEnd = new this.avoidInstance.ConnEnd(
            shapeRefs[targetId]!,
            targetPortId ? this.getConnectionPinId(targetId, targetPortId) : DEFAULT_PIN_CLASS_ID
        );

        const existingConnRef = edgeRefs[link.id];
        const connRef = existingConnRef ?? new this.avoidInstance.ConnRef(this.avoidRouter);

        connRef.setSourceEndpoint(sourceConnEnd);
        connRef.setDestEndpoint(targetConnEnd);

        if (existingConnRef) {
            // It was already created, we just updated the endpoints.
            return connRef;
        }

        // Note: we do not assign the connRef's `id` to the JointJS link,
        // since libavoid-js (the underlying WASM library) does not behave correctly when a connRef is
        // added-removed-added with the same `id`. Instead, we keep track
        // of the mapping using the connRef's raw pointer (`connRef.g`).
        edgeRefs[link.id] = connRef;
        // @ts-expect-error do not defined in the type definition, but it is present in the actual object
        this.linksByPointer[connRef.g] = link;
        connRef.setCallback(this.onAvoidConnectorChange, connRef);

        return connRef;
    }

    deleteConnector(link: dia.Link): void {
        const connRef = this.edgeRefs[link.id];
        if (!connRef) return;
        this.avoidRouter.deleteConnector(connRef);
        // @ts-expect-error do not defined in the type definition, but it is present in the actual object
        delete this.linksByPointer[connRef.g];
        delete this.edgeRefs[link.id];
    }

    deleteShape(element: dia.Element): void {
        const shapeRef = this.shapeRefs[element.id];
        if (!shapeRef) return;
        this.avoidRouter.deleteShape(shapeRef);
        delete this.shapeRefs[element.id];
    }

    private routeLinkByPointer(connRefPointer: number): void {
        const link = this.linksByPointer[connRefPointer];
        if (!link) return;
        // triggers link view update
        link.attr('__avoidRouter', Date.now(), { avoidRouter: true });
    }

    // Updates every shape and connector, then routes all links.
    routeAll(): void {
        const { graph, avoidRouter } = this;
        graph.getElements().forEach((element) => this.updateShape(element));
        graph.getLinks().filter((link) => this.isAvoidRoutedLink(link)).forEach((link) => this.updateConnector(link));
        avoidRouter.processTransaction();
    }

    private isAvoidRoutedLink(link: dia.Link): boolean {
        return link.router() === avoid;
    }

    private onCellRemoved(cell: dia.Cell): void {
        if (cell.isElement()) {
            this.deleteShape(cell);
        } else if (cell.isLink()) {
            this.deleteConnector(cell);
        }
        this.avoidRouter.processTransaction();
    }

    private onCellAdded(cell: dia.Cell): void {
        if (cell.isElement()) {
            this.updateShape(cell);
        } else if (cell.isLink() && this.isAvoidRoutedLink(cell)) {
            this.updateConnector(cell);
        }
        this.avoidRouter.processTransaction();
    }

    private onCellChanged(cell: dia.Cell, opt: dia.Cell.Options & { avoidRouter?: boolean }): void {
        if (opt.avoidRouter) return;

        let needsRerouting = false;

        if ('source' in cell.changed || 'target' in cell.changed) {
            if (!cell.isLink() || !this.isAvoidRoutedLink(cell)) return;
            this.updateConnector(cell);
            needsRerouting = true;
        }

        if ('position' in cell.changed || 'size' in cell.changed) {
            if (!cell.isElement()) return;
            this.updateShape(cell);
            needsRerouting = true;
        }

        if (this.commitTransactions && needsRerouting) {
            this.avoidRouter.processTransaction();
        }
    }

    private onGraphReset(previousModels: dia.Cell[]): void {
        if (previousModels) {
            previousModels.forEach((cell) => {
                if (cell.isElement()) {
                    this.deleteShape(cell);
                } else if (cell.isLink() && this.isAvoidRoutedLink(cell)) {
                    this.deleteConnector(cell);
                }
            });
        }

        this.routeAll();
    }

    private getVerticesFromAvoidRoute(route: { size(): number; get_ps(index: number): dia.Point }): g.Point[] {
        const vertices: g.Point[] = [];
        for (let i = 1; i < route.size() - 1; i++) {
            const { x, y } = route.get_ps(i);
            vertices.push(new g.Point({ x, y }));
        }
        return vertices;
    }

    getRoute(link: dia.Link): AvoidRoute | undefined {
        const connRef = this.edgeRefs[link.id];
        if (!connRef) return;

        const route = connRef.displayRoute();
        const sourcePoint = new g.Point(route.get_ps(0));
        const targetPoint = new g.Point(route.get_ps(route.size() - 1));

        const vertices = this.getVerticesFromAvoidRoute(route);

        return {
            vertices,
            sourcePoint,
            targetPoint,
        };
    }
}
