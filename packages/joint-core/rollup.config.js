import * as modules from './rollup.resources';

const JOINT = [
    modules.version,
    modules.joint
];

const LIBS_ESM = [
    modules.jquery,
    modules.lodash,
    modules.backbone,
    modules.dagre
];

const DIST = [
    modules.version,
    modules.jointCore,
    modules.geometry,
    modules.vectorizer,
].concat(modules.jointPlugins).concat(LIBS_ESM);

const TEST_BUNDLE = [
    modules.jointNoDependencies
];

export default commandLineArgs => {

    // rollup -c --config-joint
    if (commandLineArgs['config-joint']) {
        return JOINT;
    }

    // rollup -c --config-libs-esm
    if (commandLineArgs['config-libs-esm']) {
        return LIBS_ESM;
    }

    // rollup -c --config-dist
    if (commandLineArgs['config-dist']) {
        return DIST;
    }

    // rollup -c --config-test-bundle
    if (commandLineArgs['config-test-bundle']) {
        return TEST_BUNDLE;
    }

    // all
    return JOINT
        .concat(LIBS_ESM)
        .concat(DIST)
        .concat(TEST_BUNDLE);
};
