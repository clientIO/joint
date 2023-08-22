import { util } from 'jointjs';

const PATTERN_1 = (fgColor: string, bgColor: string) => {
    return {
        type: 'pattern',
        attrs: {
            'width': 12,
            'height': 12,
            'stroke-width': 1,
            'stroke': fgColor,
            'fill': 'none',
        },
        markup: util.svg`
            <rect width="12" height="12" fill="${bgColor}" stroke="none" />
            <path d="M 0 0 L 12 12 M 6 -6 L 18 6 M -6 6 L 6 18" />
        `
    }
};

export const BG_COLOR = "#dde6ed";

export const NODE_HEADER_COLOR = "#0075f2";
export const NODE_HEADER_BG_COLOR = "#ffffff";
export const NODE_IP_COLOR = "#ed2637";
export const NODE_BG_COLOR = "#dde6ed";
export const NODE_MARGIN_HORIZONTAL = 60;
export const NODE_MARGIN_VERTICAL = 50;
export const NODE_PADDING_VERTICAL = 50;
export const NODE_PADDING_HORIZONTAL = 60;
export const NODE_HEIGHT = 420;
export const NODE_COLLAPSED_WIDTH = 100;

export const CARD_COLOR = "#337357";
export const CARD_BG_COLOR = PATTERN_1(CARD_COLOR, NODE_BG_COLOR);
export const CARD_LABEL_COLOR = "#43AA8B";
export const CARD_PORT_COLOR = "#dde6ed";
export const CARD_PORT_BG_COLOR = "#131e29";
export const CARD_PORT_LABEL_COLOR = "#131e29";

export const NODE_LINK_COLOR = "#0075f2";
export const FIBER_LINK_COLOR = "#0075f2";
export const EXTERNAL_LINK_COLOR = "#0075f2";

export const ALERT_COLOR = '#ed2637';
