import { Model, Function } from '@joint/decorators';
import { dia } from '@joint/core';
import svg from './hexagon.svg';

class HexagonAttributes implements dia.Element.Attributes {
    offset: number;
}

@Model({
    attributes: {
        size: {
            width: 90,
            height: 60,
        },
        offset: 20
    },
    template: svg
})

export class Hexagon extends dia.Element<HexagonAttributes> {
    @Function()
    data(): string {
        const { offset } = this;

        return `
            M 0 calc(0.5 * h)
            L ${offset} calc(h)
            L calc(w-${offset}) calc(h)
            L calc(w) calc(0.5 * h)
            L calc(w-${offset}) 0
            L ${offset} 0
            Z
        `
    }

    set offset(value: number) {
        this.set('offset', value);
    }

    get offset(): number {
        const offset = this.get('offset') || 0;
        return Math.max(0, Math.min(offset, this.size().width / 2));
    }
}
