import { dia } from '@joint/core';

export interface ViewOptions {
    namespace?: any;
    models: Array< { new(): dia.Cell }>
}

export function View(options: ViewOptions) {
    const { namespace, models } = options;
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
    }
}
