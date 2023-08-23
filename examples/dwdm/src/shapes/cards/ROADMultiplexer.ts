import { util } from 'jointjs';
import { Card } from './Card';
import { CARD_BG_COLOR, CARD_COLOR, CARD_LABEL_COLOR } from '../../theme';

const ELEMENT_MARKUP = util.svg`
    <rect @selector="body" />
    <text @selector="label" />
`;

// Reconfigurable Optical Add/Drop Multiplexer
export default class ROADMultiplexer extends Card {
    defaults() {
        return {
            ...super.defaults(),
            type: 'ngv.ROADMultiplexer',
            size: {
                width: 75,
                height: 200,
            },
            attrs: {
                body: {
                    width: 'calc(w)',
                    height: 'calc(h)',
                    fill: CARD_BG_COLOR,
                    stroke: CARD_COLOR,
                    strokeWidth: 2,
                },
                label: {
                    fill: CARD_LABEL_COLOR,
                    x: 'calc(w / 2)',
                    y: -5,
                    fontSize: 11,
                    textVerticalAnchor: 'bottom',
                    textAnchor: 'middle',
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
