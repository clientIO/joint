import type { dia } from '@joint/core';
import { AvoidLib } from 'libavoid-js';
import { RouterService } from './RouterService.mjs';
import { MainThreadProvider } from './providers/MainThreadProvider.mjs';

async function load(): Promise<void> {
    await AvoidLib.load();
}

export const DEFAULT_PIN_CLASS_ID = 1;

export interface InitOptions {
    graph: dia.Graph;
    shapeBufferDistance?: number;
    idealNudgingDistance?: number;
    commitTransactions?: boolean;
}

export async function init(options: InitOptions): Promise<void> {
    await load();

    const provider = new MainThreadProvider();
    await provider.init({
        shapeBufferDistance: options.shapeBufferDistance ?? 0,
        idealNudgingDistance: options.idealNudgingDistance ?? 10
    });

    RouterService.create({
        graph: options.graph,
        provider: provider,
        margin: options.shapeBufferDistance ?? 0,
    });
}

export async function initWorker(options: InitOptions): Promise<void> {

    const worker = new Worker(new URL('./worker.mjs', import.meta.url), { type: 'module' });

    worker.postMessage([{
        command: 'init',
        options,
    }]);
}
