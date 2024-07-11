import { AvoidLib } from 'libavoid-js';
import { g, util, mvc } from '@joint/core';

const defaultPin = 1;

export class AvoidRouter {
    static async load() {
        // Note: load() accepts a filepath to the libavoid.wasm file.
        await AvoidLib.load();
    }

    constructor(graph, options = {}) {
        const Avoid = AvoidLib.getInstance();

        this.graph = graph;

        this.connDirections = {
            top: Avoid.ConnDirUp,
            right: Avoid.ConnDirRight,
            bottom: Avoid.ConnDirDown,
            left: Avoid.ConnDirLeft,
            all: Avoid.ConnDirAll,
        };

        this.shapeRefs = {
            // [element.id]: shapeRef
        };

        this.edgeRefs = {
            // [link.id]: connRef
        };

        // We use this structure to map the JointJS port id
        // to the libavoid pin id (which must be a number)
        this.pinIds = {
            // [element.id + port.id]: number
        }


        // libavoid-js seems not to work properly
        // if you add-remove-add a connRef with a same `id`.
        // That's the reason we do not assign set connRef's `id`
        // to JointJS link and let the libavoid to generate an `id`.
        // We use this structure to find JointJS link from a pointer.
        // (i.e. we can not use `connRef.id()` as explained above and
        // we don't want to create a new function bind to a specific link
        // for every connRef callback (see `avoidConnectorCallback`)
        this.linksByPointer = {
            // [connRef.g]: link
        };

        this.avoidConnectorCallback = this.onAvoidConnectorChange.bind(this);

        this.id = 100000;

        this.createAvoidRouter(options);
    }

    createAvoidRouter(options = {}) {
        const {
            shapeBufferDistance = 0,
            portOverflow = 0,
            idealNudgingDistance = 10,
        } = options;

        this.margin = shapeBufferDistance;
        this.portOverflow = portOverflow;

        const Avoid = AvoidLib.getInstance();

        const router = new Avoid.Router(Avoid.OrthogonalRouting);

        // Avoid Router Parameter

        /*
        This parameter defines the spacing distance that will be used for nudging
        apart overlapping corners and line segments of connectors.

        By default, this distance is set to a value of 4.
        */
        router.setRoutingParameter(
            Avoid.idealNudgingDistance,
            idealNudgingDistance
        );

        /*
        This parameter defines the spacing distance that will be added to the sides of each shape
        when determining obstacle sizes for routing. This controls how closely connectors pass shapes,
        and can be used to prevent connectors overlapping with shape boundaries.

        By default, this distance is set to a value of 0.
        */
        router.setRoutingParameter(
            Avoid.shapeBufferDistance,
            shapeBufferDistance
        );

        // Avoid Router Options

        /*
        This option can be used to control whether collinear line segments that touch
        just at their ends will be nudged apart. The overlap will usually be resolved
        in the other dimension, so this is not usually required.

        Defaults to false.

        Note: If enabled it moves the anchor points of links even for single links.
        It's not suitable for links connected to ports.
        */
        router.setRoutingOption(
            Avoid.nudgeOrthogonalTouchingColinearSegments,
            false
        );

        /*
        This option can be used to control whether the router performs a preprocessing step
        before orthogonal nudging where is tries to unify segments and centre them in free space.
        This generally results in better quality ordering and nudging.

        Defaults to true.

        You may wish to turn this off for large examples where it can be very slow
        and will make little difference.
        */
        router.setRoutingOption(
            Avoid.performUnifyingNudgingPreprocessingStep,
            true
        );

        router.setRoutingOption(Avoid.nudgeSharedPathsWithCommonEndPoint, true);

        router.setRoutingOption(
            Avoid.nudgeOrthogonalSegmentsConnectedToShapes,
            true
        );

        this.avoidRouter = router;
    }

    getAvoidRectFromElement(element) {
        const Avoid = AvoidLib.getInstance();
        const { x, y, width, height } = element.getBBox();
        return new Avoid.Rectangle(
            new Avoid.Point(x, y),
            new Avoid.Point(x + width, y + height)
        );
    }

    getVerticesFromAvoidRoute(route) {
        const vertices = [];
        for (let i = 1; i < route.size() - 1; i++) {
            const { x, y } = route.get_ps(i);
            vertices.push({ x, y });
        }
        return vertices;
    }

    updateShape(element) {
        const Avoid = AvoidLib.getInstance();
        const { shapeRefs, avoidRouter } = this;
        const shapeRect = this.getAvoidRectFromElement(element);
        if (shapeRefs[element.id]) {
            // Only update the position and size of the shape.
            const shapeRef = shapeRefs[element.id];
            avoidRouter.moveShape(shapeRef, shapeRect);
            return;
        }

        const shapeRef = new Avoid.ShapeRef(avoidRouter, shapeRect);

        shapeRefs[element.id] = shapeRef;

        const centerPin = new Avoid.ShapeConnectionPin(
            shapeRef,
            defaultPin, // one central pin for each shape
            0.5,
            0.5,
            true,
            0,
            Avoid.ConnDirAll // All directions
        );
        centerPin.setExclusive(false);

        // Note: we could add more pins. For example, we could add pins
        // to each element's side. This way, we could route links to
        // specific sides of the element.

        // Add pins to each port of the element.
        element.getPortGroupNames().forEach((group) => {
            const portsPositions = element.getPortsPositions(group);
            const { width, height } = element.size();
            const rect = new g.Rect(0, 0, width, height);
            Object.keys(portsPositions).forEach((portId) => {
                const { x, y } = portsPositions[portId];
                const side = rect.sideNearestToPoint({ x, y });
                const pin = new Avoid.ShapeConnectionPin(
                    shapeRef,
                    this.getConnectionPinId(element.id, portId),
                    x / width,
                    y / height,
                    true,
                    // x, y, false, (support offset on ports)
                    0,
                    this.connDirections[side]
                );
                pin.setExclusive(false);
            });
        });
    }

    // This method is used to map the JointJS port id to the libavoid pin id.
    getConnectionPinId(elementId, portId) {
        // `libavoid-js` requires the pin id to be a number.
        // Note: It does not have to be unique across the whole diagram, just
        // unique for the shape (but we use unique id across the whole diagram).
        const pinKey = `${elementId}:${portId}`;
        if (pinKey in this.pinIds) return this.pinIds[pinKey];
        const pinId = this.id++;
        this.pinIds[pinKey] = pinId;
        return pinId;
    }

    updateConnector(link) {
        const Avoid = AvoidLib.getInstance();
        const { shapeRefs, edgeRefs } = this;

        const { id: sourceId, port: sourcePortId = null } = link.source();
        const { id: targetId, port: targetPortId = null } = link.target();

        if (!sourceId || !targetId) {
            // It is possible to have a link without source or target in libavoid.
            // But we do not support it in this example.
            this.deleteConnector(link);
            return null;
        }

        let connRef;

        const sourceConnEnd = new Avoid.ConnEnd(
            shapeRefs[sourceId],
            sourcePortId ? this.getConnectionPinId(sourceId, sourcePortId) : defaultPin
        );
        const targetConnEnd = new Avoid.ConnEnd(
            shapeRefs[targetId],
            targetPortId ? this.getConnectionPinId(targetId, targetPortId) : defaultPin
        );

        if (edgeRefs[link.id]) {
            connRef = edgeRefs[link.id];
        } else {
            connRef = new Avoid.ConnRef(this.avoidRouter);
            this.linksByPointer[connRef.g] = link;
        }

        connRef.setSourceEndpoint(sourceConnEnd);
        connRef.setDestEndpoint(targetConnEnd);

        if (edgeRefs[link.id]) {
            // It was already created, we just updated
            // the source and target endpoints.
            return connRef;
        }

        edgeRefs[link.id] = connRef;

        connRef.setCallback(this.avoidConnectorCallback, connRef);

        // Custom vertices (checkpoints) are not supported yet.
        // const checkpoint1 = new Avoid.Checkpoint(
        //     new Avoid.Point(400, 200),
        // );
        // Method does not exists in libavoid-js v4.
        // connRef.setRoutingCheckpoints([checkpoint1]);

        return connRef;
    }

    deleteConnector(link) {
        const connRef = this.edgeRefs[link.id];
        if (!connRef) return;
        this.avoidRouter.deleteConnector(connRef);
        delete this.linksByPointer[connRef.g];
        delete this.edgeRefs[link.id];
    }

    deleteShape(element) {
        const shapeRef = this.shapeRefs[element.id];
        if (!shapeRef) return;
        this.avoidRouter.deleteShape(shapeRef);
        delete this.shapeRefs[element.id];
    }

    getLinkAnchorDelta(element, portId, point) {
        let anchorPosition;
        const bbox = element.getBBox();
        if (portId) {
            const port = element.getPort(portId);
            const portPosition = element.getPortsPositions(port.group)[portId];
            anchorPosition = element.position().offset(portPosition);
        } else {
            anchorPosition = bbox.center();
        }
        return point.difference(anchorPosition);
    }

    // This method is used to route a link.
    routeLink(link) {
        const connRef = this.edgeRefs[link.id];
        if (!connRef) return;

        const route = connRef.displayRoute();
        const sourcePoint = new g.Point(route.get_ps(0));
        const targetPoint = new g.Point(route.get_ps(route.size() - 1));

        const { id: sourceId, port: sourcePortId = null } = link.source();
        const { id: targetId, port: targetPortId = null } = link.target();

        const sourceElement = link.getSourceElement();
        const targetElement = link.getTargetElement();
        const sourceAnchorDelta = this.getLinkAnchorDelta(
            sourceElement,
            sourcePortId,
            sourcePoint
        );
        const targetAnchorDelta = this.getLinkAnchorDelta(
            targetElement,
            targetPortId,
            targetPoint
        );

        const linkAttributes = {
            source: {
                id: sourceId,
                port: sourcePortId || null,
                anchor: {
                    name: 'modelCenter',
                },
            },
            target: {
                id: targetId,
                port: targetPortId || null,
                anchor: {
                    name: 'modelCenter',
                },
            },
        };

        if (
            this.isRouteValid(
                route,
                sourceElement,
                targetElement,
                sourcePortId,
                targetPortId
            )
        ) {
            // We have a valid route.
            // We update the link with the route.
            linkAttributes.source.anchor.args = {
                dx: sourceAnchorDelta.x,
                dy: sourceAnchorDelta.y,
            };
            linkAttributes.target.anchor.args = {
                dx: targetAnchorDelta.x,
                dy: targetAnchorDelta.y,
            };
            linkAttributes.vertices = this.getVerticesFromAvoidRoute(route);
            linkAttributes.router = null;
        } else {
            // Fallback route (we use the `rightAngle` router for the fallback route)
            // The right angle automatic directions works the same way as in this example.
            linkAttributes.vertices = [];
            linkAttributes.router = {
                name: 'rightAngle',
                args: {
                    // The margin is computed from the border of the port in case
                    // of the `rightAngle` router.
                    // In the case of libavoid, it is computed from the center
                    // of the port.
                    // Note: it depends on what portion of the port is overlapping
                    // the element. In this example, it is exactly the half of the port.
                    margin: this.margin - this.portOverflow,
                },
            };
        }

        link.set(linkAttributes, { avoidRouter: true });
    }

    // This method is used to route links
    routeAll() {
        const { graph, avoidRouter } = this;
        graph.getElements().forEach((element) => this.updateShape(element));
        graph.getLinks().forEach((link) => this.updateConnector(link));
        avoidRouter.processTransaction();
    }

    // This method is used to reset the link to a straight line
    // (if the link is not connected to an element).
    resetLink(link) {
        const newAttributes = util.cloneDeep(link.attributes);
        newAttributes.vertices = [];
        newAttributes.router = null;
        delete newAttributes.source.anchor;
        delete newAttributes.target.anchor;
        link.set(newAttributes, { avoidRouter: true });
    }

    // Start listening to the graph changes and automatically
    // update the libavoid router.
    addGraphListeners() {
        this.removeGraphListeners();

        const listener = new mvc.Listener();
        listener.listenTo(this.graph, {
            remove: (cell) => this.onCellRemoved(cell),
            add: (cell) => this.onCellAdded(cell),
            change: (cell, opt) => this.onCellChanged(cell, opt),
        });

        this.graphListener = listener;
    }

    // Stop listening to the graph changes.
    removeGraphListeners() {
        this.graphListener?.stopListening();
        delete this.graphListener;
    }

    onCellRemoved(cell) {
        if (cell.isElement()) {
            this.deleteShape(cell);
        } else {
            this.deleteConnector(cell);
        }
        this.avoidRouter.processTransaction();
    }

    onCellAdded(cell) {
        if (cell.isElement()) {
            this.updateShape(cell);
        } else {
            this.updateConnector(cell);
        }
        this.avoidRouter.processTransaction();
    }

    onCellChanged(cell, opt) {
        if (opt.avoidRouter) return;
        let needsRerouting = false;
        if ('source' in cell.changed || 'target' in cell.changed) {
            if (!cell.isLink()) return;
            if (!this.updateConnector(cell)) {
                // The link is routed with libavoid,
                // we reset the link to a straight line.
                this.resetLink(cell);
            }
            needsRerouting = true;
        }
        if ('position' in cell.changed || 'size' in cell.changed) {
            if (!cell.isElement()) return;
            this.updateShape(cell);
            // TODO: we should move the pins if their position is
            // not defined proportionally to the shape.
            needsRerouting = true;
        }
        // TODO:
        // if ("ports" in cell.changed) {}
        if (needsRerouting) {
            this.avoidRouter.processTransaction();
        }
    }

    onAvoidConnectorChange(connRefPtr) {
        const link = this.linksByPointer[connRefPtr];
        if (!link) return;
        this.routeLink(link);
    }

    // This method is used to check if the route is valid.
    // It is used to determine if we should use the libavoid route
    // or the rightAngle router.
    // Unfortunately, the libavoid does not provide a method to check
    // if the route is valid, so we must use heuristics.
    isRouteValid(
        route,
        sourceElement,
        targetElement,
        sourcePortId,
        targetPortId
    ) {
        const size = route.size();
        if (size > 2) {
            // when the libavoid route has more than 2 points,
            // we consider it valid.
            return true;
        }

        const sourcePs = route.get_ps(0);
        const targetPs = route.get_ps(size - 1);
        if (sourcePs.x !== targetPs.x && sourcePs.y !== targetPs.y) {
            // The route is not straight.
            return false;
        }

        const margin = this.margin;

        if (
            sourcePortId &&
            targetElement.getBBox().inflate(margin).containsPoint(sourcePs)
        ) {
            // The source point is inside the target element.
            return false;
        }

        if (
            targetPortId &&
            sourceElement.getBBox().inflate(margin).containsPoint(targetPs)
        ) {
            // The target point is inside the source element.
            return false;
        }

        return true;
    }
}
