// @ts-check

/** @type import('dts-bundle-generator/config-schema').OutputOptions */
const commonOutputParams = {
    sortNodes: true,
    noBanner: true,
    exportReferencedTypes: false,
};

/** @type import('dts-bundle-generator/config-schema').BundlerConfig */
const config = {
    compilationOptions: {
        preferredConfigPath: './tsconfig.json',
        followSymlinks: false,
    },
    entries: [
        {
            filePath: './types/index.d.ts',
            outFile: './build/dts-generator/joint.d.ts',
            noCheck: true,
            libraries: {
                allowedTypesLibraries: [],
                importedLibraries: [],
                inlinedLibraries: [],
            },
            output: commonOutputParams,
        },
    ],
};

module.exports = config;
