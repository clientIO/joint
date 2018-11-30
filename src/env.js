export const env = {

    _results: {},

    _tests: {

        svgforeignobject: function() {
            return !!document.createElementNS &&
                /SVGForeignObject/.test(({}).toString.call(document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject')));
        }
    },

    addTest: function(name, fn) {

        return env._tests[name] = fn;
    },

    test: function(name) {

        const fn = env._tests[name];

        if (!fn) {
            throw new Error('Test not defined ("' + name + '"). Use `joint.env.addTest(name, fn) to add a new test.`');
        }

        let result = env._results[name];

        if (typeof result !== 'undefined') {
            return result;
        }

        try {
            result = fn();
        } catch (error) {
            result = false;
        }

        // Cache the test result.
        env._results[name] = result;

        return result;
    }
};
