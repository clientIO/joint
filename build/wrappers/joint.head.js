(function(root, factory) {

    if (typeof define === 'function' && define.amd) {

        // For AMD.

        define(['backbone', 'lodash', 'jquery', 'g', 'V', 'graphlib', 'dagre'], function(Backbone, _, $, g, V, graphlib, dagre) {

            Backbone.$ = $;

            return factory(root, Backbone, _, $, g, V, graphlib, dagre);
        });

    } else if (typeof exports !== 'undefined') {

        // For Node.js or CommonJS.

        var Backbone = require('backbone');
        var _ = require('lodash');
        var $ = Backbone.$ = require('jquery');
        var g = require('./geometry');
        var V = require('./vectorizer');
        var graphlib = require('graphlib');
        var dagre = require('dagre');

        module.exports = factory(root, Backbone, _, $, g, V, graphlib, dagre);

    } else {

        // As a browser global.

        var Backbone = root.Backbone;
        var _ = root._;
        var $ = Backbone.$ = root.jQuery || root.$;
        var g = root.g;
        var V = root.V;
        var graphlib = root.graphlib;
        var dagre = root.dagre;

        root.joint = factory(root, Backbone, _, $, g, V, graphlib, dagre);
    }

}(this, function(root, Backbone, _, $, g, V, graphlib, dagre) {
