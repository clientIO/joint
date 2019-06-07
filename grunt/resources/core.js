const modules = require('../resources/esm');

module.exports = {

    js: [
        modules.jointCore.iife,
    ],

    css: [
        'css/layout.css',
        'css/themes/*.css'
    ]
};
