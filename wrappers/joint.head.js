(function(root, factory) {

    if (typeof define === 'function' && define.amd) {

        // For AMD.

        define(['backbone', 'lodash', 'jquery'], function(Backbone, _, $) {

            Backbone.$ = $;

            return factory(root, Backbone, _, $);
        });

    } else if (typeof exports !== 'undefined') {

        // For Node.js or CommonJS.

        var Backbone = require('backbone');
        var _ = require('lodash');
        var $ = Backbone.$ = require('jquery');

        module.exports = factory(root, Backbone, _, $);

    } else {

        // As a browser global.

        var Backbone = root.Backbone;
        var _ = root._;
        var $ = Backbone.$ = root.jQuery || root.$;

        root.joint = factory(root, Backbone, _, $);
        root.g = root.joint.g;
        root.V = root.Vectorizer = root.joint.V;
    }

}(this, function(root, Backbone, _, $) {
