import { util } from 'jointjs';
import { Card } from './Card';
import { CARD_BG_COLOR, CARD_COLOR, CARD_LABEL_COLOR } from '../../theme';

const ELEMENT_MARKUP = util.svg`
    <path @selector="body" />
    <text @selector="label" />
`;

export default class LeftAmplifier extends Card {
    defaults() {
        return {
            ...super.defaults(),
            type: 'ngv.LeftAmplifier',
            size: {
                width: 40,
                height: 40,
            },
            attrs: {
                body: {
                    d: 'M calc(w) 0 L 0 calc(h / 2) L calc(w) calc(h) z',
                    fill: CARD_BG_COLOR,
                    stroke: CARD_COLOR,
                    strokeWidth: 2,
                },
                label: {
                    fill: CARD_LABEL_COLOR,
                    x: 5,
                    y: 'calc(h - 5)',
                    fontSize: 11,
                    textVerticalAnchor: 'top',
                    textAnchor: 'end',
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
