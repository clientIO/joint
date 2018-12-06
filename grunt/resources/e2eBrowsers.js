const phantomjs = require('phantomjs-prebuilt');

module.exports = {
    'chrome': {
        'browserName': 'chrome',
        'name': 'Chrome'
    },
    'chrome-linux': {
        'browserName': 'chrome',
        'platform': 'linux',
        'name': 'Chrome on Linux'
    },
    'chrome-windows7': {
        'browserName': 'chrome',
        'platform': 'windows',
        'name': 'Chrome on Windows 7'
    },
    'chrome-mac': {
        'browserName': 'chrome',
        'platform': 'mac',
        'name': 'Chrome on Mac'
    },
    'firefox': {
        'browserName': 'firefox',
        'name': 'Firefox'
    },
    'firefox-linux': {
        'browserName': 'firefox',
        'platform': 'linux',
        'name': 'Firefox on Linux'
    },
    'firefox-mac': {
        'browserName': 'firefox',
        'platform': 'mac',
        'name': 'Firefox on Mac'
    },
    'phantomjs': {
        'browserName': 'phantomjs',
        // Set the path to the PhantomJS binary.
        // Can be in different places depending upon the current environment.
        // For example, if phantomjs is on the current user's PATH (with the correct version).
        'phantomjs.binary.path': phantomjs.path,
        'name': 'PhantomJS'
    }
};
