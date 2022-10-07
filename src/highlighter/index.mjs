import { HighlighterView } from '../dia';

export const remove = (paper) => {
    const cells = paper.model.getCells();

    cells.forEach(cell => {
        const cellView = cell.findView(paper);
        HighlighterView.remove(cellView);
    });
};
