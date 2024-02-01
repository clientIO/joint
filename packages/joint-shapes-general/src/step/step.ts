import { Model, Function } from '@joint/decorators';
import { dia } from '@joint/core';
import svg from './step.svg';

interface StepAttributes extends dia.Element.Attributes {
    offset: number;
}

@Model({
    attributes: {
        size: {
            height: 60,
            width: 90
        },
        offset: 20
    },
    template: svg
})

export class Step extends dia.Element<StepAttributes> {
    @Function()
    data(): string {
        const { offset } = this;

        return `
            M 0 0
            L ${offset} calc(0.5 * h)
            L 0 calc(h)
            L calc(w - ${offset}) calc(h)
            L calc(w) calc(0.5 * h)
            L calc(w - ${offset}) 0
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
