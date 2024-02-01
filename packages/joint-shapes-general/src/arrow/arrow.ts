//@ts-nocheck
import { dia } from '@joint/core';
import { Model, Function } from '@joint/decorators';
import svg from './Arrow.svg';

interface ArrowAttributes extends dia.Element.Attributes {
    arrowHeight: number;
    thickness: number;
}

@Model({
    attributes: {
        size: {
            width: 100,
            height: 100,
        },
        arrowHeight: 33,
        thickness: 33,
    },
    template: svg,
})
export class Arrow extends dia.Element<ArrowAttributes> {
    @Function()
    data(): string {
        const { arrowHeight, thickness } = this;
        return `
                M calc(w-${arrowHeight}) 0
                L calc(w) calc(0.5*h)
                L calc(w -${arrowHeight})  calc(h)
                v -calc(h/2 - ${thickness / 2})
                H 0
                v -${thickness}
                H calc(w- ${arrowHeight})
                z
        `;
    }

    set arrowHeight(value: number) {
        this.set('arrowHeight', value);
    }

    get arrowHeight(): number {
        const arrowHeight = this.get('arrowHeight') || 0;
        return Math.max(0, Math.min(arrowHeight, this.get('size').width));
    }
    set thickness(value: number) {
        this.set('thickness', value);
    }

    get thickness(): number {
        const thickness = this.get('thickness') || 0;
        return Math.max(0, Math.min(thickness, this.get('size').height));
    }
}
