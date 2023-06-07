import { dia, g, elementTools } from 'jointjs';
import { CenterBasedHeightControl, PyramidHeightControl, SizeControl, ProportionalSizeControl, CONNECT_TOOL_PRESET } from '../tools';

export const ISOMETRIC_HEIGHT_KEY = 'isometric-height';
export const SIZE_KEY = 'size';
export const CONNECT_KEY = 'connect';

type ToolKeys = 'connect' | 'size' | 'isometric-height';

interface IsometricElementAttributes extends dia.Element.Attributes {
    defaultIsometricHeight: number;
    isometricHeight: number;
}

type Tools = {
    [key in ToolKeys]?: dia.ToolView
}

export enum View {
    Isometric = 'isometric',
    TwoDimensional = '2d',
}

export default class IsometricShape extends dia.Element<IsometricElementAttributes> {

    tools: Tools = {};

    constructor(...args: any[]) {
        super(...args);
        this.toggleView(View.Isometric);
    }

    get defaultIsometricHeight(): number {
        return this.get('isometricHeight') ?? 0;
    }

    get isometricHeight(): number {
        return this.get('isometricHeight') ?? this.defaultIsometricHeight;
    }

    get topX(): number {
        return -this.isometricHeight;
    }

    get topY(): number {
        return -this.isometricHeight;
    }

    get topCenter(): g.Point {
        const { width, height } = this.size();
        const top = new g.Rect(this.topX, this.topY, width, height);

        return top.center();
    }

    resetIsometricHeight(): void {
        this.set('isometricHeight', this.get('defaultIsometricHeight'));
    }

    addTools(paper: dia.Paper, view: View) {

        const tools = [];
        for (const [key, tool] of Object.entries(this.tools)) {
            if (view === View.TwoDimensional && key === ISOMETRIC_HEIGHT_KEY) continue;
            tool.name = key;
            tools.push(tool);
        }

        const toolView = new dia.ToolsView({ name: 'controls', tools });
        this.findView(paper).addTools(toolView);
    }

    toggleView(view: View) {
        const isIsometric = view === View.Isometric;
        // There are 3 group selectors in the markup:
        // '2d' - the 2D view
        // 'iso' - the isometric view
        // 'common' - the common elements, displayed in both views
        // Here we only switch the visibility of the '2d' and 'iso' groups.
        this.attr({
            '2d': {
                display: isIsometric ? 'none' : 'block'
            },
            'iso': {
                display: isIsometric ? 'block' : 'none'
            }
        });
    }

};

export class CuboidShape extends IsometricShape {
    constructor(...args: any[]) {
        super(...args);
        const { defaultSize, defaultIsometricHeight } = this.attributes;
        this.tools = {
            [SIZE_KEY]: new SizeControl({ defaultSize }),
            [CONNECT_KEY]: new elementTools.Connect(CONNECT_TOOL_PRESET),
            [ISOMETRIC_HEIGHT_KEY]: new CenterBasedHeightControl({ defaultIsometricHeight }),
        }
    }
}

export class ProportionalCuboidShape extends IsometricShape {
    constructor(...args: any[]) {
        super(...args);
        const { defaultSize, defaultIsometricHeight } = this.attributes;
        this.tools = {
            [SIZE_KEY]: new ProportionalSizeControl({ defaultSize }),
            [CONNECT_KEY]: new elementTools.Connect(CONNECT_TOOL_PRESET),
            [ISOMETRIC_HEIGHT_KEY]: new CenterBasedHeightControl({ defaultIsometricHeight }),
        }
    }
}

export class CylinderShape extends IsometricShape {
    constructor(...args: any[]) {
        super(...args);
        const { defaultSize, defaultIsometricHeight } = this.attributes;
        this.tools = {
            [SIZE_KEY]: new ProportionalSizeControl({ defaultSize }),
            [CONNECT_KEY]: new elementTools.Connect(CONNECT_TOOL_PRESET),
            [ISOMETRIC_HEIGHT_KEY]: new CenterBasedHeightControl({ defaultIsometricHeight }),
        }
    }

    get sideData(): string {
        const { width, height } = this.size();
        const baseRect = new g.Rect(0, 0, width, height);

        const baseDiagonal = new g.Line(baseRect.bottomLeft(), baseRect.topRight());
        const base = g.Ellipse.fromRect(baseRect);
        const [bottomLeftIntersection, bottomRightIntersection] = baseDiagonal.intersect(base);

        const topLeftIntersection = bottomLeftIntersection.clone().translate(-this.isometricHeight, -this.isometricHeight);
        const topRightIntersection = topLeftIntersection.reflection(this.topCenter);

        return `
            M ${bottomLeftIntersection.x} ${bottomLeftIntersection.y}
            L ${topLeftIntersection.x} ${topLeftIntersection.y}
            L ${topRightIntersection.x} ${topRightIntersection.y}
            L ${bottomRightIntersection.x} ${bottomRightIntersection.y}
        `;
    }
}

export class PyramidShape extends IsometricShape {
    constructor(...args: any[]) {
        super(...args);
        const { defaultSize, defaultIsometricHeight } = this.attributes;
        this.tools = {
            [SIZE_KEY]: new ProportionalSizeControl({ defaultSize }),
            [CONNECT_KEY]: new elementTools.Connect(CONNECT_TOOL_PRESET),
            [ISOMETRIC_HEIGHT_KEY]: new PyramidHeightControl({ defaultIsometricHeight }),
        }
    }

    get topX(): number {
        return this.size().width - this.isometricHeight;
    }

    get topY(): number {
        return this.size().height - this.isometricHeight;
    }
}
