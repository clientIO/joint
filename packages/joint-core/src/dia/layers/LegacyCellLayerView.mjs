import { CellLayerView } from './CellLayerView.mjs';
import { addClassNamePrefix } from '../../util/util.mjs';

/**
 * @class LegacyCellLayerView
 * @description A legacy CellLayerView with an additional class name for backward compatibility.
 */
export const LegacyCellLayerView = CellLayerView.extend({

    className: function() {
        const className = CellLayerView.prototype.className.apply(this, arguments);
        return className + ' ' + addClassNamePrefix('viewport');
    }
});
