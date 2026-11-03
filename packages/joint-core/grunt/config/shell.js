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
    },
    // Node.js tests
    'mocha-server': {
        command: 'mocha --reporter spec "test/*-nodejs/*"'
    },
    // Type-check the TypeScript definition tests - emit nothing
    'ts-test': {
        command: 'tsc --noEmit -p test/ts/tsconfig.json'
    },
    'ts-test-exports': {
        command: 'tsc --noEmit -p test/ts-exports/tsconfig.json'
    }
};
