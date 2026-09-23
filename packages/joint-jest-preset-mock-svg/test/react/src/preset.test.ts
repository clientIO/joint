import preset from '../../../jest-preset';

// `transformIgnorePatterns` matches the files Jest will NOT transform, so a
// path matching the pattern is left as-is and one that does not is compiled.
// Asserting the regex rather than the array's contents means a rewrite of the
// pattern still has to keep its meaning.
describe('transformIgnorePatterns', () => {

    const matches = (path: string) =>
        preset.transformIgnorePatterns.some((pattern: string) => new RegExp(pattern).test(path));

    it('lets the @joint packages be transformed', () => {
        expect(matches('/repo/node_modules/@joint/core/index.js')).toBe(false);
        expect(matches('/repo/node_modules/@joint/plus/joint-plus.js')).toBe(false);
    });

    it('leaves every other dependency untransformed', () => {
        expect(matches('/repo/node_modules/react/index.js')).toBe(true);
        expect(matches('/repo/node_modules/lodash/lodash.js')).toBe(true);
    });

});
