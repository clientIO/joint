export const env = {

    _results: {},

    _tests: {

        svgforeignobject: function() {
            return !!document.createElementNS &&
                /SVGForeignObject/.test(({}).toString.call(document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject')));
        },

        // works for: (1) macOS Safari, (2) any WKWebView, (3) any iOS browser (including Safari, CriOS, EdgiOS, OPR, FxiOS)
        isAppleWebKit: function() {
            const userAgent = navigator.userAgent;
            const isAppleWebKit = /applewebkit/i.test(userAgent);
            const isChromium = /chrome/i.test(userAgent); // e.g. Chrome, Edge, Opera, SamsungBrowser
            return isAppleWebKit && !isChromium;
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
        } catch {
            result = false;
        }

        // Cache the test result.
        this._results[name] = result;

        return result;
    }
};
