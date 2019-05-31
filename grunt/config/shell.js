module.exports = {
    rollup: {
        command: 'rollup -c'
    },
    'test-bundle': {
        command: 'rollup -c rollup.test-bundle.js'
    },
    'libs-esm': {
        command:'rollup -c rollup.libs-esm.config.js'
    }
};

