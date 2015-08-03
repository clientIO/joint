(function(root, factory) {

    if (typeof define === 'function' && define.amd) {

        // For AMD.

        define(['backbone', 'lodash', 'jquery', 'g', 'V'], function(Backbone, _, $, g, V) {

            Backbone.$ = $;

            return factory(root, Backbone, _, $, g, V);
        });

    } else if (typeof exports !== 'undefined') {

        // For Node.js or CommonJS.

        var Backbone = require('backbone');
        var _ = require('lodash');
        var $ = Backbone.$ = require('jquery');
        var g = require('./geometry');
        var V = require('./vectorizer');

        module.exports = factory(root, Backbone, _, $, g, V);

    } else {

        // As a browser global.

        var Backbone = root.Backbone;
        var _ = root._;
        var $ = Backbone.$ = root.jQuery || root.$;
        var g = root.g;
        var V = root.V;

        root.joint = factory(root, Backbone, _, $, g, V);
    }

}(this, function(root, Backbone, _, $, g, V) {
