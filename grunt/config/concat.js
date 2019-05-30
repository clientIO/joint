const core = require('../resources/core');

module.exports = function(grunt) {

    const utils = require('../resources/utils')(grunt);

    return {
        types: {
            src: [
                'types/joint.head.d.ts',
                'types/geometry.d.ts',
                'types/vectorizer.d.ts',
                'types/joint.d.ts'
            ],
            dest:
                'build/joint.d.ts'
        },
        joint: {
            options: {
                process: {
                    options: {
                        data: utils.pkg
                    },
                    delimiters: 'square'
                }
            },
            files: {
                'build/joint.core.css':
                    [].concat(
                        core.css
                    ),
                'build/joint.css':
                    [].concat(
                        core.css,
                    )
            }
        }
    }
};
