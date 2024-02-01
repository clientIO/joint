import { dia } from '@joint/core';
import { Model, Function } from '@joint/decorators';
import svg from './Plus.svg';

interface PlusAttributes extends dia.Element.Attributes {
    offset: number;
}
@Model({
    attributes: {
        size: {
            width: 70,
            height: 70,
        },
        offset: 20,
    },
    template: svg,
})
export class Plus extends dia.Element<PlusAttributes> {
    @Function()
    data(): string {
        const { offset } = this;
        return `
        M ${offset} 0
        L calc(w - ${offset}) 0
        v 0 ${offset}
        h ${offset}
        V calc(h - ${offset})
        h ${-offset}
        v ${offset}
        H ${offset}
        v ${-offset}
        h ${-offset}
        V ${offset}
        H ${offset}
        z

    `;
    }

    set offset(value: number) {
        this.set('offset', value);
    }

    get offset(): number {
        const offset = this.get('offset') || 0;
        return Math.max(0, Math.min(offset, this.get('size').width / 2));
    }
}
