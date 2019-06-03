const core = require('../resources/core');

module.exports = function(grunt) {

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
            files: {
                'build/joint.core.css':
                    [].concat(
                        core.css
                    ),
                'build/joint.css':
                    [].concat(
                        core.css
                    )
            }
        }
    }
};
