(function() {

    if (typeof QUnit === 'undefined') {
        throw new Error('QUnit has not been loaded yet.');
    }

    var urlParams;

    (window.onpopstate = function() {

        var match;
        var pl  = /\+/g;// Regex for replacing addition symbol with a space
        var search = /([^&=]+)=?([^&]*)/g;
        var decode = function(s) {
            return decodeURIComponent(s.replace(pl, ' '));
        };
        var query = window.location.search.substring(1);

        urlParams = {};

        while ((match = search.exec(query))) {
            urlParams[decode(match[1])] = decode(match[2]);
        }

    })();

    var origin = window.location.protocol + '//' + window.location.host;

    var reporters = {

        // For lcov formatting information:
        // http://ltp.sourceforge.net/coverage/lcov/geninfo.1.php
        lcov: function(coverageData) {

            buffer || (buffer = '');

            var fileName, lineNumber, executionCount;

            for (fileName in coverageData.files) {

                buffer += 'SF:' + fileName.substr(origin.length) + '\n';

                for (lineNumber = 0; lineNumber < coverageData.files[fileName].source.length; lineNumber++) {
                    if (typeof coverageData.files[fileName][lineNumber] !== 'undefined') {
                        executionCount = coverageData.files[fileName][lineNumber];
                        buffer += 'DA:' + lineNumber + ',' + executionCount + '\n';
                    }
                }

                buffer += 'end_of_record\n';
            }
        }
    };

    var coverage = urlParams['coverage'];
    var reporter = urlParams['reporter'];

    if (coverage === 'true' && reporter) {

        if (!reporters[reporter]) {
            throw new Error('Reporter does not exist: "' + reporter + '"');
        }

        var buffer;

        blanket.options('reporter', reporters[reporter]);

        QUnit.done(function() {

            alert(JSON.stringify(['qunit.report', buffer]));
        });
    }

})();
