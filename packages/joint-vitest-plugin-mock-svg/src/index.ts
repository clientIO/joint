import type { Plugin } from 'vite';

// Inspired by https://github.com/davidmyersdev/vite-plugin-node-polyfills

export const mockSVG = (): Plugin => {

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
