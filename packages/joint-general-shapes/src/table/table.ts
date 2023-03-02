import { dia } from '@joint/core';
import { Function, Model } from '@joint/decorators';
import svg from './table.svg';

interface TableAttributes extends dia.Element.Attributes {
    dividerX: number;
    dividerY: number;
}

@Model({
    attributes: {
        size: {
            width: 100,
            height: 100,
        },
        dividerX: 25,
        dividerY: 25,
    },
    template: svg,
})

export class Table extends dia.Element<TableAttributes> {
    @Function()
    data(): string {
        const { dividerX, dividerY } = this;
        return `
            M 0 0
            H calc(w)
            V calc(h)
            H 0
            Z
            M 0 ${dividerY}
            H calc(w)
            M ${dividerX} 0
            V calc(h)
        `;
    }

    get dividerX(): number {
        const dividerX = this.get('dividerX') || 0;

        return Math.max(0, Math.min(dividerX, this.get('size').width));
    }

    set dividerX(value: number) {
        this.set('dividerX', value);
    }

    get dividerY(): number {
        const dividerY = this.get('dividerY') || 0;

        return Math.max(0, Math.min(dividerY, this.get('size').height));
    }

    set dividerY(value: number) {
        this.set('dividerY', value);
    }

}
