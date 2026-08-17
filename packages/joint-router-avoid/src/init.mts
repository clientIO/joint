import type { dia } from '@joint/core';
import { AvoidLib } from 'libavoid-js';
import { RouterService } from './RouterService.mjs';
import type { UnroutableLinkCallback, TrackElementCallback, TrackLinkCallback, SetRouteAttributesCallback, RouterServiceOptions } from './RouterService.mjs';
import { MainThreadProvider } from './providers/MainThreadProvider.mjs';
import { WorkerProvider } from './providers/WorkerProvider.mjs';

let loadAvoidPromise: Promise<void> | null = null;

const defaultShapeBufferDistance = 10;
const defaultIdealNudgingDistance = 5;
const defaultUpdateDebounceTime = 100;

/**
 * Loads the avoid WASM module on the main thread. Safe to call multiple
 * times - subsequent calls return the same in-flight/resolved promise -
 * and is also called automatically by {@link initAvoidRouter} if needed.
 *
 * @param filePath - Path to the avoid WASM binary. Defaults to the library's own resolution of the asset.
 * @returns A promise that resolves once the module has loaded.
 */
export function loadAvoidRouter(filePath?: string): Promise<void> {
    if (!loadAvoidPromise) {
        loadAvoidPromise = AvoidLib.load(filePath).catch((error) => {
            loadAvoidPromise = null;
            throw error;
        });
    }
    return loadAvoidPromise;
}

/** Options used to configure {@link initAvoidRouter}. */
export interface InitAvoidOptions {
    /** Determines which links to track for routing. Defaults to tracking every link. */
    trackLink?: TrackLinkCallback;
    /** Determines which elements to track for routing. Defaults to tracking every element as obstacle. */
    trackElement?: TrackElementCallback;
    /** Gives the consumer first refusal on links avoid cannot route. Defaults to always falling back to the built-in `rightAngle` route. */
    interceptUnroutableLink?: UnroutableLinkCallback;
    /** Overrides how computed route attributes are applied to a link. Defaults to calling `link.set()` directly. */
    setRouteAttributes?: SetRouteAttributesCallback;
    /** Name of the `opt` flag set on `link.set()` calls made by this instance, so its own changes can be told apart from the consumer's. Defaults to `'avoidRouter'`. */
    changeFlag?: string;
    /** Spacing distance added to the sides of each shape when determining obstacle sizes for routing, and used as the {@link RouterService}'s fallback-route margin. Defaults to `10`. */
    shapeBufferDistance?: number;
    /** Spacing distance used for nudging apart overlapping corners and line segments of connectors. Defaults to `5`. */
    idealNudgingDistance?: number;
    /** Runs the avoid router inside a Worker thread instead of the main thread. Defaults to `false`. */
    useWorker?: boolean;
    /** Milliseconds to debounce queued messages by when `useWorker` is `true`. Defaults to `100`. */
    workerUpdateDebounceTime?: number;
    /** Path to the avoid WASM binary. Defaults to the library's own resolution of the asset. */
    libavoidFilePath?: string;
}

/**
 * Loads avoid (if needed) and creates a {@link RouterService} for `graph`,
 * using either a main-thread or Worker-based {@link Provider} depending on
 * `options.useWorker`. The returned `RouterService` is not started - call
 * its `start()` to begin keeping `graph`'s links continuously routed via
 * libavoid, or use `routeAll()`/`routeSubgraph()` for a one-shot routing
 * pass instead.
 *
 * @param graph - The graph to route.
 * @param options - Configuration for the avoid router and the resulting {@link RouterService}.
 * @returns A promise resolving to the `RouterService` instance for `graph`.
 */
export async function initAvoidRouter(graph: dia.Graph, options: InitAvoidOptions = {}): Promise<RouterService> {
    if (loadAvoidPromise) {
        await loadAvoidPromise;
    } else if (!AvoidLib.avoidLib) {
        await loadAvoidRouter(options.libavoidFilePath);
    }

    const provider = options.useWorker ? new WorkerProvider() : new MainThreadProvider();

    const shapeBufferDistance = options.shapeBufferDistance ?? defaultShapeBufferDistance;
    const idealNudgingDistance = options.idealNudgingDistance ?? defaultIdealNudgingDistance;
    const updateDebounceTime = options.workerUpdateDebounceTime ?? defaultUpdateDebounceTime;

    if (provider instanceof WorkerProvider) {
        await provider.init({
            shapeBufferDistance: shapeBufferDistance,
            idealNudgingDistance: idealNudgingDistance,
            workerUpdateDebounceTime: updateDebounceTime,
            libavoidFilePath: options.libavoidFilePath
        });
    } else {
        await provider.init({
            shapeBufferDistance: shapeBufferDistance,
            idealNudgingDistance: idealNudgingDistance,
        });
    }

    const routerServiceOptions: RouterServiceOptions = {
        shapeBufferDistance,
        trackLink: options.trackLink,
        trackElement: options.trackElement,
        interceptUnroutableLink: options.interceptUnroutableLink,
        setRouteAttributes: options.setRouteAttributes,
        changeFlag: options.changeFlag,
    };

    const routerService = new RouterService(
        graph,
        provider,
        routerServiceOptions
    );

    return routerService;
}
