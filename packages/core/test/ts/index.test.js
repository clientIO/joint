"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var joint = require("../../build/joint");
var graph = new joint.dia.Graph({ graphAttribute: true });
var rectangle = new joint.shapes.standard.Rectangle({
    attrs: {
        body: {
            fill: {
                type: 'pattern',
                markup: [{
                        tagName: 'circle',
                        attributes: {
                            r: 5
                        }
                    }]
            },
            stroke: {
                type: 'linearGradient',
                stops: [{ offset: 0.5, color: 'red' }]
            },
            filter: {
                id: 'test-filter',
                name: 'dropShadow',
                args: {
                    dx: 5,
                    dy: 5,
                    blur: 5
                }
            }
        }
    }
});
var link = new joint.shapes.standard.Link({
    attrs: {
        line: {
            sourceMarker: {
                markup: '<circle cx="0" cy="0" r="5"/>',
                attrs: {
                    fill: 'red'
                }
            },
            targetMarker: {
                type: 'path',
                d: 'M 10 10 20 20'
            }
        }
    }
});
graph.addCells([
    rectangle,
    new joint.shapes.standard.Circle(),
    new joint.shapes.standard.Ellipse(),
    new joint.shapes.standard.Path(),
    new joint.shapes.standard.Polygon(),
    new joint.shapes.standard.Polyline(),
    new joint.shapes.standard.Image(),
    new joint.shapes.standard.BorderedImage(),
    new joint.shapes.standard.EmbeddedImage(),
    new joint.shapes.standard.InscribedImage(),
    new joint.shapes.standard.HeaderedRectangle(),
    new joint.shapes.standard.Circle(),
    new joint.shapes.standard.Ellipse(),
    link,
    new joint.shapes.standard.DoubleLink(),
    new joint.shapes.standard.ShadowLink(),
    {
        id: 'test-id-1',
        type: 'standard.Rectangle'
    }
]);
graph.addCell({
    id: 'test-id-2',
    type: 'standard.Ellipse',
    attrs: {
        body: {
            fill: 'red'
        }
    }
});
var cell = graph.get('cells').at(0);
cell.getBBox({ rotate: true }).inflate(5);
graph.set('test', true, { dry: true });
rectangle.set('test', true, { silent: true, customOption: true });
var cylinder = new joint.shapes.standard.Cylinder({ z: 0 });
cylinder.set({ position: { x: 4, y: 5 } });
cylinder.set('z', cylinder.attributes.z + 1);
var paper = new joint.dia.Paper({
    model: graph,
    frozen: true,
    findParentBy: function (_elementView, _evt, x, y) { return graph.findModelsFromPoint({ x: x, y: y }); }
});
var cellView = cell.findView(paper);
cellView.vel.addClass('test-class');
var isHTMLView = true;
var isSVGView = true;
var _a = rectangle.toJSON(), size = _a.size, position = _a.position;
var isTypeofSize = true;
var isTypeofPoint = true;
var layer = new joint.dia.PaperLayer();
layer.insertNode(cellView.el);
layer.insertSortedNode(cellView.el, 5);
paper.on('link:pointerclick', function (linkView, evt) {
    evt.stopPropagation();
    linkView.model.vertices([]);
});
paper.on('element:pointerdblclick', function (elementView) {
    elementView.model.addPort({});
});
paper.on({
    'render:done': function (stats) {
        if (stats.priority > 2) {
            paper.on('custom-event', function (paper) {
                paper.off('custom-event');
            });
        }
    }
});
cellView.listenTo(paper, {
    'cell:highlight': function (cellView, node, opt) {
        var isHighlightingOptions = true;
        var isSVGElement = true;
        if (opt.type === joint.dia.CellView.Highlighting.DEFAULT) {
            cellView.el.classList.add('highlighted');
        }
    }
});
var AttributeHighlighterView = (function (_super) {
    __extends(AttributeHighlighterView, _super);
    function AttributeHighlighterView() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AttributeHighlighterView.prototype.preinitialize = function () {
        this.UPDATE_ATTRIBUTES = function () { return [this.options.attribute]; };
    };
    return AttributeHighlighterView;
}(joint.dia.HighlighterView));
var MyList = (function (_super) {
    __extends(MyList, _super);
    function MyList() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MyList.prototype.createListItem = function (item) {
        var vel = joint.V('text');
        vel.text("".concat(item + 1));
        return vel.node;
    };
    return MyList;
}(joint.highlighters.list));
var list = new MyList({
    size: 10,
    gap: 10,
    margin: { left: 10 },
    position: 'top-left',
    direction: 'row',
});
list.remove();
var list2 = MyList.add.call(MyList, cellView, 'root', 'id', {
    size: { width: 100, height: 5 },
    position: joint.highlighters.list.Positions.BOTTOM_RIGHT,
    direction: joint.highlighters.list.Directions.COLUMN,
});
list2.remove();
//# sourceMappingURL=index.test.js.map