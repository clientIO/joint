import type { dia } from '@joint/core';

export interface ViewOptions {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    namespace?: any;
    models: Array< { new(): dia.Cell }>
}

export function View(options: ViewOptions) {
    const { namespace, models } = options;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return function Entity<Ctor extends { new(...args: any[]): dia.CellView }>(target: Ctor): Ctor {
        if (namespace) {
            namespace[target.name] = target;
            if (Array.isArray(models)) {
                models.forEach(modelClass => {
                    namespace[`${modelClass.name}View`] = target;
                });
            }
        }
        return target;
    };
}
