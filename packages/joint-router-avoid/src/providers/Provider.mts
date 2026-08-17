import { mvc } from '@joint/core';
import type { dia } from '@joint/core';
import type { Avoid } from 'libavoid-js';

/**
 * Options used to configure the underlying avoid router instance,
 * regardless of whether it runs on the main thread or inside a Worker.
 */
export interface ProviderOptions {
    /** Spacing distance added to the sides of each shape when determining obstacle sizes for routing. */
    shapeBufferDistance?: number;
    /** Spacing distance used for nudging apart overlapping corners and line segments of connectors. */
    idealNudgingDistance?: number;
}

/**
 * A connection point on a {@link Shape}, corresponding to a JointJS port
 * (or the shape's default connection pin when there is no port).
 */
export interface Pin {
    /** Unique id of the pin within its shape. */
    id: number;
    /** Horizontal position of the pin, expressed as a fraction (0-1) of the shape's width. */
    x: number;
    /** Vertical position of the pin, expressed as a fraction (0-1) of the shape's height. */
    y: number;
    /** Bitmask of the directions from which a connector may approach this pin. */
    connectionDirection: number;
}

/**
 * The avoid-router representation of a JointJS element: its id, bounding
 * box, and the pins that connectors may attach to.
 */
export interface Shape {
    /** Id of the JointJS element this shape represents. */
    id: dia.Cell.ID;
    /** Bounding box of the element, used as an obstacle by the router. */
    bbox: dia.BBox;
    /** Connection pins available on this shape. */
    pins: Pin[];
}

/**
 * The avoid-router representation of a JointJS link: the shapes/pins its
 * source and target ends connect to.
 */
export interface Connector {
    /** Id of the JointJS link this connector represents. */
    id: dia.Cell.ID;
    /** Id of the source shape, or `undefined` if the source end is not connected to an element. */
    sourceId?: dia.Cell.ID;
    /** Id of the pin on the source shape that the connector attaches to. */
    sourcePinId?: number;
    /** Id of the target shape, or `undefined` if the target end is not connected to an element. */
    targetId?: dia.Cell.ID;
    /** Id of the pin on the target shape that the connector attaches to. */
    targetPinId?: number;
}

/** Events emitted by a {@link Provider}. */
export interface ProviderEventMap {
    /**
     * Emitted whenever avoid recomputes the route of a connector.
     *
     * @param connectorId - Id of the link whose route changed.
     * @param points - The new route, including the source and target points.
     */
    'connector:changed': (connectorId: dia.Cell.ID, points: dia.Point[]) => void;
    /** Emitted whenever the provider has finished processing current changes. */
    'processed': () => void;
}

/** Typed `on()` for a {@link Provider}, keyed to its {@link ProviderEventMap}. */
export interface ProviderEvents_On<BaseT> {
    <T extends BaseT, K extends keyof ProviderEventMap>(this: T, eventName: K, callback: ProviderEventMap[K], context?: unknown): T;
    <T extends BaseT>(this: T, eventMap: Partial<ProviderEventMap>, context?: unknown): T;
}

/** Typed `trigger()` for a {@link Provider}, keyed to its {@link ProviderEventMap}. */
export interface ProviderEvents_Trigger<BaseT> {
    <T extends BaseT, K extends keyof ProviderEventMap>(this: T, eventName: K, ...args: Parameters<ProviderEventMap[K]>): T;
}

/**
 * Abstracts the underlying avoid router so {@link RouterService} can drive
 * it the same way whether it runs on the main thread ({@link MainThreadProvider})
 * or inside a Worker ({@link WorkerProvider}). Emits `connector:changed`
 * (see {@link ProviderEventMap}) whenever avoid recomputes a connector's route.
 */
export abstract class Provider {

    // Provided by the `mvc.Events` mixin applied below the class body.
    declare on: ProviderEvents_On<Provider>;
    declare off: mvc.Events_Off<Provider>;
    declare trigger: ProviderEvents_Trigger<Provider>;

    /**
     * Initializes the underlying avoid router with the given options.
     * Must be called, and its returned promise awaited, before any other
     * method on this provider is used.
     *
     * @param options - Configuration for the underlying avoid router instance.
     */
    abstract init(options: ProviderOptions): Promise<void>;

    /**
     * Creates or updates the avoid shape for a JointJS element.
     *
     * @param shape - The shape to create or update.
     */
    abstract setShape(shape: Shape): void;

    /**
     * Creates or updates the avoid connector for a JointJS link.
     *
     * @param connector - The connector to create or update.
     */
    abstract setConnector(connector: Connector): void;

    /**
     * Removes the avoid shape for a JointJS element.
     *
     * @param shapeId - Id of the shape to remove.
     */
    abstract deleteShape(shapeId: dia.Cell.ID): void;

    /**
     * Removes the avoid connector for a JointJS link.
     *
     * @param connectorId - Id of the connector to remove.
     */
    abstract deleteConnector(connectorId: dia.Cell.ID): void;

    /**
     * Replaces the entire set of shapes and connectors known to the
     * underlying avoid router in a single transaction.
     *
     * @param shapes - The full set of shapes that should exist after the sync.
     * @param connectors - The full set of connectors that should exist after the sync.
     */
    abstract sync(shapes: Shape[], connectors: Connector[]): Promise<void>;

    /**
     * Returns the underlying `Avoid` WASM module instance.
     *
     * @returns The avoid instance driving this provider.
     * @throws If the provider does not expose the instance (e.g. {@link WorkerProvider}, which runs inside a Worker thread).
     */
    abstract getAvoidInstance(): Avoid;

    /**
     * Checks whether a connector with the given id currently exists.
     *
     * @param connectorId - Id of the connector to look up.
     * @returns `true` if the connector exists.
     */
    abstract hasConnector(connectorId: dia.Cell.ID): boolean;

    /**
     * Checks whether a shape with the given id currently exists.
     *
     * @param shapeId - Id of the shape to look up.
     * @returns `true` if the shape exists.
     */
    abstract hasShape(shapeId: dia.Cell.ID): boolean;

    /** Releases any resources held by the provider (e.g. terminates a Worker thread). */
    abstract destroy(): void;
}

Object.assign(Provider.prototype, mvc.Events);
