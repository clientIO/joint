module.exports = function(grunt) {

    return {
        types: {
            src: [
                'types/joint.head.d.ts',
                'build/dts-generator/joint.d.ts'
            ],
            dest:
                'build/joint.d.ts'
        }
    };
};
