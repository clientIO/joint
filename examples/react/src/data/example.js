import { ElementModel, LinkModel } from "../models";

export function addGraphContent(graph) {
    const el1 = new ElementModel({
        size: { width: 200, height: 130 },
        componentType: "MyForm",
        data: {
            label: "Shape 1",
            severity: "error",
            value: "Foo",
        },
    });

    const el2 = new ElementModel({
        size: { width: 200, height: 130 },
        componentType: "MyForm",
        data: {
            label: "Shape 2",
            severity: "info",
            value: "Bar",
        },
    });

    const el3 = new ElementModel({
        size: { width: 160, height: 100 },
        componentType: "MyRating",
        data: {
            value: 3,
        },
    });

    const el4 = new ElementModel({
        size: { width: 610, height: 204 },
        componentType: "MyTable",
        data: {
            value: "Table",
        },
        ports: {
            groups: {
                out: {
                    position: {
                        name: "line",
                        args: {
                            start: { x: "calc(w)", y: 200 / 6 },
                            end: { x: "calc(w)", y: "calc(h)" },
                        },
                    },
                    attrs: {
                        circle: {
                            r: 6,
                            magnet: "active",
                        },
                    },
                },
            },
            items: [
                {
                    id: "port1",
                    group: "out",
                },
                {
                    id: "port2",
                    group: "out",
                },
                {
                    id: "port3",
                    group: "out",
                },
                {
                    id: "port4",
                    group: "out",
                },
                {
                    id: "port5",
                    group: "out",
                },
            ],
        },
    });

    const link = new LinkModel({
        source: { id: el1.id },
        target: { id: el2.id },
        z: -1,
    });

    el1.position(50, 30);
    el2.position(400, 30);
    el3.position(650, 45);
    el4.position(50, 200);

    graph.addCells([el1, el2, el3, el4, link]);
}
