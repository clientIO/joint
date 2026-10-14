import { dia, linkTools, elementTools } from '../../';

class MyVertexHandle extends linkTools.Vertices.VertexHandle {

    protected override onDoubleClick(evt: dia.Event): void {
        super.onDoubleClick(evt);
    }
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

class MyTargetAnchor extends linkTools.TargetAnchor {

    protected override onPointerDown(evt: dia.Event): void {
        super.onPointerDown(evt);
    }

    protected override onPointerMove(evt: dia.Event): void {
        super.onPointerMove(evt);
    }

    protected override onPointerUp(evt: dia.Event): void {
        super.onPointerUp(evt);
    }

    protected override onPointerDblClick(evt: dia.Event): void {
        super.onPointerDblClick(evt);
    }
}

const toolsView = new dia.ToolsView({
    name: 'test-tools-view',
    tools: [
        vertices,
        segments,
        new MyTargetAnchor(),
    ]
});

toolsView.configure({ component: false });

new linkTools.Button({
    visibility: (view) => view.getConnectionLength() > 100,
});

new elementTools.Button({
    visibility: (view) => view.model.size().width > 100,
});

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

new linkTools.Button({
    distance: (view) => view.getConnectionLength() < 100 ? 20 : '50%'
});
