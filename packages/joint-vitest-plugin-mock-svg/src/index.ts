import { createRequire } from 'node:module';
import inject from '@rollup/plugin-inject';
import type { Plugin } from 'vite';

// Inspired by https://github.com/davidmyersdev/vite-plugin-node-polyfills

export const mockSVG = (): Plugin => {

    const mocksPackageName = '@joint/vitest-plugin-mock-svg/mocks';

    const require = createRequire(import.meta.url);
    const mocksPath = require.resolve(mocksPackageName);
    const mocksBanner = `import '${mocksPackageName}'`;

    return {
        name: 'vitest-plugin-mock-svg',

        config: () => {
            return {
                build: {
                    rollupOptions: {
                        plugins: inject({ mocks: mocksPackageName }),
                    },
                },
                esbuild: {
                    banner: mocksBanner,
                },
                optimizeDeps: {
                    exclude: [
                        mocksPath,
                    ],
                    esbuildOptions: {
                        banner: { js: mocksBanner },
                        define: {
                            mocks: 'mocks',
                        },
                        inject: [
                            mocksPath,
                        ],
                    },
                },
            };
        },
        configResolved: (resolvedConfig) => {
            console.log('resolved config: '+JSON.stringify(resolvedConfig));
        }
    };
};

export default mockSVG;
