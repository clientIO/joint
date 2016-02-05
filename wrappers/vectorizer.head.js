(function(root, factory) {

    if (typeof define === 'function' && define.amd) {

        // AMD. Register as an anonymous module.
        define(['g'], function(g) {
            return factory(g);
        });

    } else if (typeof exports === 'object') {

        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        var g = require('./geometry');

        module.exports = factory(g);

    } else {

        // Browser globals.
        var g = root.g;

        root.Vectorizer = root.V = factory(g);
    }

}(this, function(g) {
