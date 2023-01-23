import { dia } from '@joint/core';
import { Model, Function } from '@joint/decorators';
import svg from './document.svg';

interface DocumentAttributes extends dia.Element.Attributes {
    offset: number;
}

@Model({
    attributes: {
        size: {
            width: 120,
            height: 50
        },
        offset: 20
    },
    template: svg
})
export class Document extends dia.Element<DocumentAttributes> {

    CP1_X_FACTOR: number;
    CP2_X_FACTOR: number;
    CURVE_END_X_FACTOR: number;
    CP3_X_FACTOR: number;

    preinitialize(): void {
        this.CP1_X_FACTOR = 0.16;
        this.CP2_X_FACTOR = 0.33;
        this.CURVE_END_X_FACTOR = 0.5;
        this.CP3_X_FACTOR = 0.75;
    }

    @Function()
    data(): string {
        const { CP1_X_FACTOR, CP2_X_FACTOR, CURVE_END_X_FACTOR, CP3_X_FACTOR, offset } = this;

        return `
            M 0 0
            L 0 calc(h - ${offset})
            C calc(${CP1_X_FACTOR} * w) calc(h) calc(${CP2_X_FACTOR} * w) calc(h) calc(${CURVE_END_X_FACTOR} * w) calc(h - ${offset})
            S calc(${CP3_X_FACTOR} * w) calc(h - ${2 * offset}) calc(w) calc(h - ${offset})
            L calc(w) 0
            Z
        `;
    }

    set offset(value: number) {
        this.set('offset', value);
    }

    get offset(): number {
        const offset = this.get('offset') || 0;
        return Math.max(0, Math.min(offset, this.get('size').height / 2));
    }
}
