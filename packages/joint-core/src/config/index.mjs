export const config = {
    // How the cell attributes are merged when `cell.prop()` is called.
    // DEFAULT: the arrays are merged into the source array.
    cellMergeStrategy: null,
    // How the cell default attributes are merged with the attributes provided
    // in the cell constructor.
    // DEFAULT: the arrays are merged by replacing the source array
    // with the destination array.
    cellDefaultsMergeStrategy: null,
    // When set to `true` the cell selectors could be defined as CSS selectors.
    // If not, only JSON Markup selectors are taken into account.
    useCSSSelectors: false,
    // The class name prefix config is for advanced use only.
    // Be aware that if you change the prefix, the JointJS CSS will no longer function properly.
    classNamePrefix: 'joint-',
    defaultTheme: 'default',
    // The maximum delay required for two consecutive touchend events to be interpreted
    // as a double-tap.
    doubleTapInterval: 300,
    // Name of the attribute used to store the layer id on the cell model.
    layerAttribute: 'layer',
};
