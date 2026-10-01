import { shapes, util } from '@joint/core';

// Room left inside a folder for its title, above the packed files.
export const FOLDER_PADDING = { top: 34, left: 10, bottom: 10, right: 10 };

/**
 * A folder - `@joint/layout-elk` sizes it to fit its packed files. Its title
 * sits inside the box (in the padding `index.ts` hands ELK), not above it as in
 * the other ELK examples: rectangle packing puts folders right next to each
 * other, so a label outside the box would overlap a neighbor.
 */
export class Folder extends shapes.standard.Rectangle {
    defaults() {
        return util.defaultsDeep({
            type: 'example.Folder',
            size: { width: 100, height: 100 },
            attrs: {
                body: {
                    class: 'md-folder'
                },
                label: {
                    x: FOLDER_PADDING.left,
                    y: FOLDER_PADDING.top / 2,
                    textAnchor: 'start',
                    textVerticalAnchor: 'middle',
                    class: 'md-folder-label'
                }
            }
        }, super.defaults);
    }
}

/**
 * A file tile. `baseSize` is the size it was created with - ELK may stretch a
 * tile to fill leftover space (see `index.ts`'s white space elimination), and
 * every layout starts again from `baseSize` rather than from the stretched size.
 */
export class FileTile extends shapes.standard.Rectangle {
    defaults() {
        return util.defaultsDeep({
            type: 'example.FileTile',
            attrs: {
                label: {
                    class: 'md-tile-label',
                    textWrap: {
                        width: -12,
                        height: -8,
                        ellipsis: true
                    }
                }
            }
        }, super.defaults);
    }
}
