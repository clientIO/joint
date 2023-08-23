import { util } from 'jointjs';
import { Card } from './Card';
import { CARD_BG_COLOR, CARD_COLOR, CARD_LABEL_COLOR } from '../../theme';

const ELEMENT_MARKUP = util.svg`
    <path @selector="body" />
    <text @selector="label" />
`;

const CORNER_SIZE = 6;

export default class OpticalPowerMonitoring extends Card {
    defaults() {
        return {
            ...super.defaults(),
            type: 'ngv.OpticalPowerMonitoring',
            size: {
                width: 60,
                height: 60,
            },
            attrs: {
                body: {
                    d: `M ${CORNER_SIZE} 0 H calc(w - ${CORNER_SIZE}) l ${CORNER_SIZE} ${CORNER_SIZE} V calc(h - ${CORNER_SIZE}) l -${CORNER_SIZE} ${CORNER_SIZE} H ${CORNER_SIZE} l -${CORNER_SIZE} -${CORNER_SIZE} V ${CORNER_SIZE} Z`,
                    fill: CARD_BG_COLOR,
                    stroke: CARD_COLOR,
                    strokeWidth: 2,
                },
                label: {
                    fill: CARD_LABEL_COLOR,
                    x: 'calc(w - 2)',
                    y: 2,
                    fontSize: 11,
                    textVerticalAnchor: 'bottom',
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
