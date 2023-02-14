import { dia } from '@joint/core';
import { Model, Function } from '@joint/decorators';
import svg from './note.svg';

interface NoteAttributes extends dia.Element.Attributes {
    offset: number;
}

@Model({
    attributes: {
        size: {
            width: 100,
            height: 100,
        },
        offset: 20,
    },
    template: svg,
})
export class Note extends dia.Element<NoteAttributes> {

    @Function()
    sheetData(): string {
        const { offset } = this;
        return `
            M ${offset} 0
            H calc(w)
            V calc(h)
            H 0
            V ${offset}
            Z
        `;
    }

    @Function()
    cornerData(): string {
        const { offset } = this;
        return `
            M 0 ${offset}
            H ${offset}
            V 0
        `;
    }

    set offset(value: number) {
        this.set('offset', value);
    }

    get offset(): number {
        const offset = this.get('offset') || 0;
        return Math.max(0, Math.min(offset, this.get('size').width));
    }
}
