const modules = require('../resources/es6');

module.exports = {

    js: [
        modules.jointCore.iife,
    ],

    css: [
        'css/layout.css',
        'css/themes/*.css'
    ]
};
