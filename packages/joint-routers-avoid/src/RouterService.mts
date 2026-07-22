import { g, mvc } from '@joint/core';

import type { dia } from '@joint/core';
import type { ConnDirFlags } from 'libavoid-js';
import type { Connector, Provider, Shape } from './providers/Provider.mjs';
import { avoid } from './router.mjs';

const DEFAULT_PIN_CLASS_ID = 1;

export interface RouterServiceOptions {
    paper: dia.Paper;
    provider: Provider;
    margin?: number;
}

export class RouterService {

    private static instances: Map<dia.Paper, RouterService> = new Map();

    static getInstance(paper: dia.Paper): RouterService | undefined {
        return RouterService.instances.get(paper);
    }

    static create(options: RouterServiceOptions): void {
        this.instances.set(options.paper, new RouterService(options));
    }

    private readonly paper: dia.Paper;
    private readonly provider: Provider;
    private readonly pinIds: Record<string, number> = {};
    private readonly connectorRoutes: Record<dia.Cell.ID, dia.Point[]> = {};

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
        this.paper = options.paper;
        this.margin = options.margin ?? 0;
        this.provider = options.provider;

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
        listener.listenTo(this.paper.model, {
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

    private routeLink(linkId: dia.Cell.ID, points: dia.Point[]): void {
        const link = this.paper.model.getCell(linkId) as dia.Link | undefined;
        if (!link) return;
        this.connectorRoutes[linkId] = points;
        link.prop('__avoidRouter/reroute', false, { avoidRouter: true });
        link.prop('__avoidRouter/points', points, { avoidRouter: true });
        const cellView = this.paper.getCellView(link);
        if (cellView && this.paper.isCellVisible(link)) {
            cellView.update();
        }
    }

    private isAvoidRoutedLink(link: dia.Link): boolean {
        return link.router() === avoid;
    }

    private onCellRemoved(cell: dia.Cell): void {
        if (cell.isElement()) {
            this.provider.deleteShape(cell.id);
        } else if (cell.isLink() && this.isAvoidRoutedLink(cell)) {
            this.provider.deleteConnector(cell.id);
        }
    }

    private onCellAdded(cell: dia.Cell): void {
        if (cell.isElement()) {
            this.provider.updateShape(this.getAvoidShape(cell));
        } else if (cell.isLink() && this.isAvoidRoutedLink(cell)) {
            this.provider.updateConnector(this.getAvoidConnector(cell));
        }
    }

    private onCellChanged(cell: dia.Cell, opt: dia.Cell.Options & { avoidRouter?: boolean }): void {
        if (opt.avoidRouter) return;

        if ('source' in cell.changed || 'target' in cell.changed) {
            if (!cell.isLink() || !this.isAvoidRoutedLink(cell)) return;
            cell.prop('__avoidRouter/reroute', true, { avoidRouter: true });
            this.provider.updateConnector(this.getAvoidConnector(cell));
        }

        if ('position' in cell.changed || 'size' in cell.changed) {
            if (!cell.isElement()) return;
            this.paper.model.getConnectedLinks(cell).forEach((link) => {
                if (this.isAvoidRoutedLink(link)) {
                    link.prop('__avoidRouter/reroute', true, { avoidRouter: true });
                }
            });
            this.provider.updateShape(this.getAvoidShape(cell));
        }
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

    private onGraphReset(previousModels: dia.Cell[]): void {
        if (previousModels) {
            previousModels.forEach((cell) => {
                if (cell.isElement()) {
                    this.provider.deleteShape(cell.id, false);
                } else if (cell.isLink() && this.isAvoidRoutedLink(cell)) {
                    this.provider.deleteConnector(cell.id, false);
                }
            });
        }

        this.provider.updateGraph(
            this.paper.model.getElements().map((element) => this.getAvoidShape(element)),
            this.paper.model.getLinks().filter((link) => this.isAvoidRoutedLink(link)).map((link) => this.getAvoidConnector(link))
        );
    }
}
