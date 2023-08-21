import { util } from 'jointjs';
import { Card } from './Card';
import { CARD_BG_COLOR, CARD_COLOR, CARD_LABEL_COLOR } from '../../theme';

const ELEMENT_MARKUP = util.svg`
    <circle @selector="body" />
    <text @selector="label" />
`;

export default class FiberProtectionUnit extends Card {
    defaults() {
        return {
            ...super.defaults(),
            type: 'ngv.FiberProtectionUnit',
            size: {
                width: 80,
                height: 80,
            },
            attrs: {
                body: {
                    cx: 'calc(w / 2)',
                    cy: 'calc(h / 2)',
                    r: 'calc(w / 2)',
                    fill: CARD_BG_COLOR,
                    stroke: CARD_COLOR,
                    strokeWidth: 2,
                },
                label: {
                    fill: CARD_LABEL_COLOR,
                    x: 'calc(w - 10)',
                    y: 0,
                    fontSize: 11,
                    textVerticalAnchor: 'middle',
                    textAnchor: 'start',
                    fontFamily: 'sans-serif'
                }
            },
        }
    }

    preinitialize(...args: any[]): void {
        super.preinitialize(...args);
        this.markup = ELEMENT_MARKUP;
    }
}
