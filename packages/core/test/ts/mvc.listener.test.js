import { dia, shapes, mvc } from '../../build/joint';
const graph = new dia.Graph();
const paper = new dia.Paper({ model: graph });
const rect1 = new shapes.standard.Rectangle();
const link1 = new shapes.standard.Link();
graph.addCells([rect1, link1]);
const record = {
    rect1,
    link1
};
const listener = new mvc.Listener({ graph }, record);
listener.listenTo(rect1, 'change', ({ graph }, cellMap, _elementView, _evt) => {
    const element1 = graph.getCell(cellMap.rect1.id);
    const element2 = cellMap['rect1'];
    element1.attr({ body: { fill: 'yellow' } });
    element2.attr({ body: { fill: 'red' } });
});
listener.listenTo(link1, 'change', ({ graph }, cellMap, _linkView, _evt) => {
    const link1 = graph.getCell(cellMap.link1.id);
    const link2 = cellMap['link1'];
    link1.attr({ line: { stroke: 'yellow' } });
    link2.attr({ line: { stroke: 'red' } });
});
listener.listenTo(graph, {
    'element:add': ({ graph }, cellMap, _elementView, _evt) => {
        const element1 = graph.getCell(cellMap.rect1.id);
        const element2 = cellMap['rect1'];
        element1.attr({ body: { fill: 'yellow' } });
        element2.attr({ body: { fill: 'red' } });
    },
    'link:add': ({ graph }, cellMap, _linkView, _evt) => {
        const link1 = graph.getCell(cellMap.link1.id);
        const link2 = cellMap['link1'];
        link1.attr({ line: { stroke: 'yellow' } });
        link2.attr({ line: { stroke: 'red' } });
    }
});
listener.listenTo(paper, 'blank:pointerclick', ({ graph }, cellMap, _evt, x, y) => {
    const element = graph.getCell(cellMap.rect1.id);
    element.position(x, y);
});
listener.listenTo(paper, {
    'cell:pointerdblclick': ({ graph }, cellMap, _elementView, _evt, _x, _y) => {
        const element1 = graph.getCell(cellMap.rect1.id);
        const element2 = cellMap['rect1'];
        element1.attr({ body: { fill: 'yellow' } });
        element2.attr({ body: { fill: 'red' } });
    },
    'blank:pointerclick': ({ graph }, cellMap, _evt, x, y) => {
        const element = graph.getCell(cellMap.rect1.id);
        element.position(x, y);
    }
});
//# sourceMappingURL=mvc.listener.test.js.map