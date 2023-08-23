import { Rect } from '../g/index.mjs';
import { HighlighterView } from '../dia/HighlighterView.mjs';
import {
    normalizeSides,
    isEqual,
} from '../util/index.mjs';
import {
    Positions,
    getRectPoint,
} from '../util/getRectPoint.mjs';

const Directions = {
    ROW: 'row',
    COLUMN: 'column'
};

export const list = HighlighterView.extend({

    tagName: 'g',
    MOUNTABLE: true,
    UPDATE_ATTRIBUTES: function() {
        return [this.options.attribute];
    },

    _prevItems: null,

    highlight(elementView, node) {
        const element = elementView.model;
        const { attribute, size = 20, gap = 5, direction = Directions.ROW } = this.options;
        if (!attribute) throw new Error('List: attribute is required');
        const normalizedSize = (typeof size === 'number') ? { width: size, height: size } : size;
        const isRowDirection = (direction === Directions.ROW);
        const itemWidth = isRowDirection ? normalizedSize.width : normalizedSize.height;
        let items = element.get(attribute);
        if (!Array.isArray(items)) items = [];
        const prevItems = this._prevItems || [];
        const comparison = items.map((item, index) => isEqual(prevItems[index], items[index]));
        if (prevItems.length !== items.length || comparison.some(unchanged => !unchanged)) {
            const prevEls = this.vel.children();
            const itemsEls = items.map((item, index) => {
                const prevEl = (index in prevEls) ? prevEls[index].node : null;
                if (comparison[index]) return prevEl;
                const itemEl = this.createListItem(item, normalizedSize, prevEl);
                if (!itemEl) return null;
                if (!(itemEl instanceof SVGElement)) throw new Error('List: item must be an SVGElement');
                itemEl.dataset.index = index;
                itemEl.dataset.attribute = attribute;
                const offset = index * (itemWidth + gap);
                itemEl.setAttribute('transform', (isRowDirection)
                    ? `translate(${offset}, 0)`
                    : `translate(0, ${offset})`
                );
                return itemEl;
            });
            this.vel.empty().append(itemsEls);
            this._prevItems = items;
        }
        const itemsCount = items.length;
        const length = (itemsCount === 0)
            ? 0
            : (itemsCount * itemWidth + (itemsCount - 1) * gap);
        const listSize = (isRowDirection)
            ? { width: length, height: normalizedSize.height }
            : { width: normalizedSize.width, height: length };

        this.position(element, listSize);
    },

    position(element, listSize) {
        const { vel, options } = this;
        const { margin = 5, position = 'top-left' } = options;
        const { width, height } = element.size();
        const { left, right, top, bottom } = normalizeSides(margin);
        const bbox = new Rect(left, top, width - (left + right), height - (top + bottom));
        let { x, y } = getRectPoint(bbox, position);
        // x
        switch (position) {
            case Positions.CENTER:
            case Positions.TOP:
            case Positions.BOTTOM: {
                x -= listSize.width / 2;
                break;
            }
            case Positions.RIGHT:
            case Positions.BOTTOM_RIGHT:
            case Positions.TOP_RIGHT: {
                x -= listSize.width;
                break;
            }
        }
        // y
        switch (position) {
            case Positions.CENTER:
            case Positions.RIGHT:
            case Positions.LEFT: {
                y -= listSize.height / 2;
                break;
            }
            case Positions.BOTTOM:
            case Positions.BOTTOM_RIGHT:
            case Positions.BOTTOM_LEFT: {
                y -= listSize.height;
                break;
            }
        }
        vel.attr('transform', `translate(${x}, ${y})`);
    }
}, {
    Directions,
    Positions
});
