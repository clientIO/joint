const core = require('../resources/core');

module.exports = function(grunt) {

    return {
        types: {
            src: [
                'packages/core/types/joint.head.d.ts',
                'packages/core/types/geometry.d.ts',
                'packages/core/types/vectorizer.d.ts',
                'packages/core/types/joint.d.ts'
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
    };
};
