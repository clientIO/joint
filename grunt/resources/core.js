const modules = require('../resources/esm');

module.exports = {

    js: [
        modules.jointCore.iife,
    ],

    css: [
        'packages/core/css/layout.css',
        'packages/core/css/themes/*.css'
    ]
};
