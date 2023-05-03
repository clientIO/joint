import { dia, util } from 'jointjs';
import { NODE_BG_COLOR, NODE_HEADER_BG_COLOR, NODE_HEADER_COLOR, NODE_IP_COLOR } from '../../theme';

export const HEADER_HEIGHT = 40;
export const BORDER_OFFSET = 10;

interface NodeAttributes extends dia.Element.Attributes {
    collapsed?: boolean;
}

export default class Node extends dia.Element {

    defaults(): Partial<NodeAttributes> {
        return {
            ...super.defaults,
            type: "ngv.Node",
            collapsed: false,
            attrs: {
                body: {
                    stroke: "#cad8e3",
                    strokeWidth: 2,
                    fill: NODE_BG_COLOR,
                    y: HEADER_HEIGHT,
                    width: "calc(w)",
                    height: `calc(h - ${HEADER_HEIGHT})`,
                    pointerEvents: 'none',
                },
                header: {
                    stroke: NODE_HEADER_COLOR,
                    strokeWidth: 2,
                    fill: NODE_HEADER_BG_COLOR,
                    height: HEADER_HEIGHT,
                    width: "calc(w)"
                },
                labelNodeName: {
                    fill: NODE_HEADER_COLOR,
                    fontSize: 14,
                    textVerticalAnchor: "middle",
                    textAnchor: "start",
                    fontFamily: "sans-serif",
                    x: BORDER_OFFSET,
                    y: HEADER_HEIGHT / 2,
                    textWrap: {
                        ellipsis: true,
                        width: "calc(w / 2 - 50)",
                        maxLineCount: 1
                    }
                },
                labelNodeIp: {
                    fill: NODE_HEADER_COLOR,
                    fontSize: 14,
                    textVerticalAnchor: "middle",
                    textAnchor: "start",
                    fontFamily: "sans-serif",
                    x: "calc(0.3 * w + 50)",
                    y: HEADER_HEIGHT / 2,
                    textWrap: {
                        ellipsis: true,
                        width: "calc(w / 2 - 50)",
                        maxLineCount: 1
                    }
                }
            }
        };
    }

    preinitialize(attributes?: dia.Element.Attributes, options?: any): void {
        super.preinitialize(attributes, options);
        this.markup = util.svg`
            <rect @selector="body" />
            <rect @selector="header" />
            <text @selector="labelNodeName" />
            <text @selector="labelNodeIp" />
        `;
    }

    setName(name: string): void {
        this.attr({
            labelNodeName: {
                text: `Node Name: ${name}`,
                annotations: [{
                    start: 11,
                    end: 11 + name.length,
                    attrs: { fill: NODE_IP_COLOR }
                }]
            }
        }, { rewrite: true });
    }

    setIp(ip: string): void {
        this.attr({
            labelNodeIp: {
                text: `Node IP: ${ip}`,
                annotations: [
                    { start: 9, end: 12, attrs: { fill: NODE_IP_COLOR }},
                    { start: 13, end: 16, attrs: { fill: NODE_IP_COLOR }},
                    { start: 17, end: 20, attrs: { fill: NODE_IP_COLOR }},
                    { start: 21, end: 24, attrs: { fill: NODE_IP_COLOR }},
                ]
            }
        }, { rewrite: true });
    }

    isCollapsed() {
        return Boolean(this.get("collapsed"));
    }

    toggleCollapse(): boolean {
        const collapsed = !this.isCollapsed();
        this.set("collapsed", collapsed);
        return collapsed;
    }

    static isNode(cell: dia.Cell): cell is Node {
        return cell.get('type') === 'ngv.Node';
    }

    static HEADER_HEIGHT = HEADER_HEIGHT;
}
