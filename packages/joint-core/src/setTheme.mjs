import * as util from './util/index.mjs';
import * as mvc from './mvc/index.mjs';

export const setTheme = function(theme, opt) {

    opt = opt || {};

    util.invoke(mvc.views, 'setTheme', theme, opt);

    // Update the default theme on the view prototype.
    mvc.View.prototype.defaultTheme = theme;
};
