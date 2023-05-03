import { dia, util } from 'jointjs';
import Link from './Link';
import { FIBER_LINK_COLOR } from '../../theme';

const LINK_MARKUP = util.svg`
    <path @selector="wrapper" fill="none" cursor="pointer" stroke="transparent" stroke-linecap="round"/>
    <path @selector="line" fill="none" pointer-events="none" />
`;

const LABEL_MARKUP = util.svg`
    <ellipse ry="10" rx="6" cy="-12" fill="none" stroke="${FIBER_LINK_COLOR}" stroke-width="2" />
    <ellipse ry="10" rx="6" cy="-12" cx="8" fill="none" stroke="${FIBER_LINK_COLOR}" stroke-width="2" />
`;

const ARROW_MARKER = util.svg`
    <path d="M 8 -3 -1 0 8 3 z" stroke-linejoin="round" />
`;

export default class FiberLink extends Link {
    defaults() {
        return {
            ...super.defaults,
            type: 'ngv.FiberLink',
            labels: [{ markup: LABEL_MARKUP }],
            attrs: {
                line: {
                    connection: true,
                    stroke: FIBER_LINK_COLOR,
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

    isBidirectional(): boolean {
        return false;
    }

    static isFiberLink(cell: dia.Cell): cell is FiberLink {
        return cell.get('type') === 'ngv.FiberLink';
    }
}
