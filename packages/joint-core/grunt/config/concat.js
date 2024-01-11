module.exports = function(grunt) {

    return {
        types: {
            src: [
                'types/joint.head.d.ts',
                'build/api-extractor/joint.d.ts'
            ],
            dest:
                'build/joint.d.ts'
        }
    };
};
