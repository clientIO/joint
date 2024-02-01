import { dia } from '@joint/core';
import { Function, Model } from '@joint/decorators';
import svg from './card.svg';

interface CubeAttributes extends dia.Element.Attributes {
    offset: number;
}

@Model({
    attributes: {
        size: {
            width: 100,
            height: 60,
        },
        offset: 20,
    },
    template: svg,
})

export class Card extends dia.Element<CubeAttributes> {
    @Function()
    data(): string {
        const { offset } = this;
        return `
            M ${offset} 0
            H calc(w)
            A calc(h / 2),${offset} 90 0 0 calc(w),calc(h)
            H ${offset}
            A calc(h / 2),${offset} 90 0 1 ${offset},0
            Z
        `;
    }

    get offset(): number {
        const offset = this.get('offset') || 0;

        return Math.max(0, Math.min(offset, this.get('size').width));
    }

    set offset(value: number) {
        this.set('offset', value);
    }

}
