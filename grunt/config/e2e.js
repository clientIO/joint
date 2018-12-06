module.exports = function(grunt) {

    const e2eBrowsers = require('../resources/e2eBrowsers');

    Object.keys(e2eBrowsers).forEach(function(key) {
        grunt.registerTask('test:e2e:' + key, [
            'env:' + key,
            'mochaTest:e2e'
        ]);
    });
};

