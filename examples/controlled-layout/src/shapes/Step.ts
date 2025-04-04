import { shapes, util } from '@joint/core';
import { IElement } from ".";

export class Step extends shapes.standard.Rectangle implements IElement {

    defaults(): Partial<shapes.standard.RectangleAttributes> {
        return util.defaultsDeep({
            type: 'app.Step',
            size: { width: 100, height: 30 },
            attrs: {
                body: {
                    rx: 5,
                    ry: 5,
                    stroke: '#333',
                    strokeWidth: 2
                },
                label: {
                    fill: "#333",
                    fontSize: 13,
                    fontFamily: "sans-serif",
                    style: {
                        textTransform: "capitalize"
                    }
                }
            }
        }, super.defaults)
    }

    static create(id?: string) {

        id = id ?? util.uniqueId();

        return new Step({
            id,
            attrs: {
                label: {
                    text: id
                }
            }
        });
    }

    getMaxNumberOfChildren() {
        return 1;
    }
}

Object.assign(shapes, {
    app: {
        Step
    }
});
