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
    paper: dia.Paper;
    shapeBufferDistance?: number;
    idealNudgingDistance?: number;
    useWorker?: boolean;
}

export async function init(options: InitOptions): Promise<void> {
    await load();

    const provider = options.useWorker ? new WorkerProvider() : new MainThreadProvider();
    await provider.init({
        shapeBufferDistance: options.shapeBufferDistance ?? 0,
        idealNudgingDistance: options.idealNudgingDistance ?? 10
    });

    RouterService.create({
        paper: options.paper,
        provider: provider,
        margin: options.shapeBufferDistance ?? 0,
    });
}
