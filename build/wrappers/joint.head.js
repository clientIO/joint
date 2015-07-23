(function(root, factory) {

    if (typeof define === 'function' && define.amd) {

        // For AMD.

        define(function() {

            return factory(root);
        });

    } else if (typeof exports !== 'undefined') {

        // For Node.js or CommonJS.

        module.exports = factory(root);

    } else {

        // As a browser global.

        root.joint = factory(root);
    }

}(this, function(root) {
