import type { Plugin } from 'vite';

export type { MockedSVGElement } from '@joint/mock-svg';

// Inspired by https://github.com/davidmyersdev/vite-plugin-node-polyfills

export const mockSVG = (): Plugin => {

    // The mocks live in `@joint/mock-svg`; `./mocks` here is just a re-export.
    // - But we need the indirection to make sure `@joint/mock-svg` resolves.
    //
    // Problem: Specifiers are resolved starting from the file with the import.
    // - But `mocksBanner` is put into consumer's files.
    // - Consumers only declare `@joint/vitest-plugin-mock-svg` in dependencies.
    // - So `@joint/mock-svg` is only a transitive dependency.
    // - (Unreachable in strict resolution layouts e.g. PNPM default, Yarn PnP.)
    //
    // Solution: Our own subpath as `mocksPackageName`.
    // - It always resolves since the consumer explicitly installed the package.
    // - So the `@joint/mock-svg` import is inside our package.
    // - And the dependency can be resolved starting from that subpath.
    const mocksPackageName = '@joint/vitest-plugin-mock-svg/mocks';
    const mocksBanner = `import '${mocksPackageName}'`;

    return {
        name: 'vitest-plugin-mock-svg',

        config: () => {
            return {
                esbuild: {
                    banner: mocksBanner,
                },
            };
        },
    };
};

export default mockSVG;
