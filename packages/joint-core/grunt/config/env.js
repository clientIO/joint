const e2eBrowsers = require('../resources/e2eBrowsers');

module.exports = function(grunt) {

    const config = {};

    Object.keys(e2eBrowsers).forEach(function(key) {

        const browser = e2eBrowsers[key];

        config[key] = {
            E2E_DESIRED: JSON.stringify(browser)
        };
    });

    return config;
};
