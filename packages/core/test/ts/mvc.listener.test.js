"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var joint_1 = require("../../build/joint");
var graph = new joint_1.dia.Graph();
var paper = new joint_1.dia.Paper({ model: graph });
var rect1 = new joint_1.shapes.standard.Rectangle();
var link1 = new joint_1.shapes.standard.Link();
graph.addCells([rect1, link1]);
var record = {
    rect1: rect1,
    link1: link1
};
var listener = new joint_1.mvc.Listener({ graph: graph }, record);
listener.listenTo(rect1, 'change', function (_a, cellMap, _elementView, _evt) {
    var graph = _a.graph;
    var element1 = graph.getCell(cellMap.rect1.id);
    var element2 = cellMap['rect1'];
    element1.attr({ body: { fill: 'yellow' } });
    element2.attr({ body: { fill: 'red' } });
});
listener.listenTo(link1, 'change', function (_a, cellMap, _linkView, _evt) {
    var graph = _a.graph;
    var link1 = graph.getCell(cellMap.link1.id);
    var link2 = cellMap['link1'];
    link1.attr({ line: { stroke: 'yellow' } });
    link2.attr({ line: { stroke: 'red' } });
});
listener.listenTo(graph, {
    'element:add': function (_a, cellMap, _elementView, _evt) {
        var graph = _a.graph;
        var element1 = graph.getCell(cellMap.rect1.id);
        var element2 = cellMap['rect1'];
        element1.attr({ body: { fill: 'yellow' } });
        element2.attr({ body: { fill: 'red' } });
    },
    'link:add': function (_a, cellMap, _linkView, _evt) {
        var graph = _a.graph;
        var link1 = graph.getCell(cellMap.link1.id);
        var link2 = cellMap['link1'];
        link1.attr({ line: { stroke: 'yellow' } });
        link2.attr({ line: { stroke: 'red' } });
    }
});
listener.listenTo(paper, 'blank:pointerclick', function (_a, cellMap, _evt, x, y) {
    var graph = _a.graph;
    var element = graph.getCell(cellMap.rect1.id);
    element.position(x, y);
});
listener.listenTo(paper, {
    'cell:pointerdblclick': function (_a, cellMap, _elementView, _evt, _x, _y) {
        var graph = _a.graph;
        var element1 = graph.getCell(cellMap.rect1.id);
        var element2 = cellMap['rect1'];
        element1.attr({ body: { fill: 'yellow' } });
        element2.attr({ body: { fill: 'red' } });
    },
    'blank:pointerclick': function (_a, cellMap, _evt, x, y) {
        var graph = _a.graph;
        var element = graph.getCell(cellMap.rect1.id);
        element.position(x, y);
    }
});
//# sourceMappingURL=mvc.listener.test.js.map