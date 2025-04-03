import { shapes, util } from "@joint/core";
import { IElement } from ".";

export class Triangle extends shapes.standard.Polygon implements IElement {
    defaults(): Partial<shapes.standard.PolygonAttributes> {
        return util.defaultsDeep({
            type: 'app.Triangle',
            size: { width: 30, height: 30 },
            attrs: {
                body: {
                    points: [[15, 0], [30, 30], [0, 30]],
                    stroke: '#333',
                    strokeWidth: 2
                },
                label: {
                    fill: "#333",
                    y: 'calc(h - 5)',
                    fontSize: 10,
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

        return new Triangle({
            id,
            attrs: {
                label: {
                    text: id
                }
            }
        });
    }

    getMaxNumberOfChildren() {
        return Infinity;
    }
}

Object.assign(shapes, {
    app: {
        Triangle
    }
});
