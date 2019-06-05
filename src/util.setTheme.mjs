import { invoke } from './util.js';
import { View, views } from './view.js';

export const setTheme = function(theme, opt) {

    opt = opt || {};

    invoke(views, 'setTheme', theme, opt);

    // Update the default theme on the view prototype.
    View.prototype.defaultTheme = theme;
};
