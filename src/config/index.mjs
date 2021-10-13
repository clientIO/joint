export const config = {
    // When set to `true` the cell selectors could be defined as CSS selectors.
    // If not, only JSON Markup selectors are taken into account.
    // export let useCSSSelectors = true;
    useCSSSelectors: true,
    // The class name prefix config is for advanced use only.
    // Be aware that if you change the prefix, the JointJS CSS will no longer function properly.
    // export let classNamePrefix = 'joint-';
    // export let defaultTheme = 'default';
    classNamePrefix: 'joint-',
    defaultTheme: 'default',
    // The maximum delay required for two consecutive touchend events to be interpreted
    // as a double-tap.
    doubleTapInterval: 300
};
