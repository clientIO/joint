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
var joint_1 = require("../../build/joint");
var MyVertexHandle = (function (_super) {
    __extends(MyVertexHandle, _super);
    function MyVertexHandle() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return MyVertexHandle;
}(joint_1.linkTools.Vertices.VertexHandle));
var vertices = new joint_1.linkTools.Vertices({
    handleClass: MyVertexHandle,
    vertexAdding: false,
});
var MySegmentHandle = (function (_super) {
    __extends(MySegmentHandle, _super);
    function MySegmentHandle() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return MySegmentHandle;
}(joint_1.linkTools.Segments.SegmentHandle));
var segments = new joint_1.linkTools.Segments({
    handleClass: MySegmentHandle,
    snapHandle: false,
});
var toolsView = new joint_1.dia.ToolsView({
    name: 'test-tools-view',
    tools: [
        vertices,
        segments,
    ]
});
toolsView.configure({ component: false });
var RadiusControl = (function (_super) {
    __extends(RadiusControl, _super);
    function RadiusControl() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    RadiusControl.prototype.getPosition = function (view) {
        return { x: 0, y: view.model.get('test') || 0 };
    };
    RadiusControl.prototype.setPosition = function (view, coordinates) {
        view.model.set('test', coordinates.y);
    };
    RadiusControl.prototype.resetPosition = function (view) {
        view.model.set('test', 0);
    };
    return RadiusControl;
}(joint_1.elementTools.Control));
new RadiusControl({
    padding: 10,
    testOption: 10
});
new joint_1.elementTools.HoverConnect({
    useModelGeometry: true,
    trackWidth: 10,
    trackPath: function (view) { return view.model.attr(['body', 'd']); },
});
//# sourceMappingURL=toolsView.test.js.map