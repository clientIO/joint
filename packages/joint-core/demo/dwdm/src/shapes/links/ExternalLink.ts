import { dia, util } from 'jointjs';
import Link from './Link';
import { EXTERNAL_LINK_COLOR } from '../../theme';

const LINK_MARKUP = util.svg`
    <path @selector="wrapper" fill="none" cursor="pointer" stroke="transparent" stroke-linecap="round"/>
    <path @selector="line" fill="none" pointer-events="none" />
`;

const LABEL_MARKUP = util.svg`
    <text @selector="description" />
`;

const ARROW_MARKER = util.svg`
    <path d="M 8 -3 -1 0 8 3 z" stroke-linejoin="round" />
`;

export default class ExternalLink extends Link {
    defaults() {
        return {
            ...super.defaults,
            type: 'ngv.ExternalLink',
            bidirectional: true,
            attrs: {
                line: {
                    connection: true,
                    stroke: EXTERNAL_LINK_COLOR,
                    strokeWidth: 2,
                    strokeDasharray: '5 5',
                    strokeLinejoin: 'round',
                    sourceMarker: { markup: ARROW_MARKER },
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

    setDescription(description: string, opt?: dia.Cell.Options) {
        this.set('labels', [{
            markup: LABEL_MARKUP,
            attrs: {
                description: {
                    text: description,
                    textAnchor: "middle",
                    textVerticalAnchor: "middle",
                    fontSize: 10,
                    fontFamily: 'sans-serif',
                    fill: EXTERNAL_LINK_COLOR,
                }
            },
            position: {
                distance: 0.5,
                offset: 10,
            }
        }] as dia.Link.Label[], opt);
    }

    isBidirectional(): boolean {
        return true;
    }

    static isExternalLink(cell: dia.Cell): cell is ExternalLink {
        return cell.get('type') === 'ngv.ExternalLink';
    }
}
