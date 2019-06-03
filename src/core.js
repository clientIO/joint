import { invoke } from './util.js';
import { View, views } from './view.js';

export const version = 'VERSION';
export const dia = {};
export const ui = {};
export const layout = {};
export const shapes = {};
export const format = {};
export const connectors = {};
export const highlighters = {};
export const routers = {};
export const anchors = {};
export const connectionPoints = {};
export const connectionStrategies = {};
export const linkTools = {};
export const mvc = {};
export const util = {};

export const setTheme = function(theme, opt) {

    opt = opt || {};

    invoke(views, 'setTheme', theme, opt);

    // Update the default theme on the view prototype.
    View.prototype.defaultTheme = theme;
};

export const env = {

    _results: {},

    _tests: {

        svgforeignobject: function() {
            return !!document.createElementNS &&
                /SVGForeignObject/.test(({}).toString.call(document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject')));
        }
    },

    addTest: function(name, fn) {

        return this._tests[name] = fn;
    },

    test: function(name) {

        var fn = this._tests[name];

        if (!fn) {
            throw new Error('Test not defined ("' + name + '"). Use `joint.env.addTest(name, fn) to add a new test.`');
        }

        var result = this._results[name];

        if (typeof result !== 'undefined') {
            return result;
        }

        try {
            result = fn();
        } catch (error) {
            result = false;
        }

        // Cache the test result.
        this._results[name] = result;

        return result;
    }
};

