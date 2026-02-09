import { dia } from '@joint/core';
import { colors, sizes } from './theme';
import { PersonNode } from './data';

const { deceasedCrossInset, adoptedBracketPadding } = sizes;

class DeceasedHighlighter extends dia.HighlighterView {

    preinitialize() {
        this.tagName = 'path';
        this.attributes = {
            stroke: colors.dark,
            strokeWidth: 2,
            strokeLinecap: 'round',
            fill: 'none',
        };
    }

    protected highlight(elementView: dia.ElementView<dia.Element>) {
        const { width, height } = elementView.model.size();
        const p = deceasedCrossInset;
        const d = `M ${p} ${p} ${width - p} ${height - p} M ${width - p} ${p} ${p} ${height - p}`;

        this.el.setAttribute('d', d);
    }
}

class AdoptedHighlighter extends dia.HighlighterView {

    preinitialize() {
        this.tagName = 'path';
        this.attributes = {
            stroke: colors.dark,
            strokeWidth: 1.5,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            fill: 'none',
        };
    }

    protected highlight(elementView: dia.ElementView<dia.Element>) {
        const { width, height } = elementView.model.size();
        const p = adoptedBracketPadding;
        const bw = 5;

        const d = [
            `M ${-p + bw} ${-p} L ${-p} ${-p} L ${-p} ${height + p} L ${-p + bw} ${height + p}`,
            `M ${width + p - bw} ${-p} L ${width + p} ${-p} L ${width + p} ${height + p} L ${width + p - bw} ${height + p}`,
        ].join(' ');

        this.el.setAttribute('d', d);
    }
}

const DECEASED_HIGHLIGHTER_ID = 'deceased-cross';
const ADOPTED_HIGHLIGHTER_ID = 'adopted-brackets';

export function applySymbolHighlighters(paper: dia.Paper, persons: PersonNode[]) {
    for (const person of persons) {
        const view = paper.findViewByModel(String(person.id));
        if (!view) continue;
        if (person.dod) {
            DeceasedHighlighter.add(view, 'body', DECEASED_HIGHLIGHTER_ID, {
                z: 2
            });
        }
        if (person.adopted) {
            AdoptedHighlighter.add(view, 'body', ADOPTED_HIGHLIGHTER_ID);
        }
    }
}
