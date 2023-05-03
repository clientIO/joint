import { util } from 'jointjs';
import { Card } from './Card';
import { CARD_BG_COLOR, CARD_COLOR, CARD_LABEL_COLOR } from '../../theme';

const ELEMENT_MARKUP = util.svg`
    <path @selector="body" />
    <text @selector="label" />
`;

export default class RightAmplifier extends Card {
    defaults() {
        return {
            ...super.defaults(),
            type: 'ngv.RightAmplifier',
            size: {
                width: 40,
                height: 40,
            },
            attrs: {
                body: {
                    d: 'M 0 0 L calc(w) calc(h / 2) L 0 calc(h) z',
                    fill: CARD_BG_COLOR,
                    stroke: CARD_COLOR,
                    strokeWidth: 2,
                },
                label: {
                    fill: CARD_LABEL_COLOR,
                    x: 'calc(w - 5)',
                    y: 5,
                    fontSize: 11,
                    textVerticalAnchor: 'bottom',
                    textAnchor: 'start',
                    fontFamily: 'sans-serif'
                }
            }
        }
    }

    preinitialize(...args: any[]): void {
        super.preinitialize(...args);
        this.markup = ELEMENT_MARKUP;
    }
}
