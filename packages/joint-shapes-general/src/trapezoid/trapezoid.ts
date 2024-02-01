import { dia } from '@joint/core';
import { Model, Function } from '@joint/decorators';
import svg from './trapezoid.svg';

interface TrapezoidAttributes extends dia.Element.Attributes {
    offset: number;
}

@Model({
    attributes: {
        size: {
            width: 120,
            height: 60
        },
        offset: 20
    },
    template: svg,
})

export class Trapezoid extends dia.Element<TrapezoidAttributes> {
    @Function()
    data(): string {
        const { offset } = this;

        return `
            M 0 calc(h)
            L calc(w) calc(h)
            L calc(w - ${offset}) 0
            L ${offset} 0
            Z
        `
    }

    set offset(value: number) {
        this.set('offset', value);
    }

    get offset(): number {
        const offset = this.get('offset') || 0;
        return Math.max(0, Math.min(offset, this.get('size').width / 2));
    }
}
