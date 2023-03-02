import { dia } from '@joint/core';
import { Function, Model } from "@joint/decorators";
import svg from "./cube.svg";

interface CubeAttributes extends dia.Element.Attributes {
    cornerX: number;
    cornerY: number;
}

@Model({
    attributes: {
        size: {
            width: 100,
            height: 100,
        },
        cornerX: 100 / 3,
        cornerY: 40
    },
    template: svg,
})
export class Cube extends dia.Element<CubeAttributes> {

    @Function()
    backgroundData(): string {
        const { cornerX, cornerY } = this;

        return `
            M 0 0
            H calc(w-${cornerX})
            L calc(w) ${cornerY}
            V calc(h)
            H ${cornerX}
            L 0 calc(h-${cornerY})
            Z
        `;
    }

    @Function()
    topData(): string {
        const { cornerX, cornerY } = this;

        return `
            M 0 0
            H calc(w-${cornerX})
            L calc(w) ${cornerY}
            H ${cornerX}
            Z
        `;
    }

    @Function()
    sideData(): string {
        const { cornerX, cornerY } = this;

        return `
            M 0 0
            L ${cornerX} ${cornerY}
            V calc(h)
            L 0 calc(h-${cornerY})
            Z
        `;
    }

    get cornerX(): number {
        const cornerX = this.get('cornerX') || 0;

        return Math.max(0, Math.min(cornerX, this.get('size').width));
    }

    set cornerX(value: number) {
        this.set('cornerX', value);
    }

    get cornerY(): number {
        const cornerY = this.get('cornerY') || 0;

        return Math.max(0, Math.min(cornerY, this.get('size').height));
    }

    set cornerY(value: number) {
        this.set('cornerY', value);
    }

}
