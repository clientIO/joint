import type { dia } from '@joint/core';
import { AvoidLib } from 'libavoid-js';
import { RouterService } from './RouterService.mjs';
import { MainThreadProvider } from './providers/MainThreadProvider.mjs';
import { WorkerProvider } from './providers/WorkerProvider.mjs';

async function load(): Promise<void> {
    await AvoidLib.load();
}

export const DEFAULT_PIN_CLASS_ID = 1;

export interface InitOptions {
    graph: dia.Graph;
    filterLink?: (link: dia.Link) => boolean;
    filterElement?: (element: dia.Element) => boolean;
    shapeBufferDistance?: number;
    idealNudgingDistance?: number;
    useWorker?: boolean;
    debounceTime?: number;
}

export async function init(options: InitOptions): Promise<RouterService> {
    await load();

    const provider = options.useWorker ? new WorkerProvider() : new MainThreadProvider();

    if (provider instanceof WorkerProvider) {
        await provider.init({
            shapeBufferDistance: options.shapeBufferDistance ?? 0,
            idealNudgingDistance: options.idealNudgingDistance ?? 10,
            debounceTime: options.debounceTime ?? 100,
        });
    } else {
        await provider.init({
            shapeBufferDistance: options.shapeBufferDistance ?? 0,
            idealNudgingDistance: options.idealNudgingDistance ?? 10,
        });
    }

    const routerService = RouterService.create({
        graph: options.graph,
        provider: provider,
        margin: options.shapeBufferDistance ?? 0,
        filterLink: options.filterLink,
        filterElement: options.filterElement
    });

    return routerService;
}
