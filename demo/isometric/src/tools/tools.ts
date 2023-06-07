import { dia, linkTools, util } from 'jointjs';
import { BG_COLOR, GRID_SIZE, HIGHLIGHT_COLOR } from '../theme';

const SIZE = 6;
const CONNECT_TOOL_SIZE = 10;
const ARROWHEAD_TOOL_SIZE = 15;

export const ISOMETRIC_HEIGHT_TOOL_MARKUP: dia.MarkupJSON = util.svg`
    <g @selector="handle" fill="${HIGHLIGHT_COLOR}">
        <circle cursor="ns-resize" stroke="none" fill="#33334F" fill-opacity="0.3" r="${SIZE / 2}"/>
        <circle cursor="ns-resize" stroke="${BG_COLOR}" cx="-3" cy="-3" r="${SIZE / 2}"/>
    </g>
    <rect @selector="extras" pointer-events="none" fill="none" stroke="${HIGHLIGHT_COLOR}" stroke-dasharray="1,1" rx="1" ry="1"/>
`;

export const SIZE_TOOL_MARKUP: dia.MarkupJSON = util.svg`
    <g @selector="handle" cursor="nwse-resize" >
        <rect stroke="none" fill="transparent" width="${SIZE}" height="${SIZE}"/>
        <path d="M 0 5 5 5 5 0" fill="${HIGHLIGHT_COLOR}" stroke="none" />
    </g>
    <rect @selector="extras" pointer-events="none" fill="none" stroke="${HIGHLIGHT_COLOR}" stroke-dasharray="1,1" rx="1" ry="1"/>
`;

export const CONNECT_TOOL_MARKUP = util.svg`
    <rect @selector="button" fill="${HIGHLIGHT_COLOR}" cursor="pointer" width="${CONNECT_TOOL_SIZE}" height="${CONNECT_TOOL_SIZE}"/>
    <path @selector="icon" d="M 1 4 L 5 4 L 5 1 L 9 5 L 5 9 L 5 6 1 6 z" fill="#FFFFFF" stroke="none" stroke-width="2" pointer-events="none" transform="translate(0,${CONNECT_TOOL_SIZE}), rotate(270)"/>
`;

export const CONNECT_TOOL_PRESET = {
    magnet: 'base',
    useModelGeometry: true,
    x: '100%',
    y: -CONNECT_TOOL_SIZE,
    markup: CONNECT_TOOL_MARKUP
}

export class TargetArrowHeadTool extends linkTools.TargetArrowhead {
    constructor() {
        super({
            tagName: 'rect',
            attributes: {
                'width': ARROWHEAD_TOOL_SIZE,
                'height': ARROWHEAD_TOOL_SIZE,
                'x': -ARROWHEAD_TOOL_SIZE / 2,
                'y': -ARROWHEAD_TOOL_SIZE / 2,
                'fill': HIGHLIGHT_COLOR,
                'stroke': HIGHLIGHT_COLOR,
                'fill-opacity': 0.2,
                'stroke-width': 2,
                'stroke-dasharray': '4,2',
                'cursor': 'move',
                'class': 'target-arrowhead',
            }
        });
    }
}

export class RemoveTool extends linkTools.Remove {
    constructor() {
        super({
            distance: - 2.5 * GRID_SIZE,
            markup: util.svg`
                <circle @selector="button" r="7" fill="${HIGHLIGHT_COLOR}" stroke="${BG_COLOR}" cursor="pointer"/>
                <path @selector="icon" d="M -3 -3 3 3 M -3 3 3 -3" fill="none" stroke="#FFFFFF" stroke-width="2" pointer-events="none"/>
            `
        })
    }
}
