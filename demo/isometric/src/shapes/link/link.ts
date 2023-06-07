import { dia, shapes } from 'jointjs';
import { TargetArrowHeadTool, RemoveTool } from '../../tools';

export class Link extends shapes.standard.Link {
    defaults() {
        return {
            ...super.defaults,
            z: -1,
            type: 'Link',
            attrs: {
                line: {
                    connection: true,
                    stroke: '#333333',
                    strokeWidth: 2,
                    strokeLinejoin: 'round',
                    targetMarker: {
                        'type': 'path',
                        'd': 'M 3 -4 L -3 0 L 3 4 z'
                    }
                },
                wrapper: {
                    connection: true,
                    strokeWidth: 10,
                    strokeLinejoin: 'round'
                }
            }
        };
    }

    addTools(paper: dia.Paper) {
        const targetArrowHeadTools = new TargetArrowHeadTool();
        const removeTool = new RemoveTool();

        this.findView(paper).addTools(new dia.ToolsView({
            name: 'link-tools',
            tools: [targetArrowHeadTools, removeTool]
        }));
    }
}
