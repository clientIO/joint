import { GraphLayerView } from './GraphLayerView.mjs';
import { addClassNamePrefix } from '../util/util.mjs';

/**
 * @class LegacyGraphLayerView
 * @description A legacy GraphLayerView with an additional class name for backward compatibility.
 */
export const LegacyGraphLayerView = GraphLayerView.extend({

    className: function() {
        const className = GraphLayerView.prototype.className.apply(this, arguments);
        return className + ' ' + addClassNamePrefix('viewport');
    }
});
