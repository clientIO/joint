module.exports = function(grunt) {

    // JointJS banner.
    // - see also `joint-layout-directed-graph/rollup.config.mjs`
    let template = '/*! <%= pkg.title %> v<%= pkg.version %> (<%= grunt.template.today("yyyy-mm-dd") %>) - <%= pkg.description %>\n\nThis Source Code Form is subject to the terms of the Mozilla Public\nLicense, v. 2.0. If a copy of the MPL was not distributed with this\nfile, You can obtain one at http://mozilla.org/MPL/2.0/.\n*/\n\n';

    let opt = {
        data: {
            pkg: require('./utils')(grunt).pkg
        }
    };
    return grunt.template.process(template, opt);
};
