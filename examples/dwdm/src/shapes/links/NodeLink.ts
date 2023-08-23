import { dia, util } from 'jointjs';
import Link from './Link';
import { NODE_LINK_COLOR } from '../../theme';

const LINK_MARKUP = util.svg`
    <path @selector="wrapper" fill="none" cursor="pointer" stroke="transparent" stroke-linecap="round"/>
    <path @selector="line" fill="none" pointer-events="none" />
`;

const ARROW_MARKER = util.svg`
    <path d="M 8 -3 -1 0 8 3 z" stroke-linejoin="round" />
`;

export default class NodeLink extends Link {
    defaults() {
        return {
            ...super.defaults,
            type: 'ngv.NodeLink',
            bidirectional: false,
            attrs: {
                line: {
                    connection: true,
                    stroke: NODE_LINK_COLOR,
                    strokeWidth: 2,
                    strokeLinejoin: 'round',
                    targetMarker: { markup: ARROW_MARKER }
                },
                wrapper: {
                    connection: true,
                    strokeWidth: 10,
                    strokeLinejoin: 'round'
                }
            }
        };
    }

    preinitialize(...args: any[]): void {
        super.preinitialize(...args);
        this.markup = LINK_MARKUP;
    }

    toBidirectional(opt?: dia.Cell.Options) {
        this.prop({
            bidirectional: true,
            attrs: {
                line: {
                    sourceMarker: { markup: ARROW_MARKER },
                }
            }
        }, opt);
    }

    isBidirectional(): boolean {
        return Boolean(this.get('bidirectional'));
    }

    static isNodeLink(cell: dia.Cell): cell is NodeLink {
        // return cell.get('type') === 'ngv.NodeLink';
        return cell instanceof NodeLink;
    }
}
