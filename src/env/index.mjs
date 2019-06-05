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
