import type { dia } from '@joint/core';
import { AvoidLib } from 'libavoid-js';
import { RouterService } from './RouterService.mjs';
import { MainThreadProvider } from './providers/MainThreadProvider.mjs';
import { WorkerProvider } from './providers/WorkerProvider.mjs';

let loadAvoidPromise: Promise<void> | null = null;

export function loadAvoid(filePath?: string): Promise<void> {
    if (!loadAvoidPromise) {
        loadAvoidPromise = AvoidLib.load(filePath).catch((error) => {
            loadAvoidPromise = null;
            throw error;
        });
    }
    return loadAvoidPromise;
}

export const DEFAULT_PIN_CLASS_ID = 1;

export interface InitAvoidOptions {
    filterLink?: (link: dia.Link) => boolean;
    filterElement?: (element: dia.Element) => boolean;
    shapeBufferDistance?: number;
    idealNudgingDistance?: number;
    useWorker?: boolean;
    libraryFilePath?: string;
    debounceTime?: number;
}

export async function initAvoid(graph: dia.Graph, options: InitAvoidOptions): Promise<RouterService> {
    if (loadAvoidPromise) {
        await loadAvoidPromise;
    } else if (!AvoidLib.avoidLib) {
        await loadAvoid(options.libraryFilePath);
    }

    const provider = options.useWorker ? new WorkerProvider() : new MainThreadProvider();

    if (provider instanceof WorkerProvider) {
        await provider.init({
            shapeBufferDistance: options.shapeBufferDistance ?? 0,
            idealNudgingDistance: options.idealNudgingDistance ?? 10,
            debounceTime: options.debounceTime ?? 100,
            libraryFilePath: options.libraryFilePath
        });
    } else {
        await provider.init({
            shapeBufferDistance: options.shapeBufferDistance ?? 0,
            idealNudgingDistance: options.idealNudgingDistance ?? 10,
        });
    }

    const routerService = RouterService.create({
        graph: graph,
        provider: provider,
        margin: options.shapeBufferDistance ?? 0,
        filterLink: options.filterLink,
        filterElement: options.filterElement
    });

    return routerService;
}
