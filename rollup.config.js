import * as modules from './rollup.resources';

const JOINT = [
    modules.joint
];

const LIBS_ESM = [
    modules.jquery,
    modules.lodash,
    modules.backbone,
    modules.dagre
];

const DIST = [
    modules.jointCore,
    modules.geometry,
    modules.vectorizer,
].concat(modules.jointPlugins).concat(LIBS_ESM);

const TEST_BUNDLE = [
    modules.jointNoDependencies
];

export default commandLineArgs => {

    if (commandLineArgs['config-joint']) {
        return JOINT;
    }

    if (commandLineArgs['config-libs-esm']) {
        return LIBS_ESM;
    }

    if (commandLineArgs['config-dist']) {
        return DIST;
    }

    if (commandLineArgs['config-test-bundle']) {
        return TEST_BUNDLE;
    }

    // all
    return JOINT
        .concat(LIBS_ESM)
        .concat(DIST)
        .concat(TEST_BUNDLE);
}
