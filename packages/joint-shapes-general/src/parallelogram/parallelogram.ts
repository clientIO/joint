import { Model, Function } from '@joint/decorators';
import { dia } from '@joint/core';
import svg from './parallelogram.svg';

interface ParallelogramAttributes extends dia.Element.Attributes {
    offset: number;
}

@Model({
    attributes: {
        size: {
            width: 80,
            height: 60
        },
        offset: 10
    },
    template: svg,
})
export class Parallelogram extends dia.Element<ParallelogramAttributes> {
    @Function()
    data(): string {
        const { offset } = this

        return `
            M 0 calc(h)
            L ${offset} 0
            L calc(w) 0
            L calc(w-${offset}) calc(h)
            Z
        `
    }

    set offset(value: number) {
        this.set('offset', value);
    }

    get offset(): number {
        const offset = this.get('offset') || 0;
        return Math.max(0, Math.min(offset, this.get('size').width));
    }
}
