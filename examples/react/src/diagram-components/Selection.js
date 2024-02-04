import { useEffect } from 'react';
import { usePaper } from '@joint/react';
import { highlighters } from '@joint/core';

export const HGL_SELECTION_ID = 'selection-frame';

export default function Selection({ cells = [], color = 'orange' }) {

    const paper = usePaper();

    useEffect(() => {

        if (!paper) return;

        highlighters.mask.removeAll(paper, HGL_SELECTION_ID);
        cells.forEach(cell => {
            const cellView = cell.findView(paper);
            if (!cellView) return;
            highlighters.mask.add(cellView, 'root', HGL_SELECTION_ID, {
                deep: true,
                attrs: {
                    'stroke': color,
                    'stroke-width': 3
                }
            });
        });

    }, [paper, cells, color]);

    return null;
}
