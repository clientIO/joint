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
        }
    };
};
