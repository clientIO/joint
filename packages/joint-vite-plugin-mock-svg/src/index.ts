import { createRequire } from 'node:module';
import inject from '@rollup/plugin-inject';
import type { Plugin } from 'vite'

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
};

//const POLYFILL_ID = '\0mock-svg';
//const PROXY_SUFFIX = '?mock-svg-proxy';

export const mockSVG = (): Plugin => {

    const require = createRequire(import.meta.url);
    const globalMockPaths = [
        ...[require.resolve('@joint/vite-plugin-mock-svg/mocks/zbynek')],
    ];

    const globalMocksBanner = [
        ...globalMockBanners.zbynek,
        ``,
    ].join('\n');

    return {
        name: 'vite-plugin-mock-svg',

        config: (_config, env) => {
            const isDev = (env.command === 'serve');

            const mocksToInject = {
                // https://github.com/niksy/node-stdlib-browser/blob/3e7cd7f3d115ac5c4593b550e7d8c4a82a0d4ac4/README.md#vite
                ...{ zbynek: '@joint/vite-plugin-mock-svg/mocks/zbynek' },
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

        /*async resolveId(source, importer, options) {
            // We prefix the polyfill id with \0 to tell other plugins not to try to load or
            // transform it
            if (source === POLYFILL_ID) {
                // It is important that side effects are always respected
                // for polyfills, otherwise using
                // "treeshake.moduleSideEffects: false" may prevent the
                // polyfill from being included.
                return { id: POLYFILL_ID, moduleSideEffects: true };
            }
            if (options.isEntry) {
                // Determine what the actual entry would have been.
                const resolution = await this.resolve(source, importer, options);
                // If it cannot be resolved or is external, just return it
                // so that Rollup can display an error
                if (!resolution || resolution.external) return resolution;
                // In the load hook of the proxy, we need to know if the
                // entry has a default export. There, however, we no longer
                // have the full "resolution" object that may contain
                // meta-data from other plugins that is only added on first
                // load. Therefore we trigger loading here.
                const moduleInfo = await this.load(resolution);
                // We need to make sure side effects in the original entry
                // point are respected even for
                // treeshake.moduleSideEffects: false. "moduleSideEffects"
                // is a writable property on ModuleInfo.
                moduleInfo.moduleSideEffects = true;
                // It is important that the new entry does not start with
                // \0 and has the same directory as the original one to not
                // mess up relative external import generation. Also
                // keeping the name and just adding a "?query" to the end
                // ensures that preserveModules will generate the original
                // entry name for this entry.
                return `${resolution.id}${PROXY_SUFFIX}`;
            }
            return null;
        },
        load(id) {
            if (id === POLYFILL_ID) {
                // Replace with actual polyfill
                return "console.log('mock-svg loaded');globalThis.polyfill = 'mock-svg'";
            }
            if (id.endsWith(PROXY_SUFFIX)) {
                const entryId = id.slice(0, -PROXY_SUFFIX.length);
                // We know ModuleInfo.hasDefaultExport is reliable because
                // we awaited this.load in resolveId
                const { hasDefaultExport } = this.getModuleInfo(entryId);
                let code =
                    `import ${JSON.stringify(POLYFILL_ID)};` +
                    `export * from ${JSON.stringify(entryId)};`;
                // Namespace reexports do not reexport default, so we need
                // special handling here
                if (hasDefaultExport) {
                    code += `export { default } from ${JSON.stringify(entryId)};`;
                }
                return code;
            }
            return null;
        },*/

        /*load: () => {
            // Mock methods which are not implemented in JSDOM

            //console.log(globalThis);
            globalThis.hello = 'hello world';
            //return { moduleSideEffects: true };

            //console.log('hello world');

            globalThis.SVGPathElement = vi.fn();

            globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
                observe: vi.fn(),
                unobserve: vi.fn(),
                disconnect: vi.fn(),
            }));

            Object.defineProperty(globalThis, 'SVGAngle', {
                writable: true,
                value: vi.fn().mockImplementation(() => ({
                    new: vi.fn(),
                    prototype: vi.fn(),
                    SVG_ANGLETYPE_UNKNOWN: 0,
                    SVG_ANGLETYPE_UNSPECIFIED: 1,
                    SVG_ANGLETYPE_DEG: 2,
                    SVG_ANGLETYPE_RAD: 3,
                    SVG_ANGLETYPE_GRAD: 4
                }))
            });

            const SVGMatrix = ({
                a: 0,
                b: 0,
                c: 0,
                d: 0,
                e: 0,
                f: 0,
                flipX: vi.fn().mockImplementation(() => SVGMatrix),
                flipY: vi.fn().mockImplementation(() => SVGMatrix),
                inverse: vi.fn().mockImplementation(() => SVGMatrix),
                multiply: vi.fn().mockImplementation(() => SVGMatrix),
                rotate: vi.fn().mockImplementation(() => SVGMatrix),
                rotateFromVector: vi.fn().mockImplementation(() => SVGMatrix),
                scale: vi.fn().mockImplementation(() => SVGMatrix),
                scaleNonUniform: vi.fn().mockImplementation(() => SVGMatrix),
                skewX: vi.fn().mockImplementation(() => SVGMatrix),
                skewY: vi.fn().mockImplementation(() => SVGMatrix),
                translate: vi.fn().mockImplementation(() => SVGMatrix),
            });

            Object.defineProperty(globalThis.SVGSVGElement.prototype, 'createSVGMatrix', {
                writable: true,
                value: vi.fn().mockImplementation(() => SVGMatrix),
            });

            Object.defineProperty(globalThis.SVGSVGElement.prototype, 'createSVGPoint', {
                writable: true,
                value: vi.fn().mockImplementation(() => ({
                    x: 0,
                    y: 0,
                    matrixTransform: vi.fn().mockImplementation(() => ({
                        x: 0,
                        y: 0,
                    })),
                })),
            });

            Object.defineProperty(globalThis.SVGSVGElement.prototype, 'createSVGTransform', {
                writable: true,
                value: vi.fn().mockImplementation(() => ({
                    angle: 0,
                    matrix: {
                        a: 1,
                        b: 0,
                        c: 0,
                        d: 1,
                        e: 0,
                        f: 0,
                        multiply: vi.fn(),
                    },
                    setMatrix: vi.fn(),
                    setTranslate: vi.fn(),
                })),
            });
        },*/

        /*config: () => ({
            test: {
                setupFiles: [
                    './setup.js',
                ],
            },
        }),*/

        /*enforce: "post",
        transformIndexHtml(html) {
            return html.replace(
                "</head>",
                `<script type="module">
                    import vi from '${resolve("vitest")}';
                    globalThis.SVGPathElement = vi.fn();
                </script></head>`
            );
        },*/
    }
};

export default mockSVG;
