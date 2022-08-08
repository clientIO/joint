import { dia, linkTools, elementTools } from '../../build/joint';

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

interface RadiusControlOptions extends elementTools.Control.Options {
    testOption?: number;
}
class RadiusControl extends elementTools.Control<RadiusControlOptions> {

    protected getPosition(view: dia.ElementView): dia.Point {
        return { x: 0, y: view.model.get('test') || 0 };
    }

    protected setPosition(view: dia.ElementView, coordinates: dia.Point): void {
        view.model.set('test', coordinates.y);
    }

    protected resetPosition(view: dia.ElementView): void {
        view.model.set('test', 0);
    }
}

new RadiusControl({
    padding: 10,
    testOption: 10
});

new elementTools.HoverConnect({
    useModelGeometry: true,
    trackWidth: 10,
    trackPath: (view) => view.model.attr(['body', 'd']),
});
