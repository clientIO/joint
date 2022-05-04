import { dia, linkTools } from '../../index';

class MyVertexHandle extends linkTools.Vertices.VertexHandle {
}

const vertices = new linkTools.Vertices({
    handleClass: MyVertexHandle,
    vertexAdding: false,
});

class MySegmentHandle extends linkTools.Segments.SegmentHandle {
}

const segments = new linkTools.Segments({
    handleClass: MySegmentHandle,
    snapHandle: false,
});

const toolsView = new dia.ToolsView({
    name: 'test-tools-view',
    tools: [
        vertices,
        segments,
    ]
});

toolsView.configure({ component: false });
