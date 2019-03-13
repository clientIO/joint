// Global namespace.

var joint = {

    version: '[%= pkg.version %]',

    // `joint.dia` namespace.
    dia: {},

    // `joint.ui` namespace.
    ui: {},

    // `joint.layout` namespace.
    layout: {},

    // `joint.shapes` namespace.
    shapes: {},

    // `joint.format` namespace.
    format: {},

    // `joint.connectors` namespace.
    connectors: {},

    // `joint.highlighters` namespace.
    highlighters: {},

    // `joint.routers` namespace.
    routers: {},

    // `joint.anchors` namespace.
    anchors: {},

    // `joint.connectionPoints` namespace.
    connectionPoints: {},

    // `joint.connectionStrategies` namespace.
    connectionStrategies: {},

    // `joint.linkTools` namespace.
    linkTools: {},

    // `joint.mvc` namespace.
    mvc: {
        views: {}
    },

    setTheme: function(theme, opt) {

        opt = opt || {};

        joint.util.invoke(joint.mvc.views, 'setTheme', theme, opt);

        // Update the default theme on the view prototype.
        joint.mvc.View.prototype.defaultTheme = theme;
    },

    // `joint.env` namespace.
    env: {

        _results: {},

        _tests: {

            svgforeignobject: function() {
                return !!document.createElementNS &&
              /SVGForeignObject/.test(({}).toString.call(document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject')));
            }
        },

        addTest: function(name, fn) {

            return joint.env._tests[name] = fn;
        },

        test: function(name) {

            var fn = joint.env._tests[name];

            if (!fn) {
                throw new Error('Test not defined ("' + name + '"). Use `joint.env.addTest(name, fn) to add a new test.`');
            }

            var result = joint.env._results[name];

            if (typeof result !== 'undefined') {
                return result;
            }

            try {
                result = fn();
            } catch (error) {
                result = false;
            }

            // Cache the test result.
            joint.env._results[name] = result;

            return result;
        }
    },

    util: {}
};
