import { shapes, util } from "@joint/core";
import { IElement } from ".";

export class Ellipse extends shapes.standard.Ellipse implements IElement {
    defaults(): Partial<shapes.standard.EllipseAttributes> {
        return util.defaultsDeep({
            type: 'app.Ellipse',
            size: {
                width: 30,
                height: 30
            },
            attrs: {
                body: {
                    rx: 15,
                    ry: 15,
                    stroke: '#333',
                    strokeWidth: 2
                },
                label: {
                    fill: "#666666",
                    fontSize: 13,
                    fontFamily: "sans-serif",
                    style: {
                        textTransform: "capitalize"
                    }
                }
            }
        }, super.defaults);
    }

    static create(id?: string) {
        id = id ?? util.uniqueId();

        return new Ellipse({
            id,
            attrs: {
                label: {
                    text: id
                }
            }
        });
    }

    getMaxNumberOfChildren() {
        return 0;
    }
}

Object.assign(shapes, {
    app: {
        Ellipse
    }
});
