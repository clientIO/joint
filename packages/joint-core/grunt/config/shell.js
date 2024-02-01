module.exports = {
    'rollup-joint': {
        command: 'rollup -c --config-joint'
    },
    'rollup-dist': {
        command: 'rollup -c --config-dist'
    },
    'rollup-test-bundle': {
        command: 'rollup -c --config-test-bundle'
    },
    'api-extractor-dts-bundle': {
        command: 'api-extractor run'
    }
};
