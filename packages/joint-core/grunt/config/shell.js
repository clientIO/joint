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
    'dts-generator': {
        command: 'dts-bundle-generator --config=dts-generator.config.js'
    }
};
