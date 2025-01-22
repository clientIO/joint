import { createRequire } from 'node:module';
import inject from '@rollup/plugin-inject';
import type { Plugin } from 'vite';

// Inspired by https://github.com/davidmyersdev/vite-plugin-node-polyfills

const toRegExp = (text: string) => {
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
    const escapedText = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    return new RegExp(`^${escapedText}$`);
};

const globalMockBanners = {
    zbynek: [
        `import __zbynek_polyfill from '@joint/vite-plugin-mock-svg/mocks/zbynek'`,
        `globalThis.zbynek = globalThis.zbynek || __zbynek_polyfill`,
    ],
    zbynek2: [
        `import '@joint/vite-plugin-mock-svg/mocks/zbynek2'`,
    ],
    SVGPathElement: [
        `import __SVGPathElement_polyfill from '@joint/vite-plugin-mock-svg/mocks/SVGPathElement'`,
        `globalThis.SVGPathElement = globalThis.SVGPathElement || __SVGPathElement_polyfill`,
    ],
    SVGAngle: [
        `import '@joint/vite-plugin-mock-svg/mocks/SVGAngle'`,
    ],
};

export const mockSVG = (): Plugin => {

    const require = createRequire(import.meta.url);
    const globalMockPaths = [
        ...[require.resolve('@joint/vite-plugin-mock-svg/mocks/zbynek')],
        ...[require.resolve('@joint/vite-plugin-mock-svg/mocks/zbynek2')],
        ...[require.resolve('@joint/vite-plugin-mock-svg/mocks/SVGPathElement')],
        ...[require.resolve('@joint/vite-plugin-mock-svg/mocks/SVGAngle')],
    ];

    const globalMocksBanner = [
        ...globalMockBanners.zbynek,
        ...globalMockBanners.zbynek2,
        ...globalMockBanners.SVGPathElement,
        ...globalMockBanners.SVGAngle,
        ``,
    ].join('\n');

    return {
        name: 'vite-plugin-mock-svg',

        config: (_config, env) => {
            const isDev = (env.command === 'serve');

            const mocksToInject = {
                // https://github.com/niksy/node-stdlib-browser/blob/3e7cd7f3d115ac5c4593b550e7d8c4a82a0d4ac4/README.md#vite
                ...{ zbynek: '@joint/vite-plugin-mock-svg/mocks/zbynek' },
                ...{ zbynek2: '@joint/vite-plugin-mock-svg/mocks/zbynek2' },
                ...{ SVGPathElement: '@joint/vite-plugin-mock-svg/mocks/SVGPathElement' },
                ...{ SVGAngle: '@joint/vite-plugin-mock-svg/mocks/SVGAngle' },
            };

            return {
                build: {
                    rollupOptions: {
                        plugins: Object.keys(mocksToInject).length > 0 ? [inject(mocksToInject)] : [],
                    },
                },
                esbuild: {
                    // In dev, the global polyfills need to be injected as a banner in order for isolated scripts (such as Vue SFCs) to have access to them.
                    banner: isDev ? globalMocksBanner : undefined,
                },
                optimizeDeps: {
                    exclude: [
                        ...globalMockPaths,
                    ],
                    esbuildOptions: {
                        banner: isDev ? { js: globalMocksBanner } : undefined,
                        // https://github.com/niksy/node-stdlib-browser/blob/3e7cd7f3d115ac5c4593b550e7d8c4a82a0d4ac4/README.md?plain=1#L203-L209
                        define: {
                            ...{ zbynek: 'zbynek' },
                            ...{ zbynek2: 'zbynek2' },
                            ...{ SVGPathElement: 'SVGPathElement' },
                            ...{ SVGAngle: 'SVGAngle' },
                        },
                        inject: [
                            ...globalMockPaths,
                        ],
                        plugins: [
                            // Suppress the 'injected path "..." cannot be marked as external' error in Vite 4 (emitted by esbuild).
                            // https://github.com/evanw/esbuild/blob/edede3c49ad6adddc6ea5b3c78c6ea7507e03020/internal/bundler/bundler.go#L1469
                            {
                                name: 'vite-plugin-mock-svg-mocks-resolver',
                                setup(build) {
                                    for (const globalMockPath of globalMockPaths) {
                                        const globalMocksFilter = toRegExp(globalMockPath);

                                        // https://esbuild.github.io/plugins/#on-resolve
                                        build.onResolve({ filter: globalMocksFilter }, () => {
                                            return {
                                                // https://github.com/evanw/esbuild/blob/edede3c49ad6adddc6ea5b3c78c6ea7507e03020/internal/bundler/bundler.go#L1468
                                                external: false,
                                                path: globalMockPath,
                                            }
                                        });
                                    }
                                },
                            },
                        ],
                    },
                },
            };
        },
    };
};

export default mockSVG;
