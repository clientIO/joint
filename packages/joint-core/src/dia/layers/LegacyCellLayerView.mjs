import { CellLayerView } from './CellLayerView.mjs';
import { addClassNamePrefix } from '../../util/util.mjs';

export const LegacyCellLayerView = CellLayerView.extend({

    className: function() {
        const className = CellLayerView.prototype.className.apply(this, arguments);
        return className + ' ' + addClassNamePrefix('viewport');
    }
});
