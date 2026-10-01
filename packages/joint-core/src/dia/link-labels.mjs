import { merge } from '../util/index.mjs';

// A label as given (own `markup`/`attrs`/`size`/`position`, any of which may be missing),
// resolved against `link`'s `defaultLabel` and its built-in default.
export function getComputedLabel(link, label) {

    label = label || {};

    const builtinDefaultLabel = link._builtins.defaultLabel;
    const defaultLabel = link._getDefaultLabel();

    // A label's own or `defaultLabel`'s markup, if either is set, is "custom" - the
    // built-in default attrs (`builtinDefaultLabelAttrs`) only make sense for the
    // built-in markup, so they don't apply once a custom one is in play.
    const hasCustomMarkup = !!(label.markup || defaultLabel.markup);

    return Object.assign({}, defaultLabel, label, {
        markup: label.markup || defaultLabel.markup || builtinDefaultLabel.markup,
        attrs: mergeLabelAttrs(hasCustomMarkup, label.attrs, defaultLabel.attrs, builtinDefaultLabel.attrs),
        size: mergeLabelSize(label.size, defaultLabel.size),
        position: mergeLabelPositionProperty(
            normalizeLabelPosition(label.position),
            getDefaultLabelPositionProperty(link, defaultLabel)
        )
    });
}

// merge default label attrs into label attrs (or use built-in default label attrs if neither is provided)
// keep `undefined` or `null` because `{}` means something else
function mergeLabelAttrs(hasCustomMarkup, labelAttrs, defaultLabelAttrs, builtinDefaultLabelAttrs) {

    if (labelAttrs === null) return null;
    if (labelAttrs === undefined) {

        if (defaultLabelAttrs === null) return null;
        if (defaultLabelAttrs === undefined) {

            if (hasCustomMarkup) return undefined;
            return builtinDefaultLabelAttrs;
        }

        if (hasCustomMarkup) return defaultLabelAttrs;
        return merge({}, builtinDefaultLabelAttrs, defaultLabelAttrs);
    }

    if (hasCustomMarkup) return merge({}, defaultLabelAttrs, labelAttrs);
    return merge({}, builtinDefaultLabelAttrs, defaultLabelAttrs, labelAttrs);
}

// merge default label size into label size (no built-in default)
// keep `undefined` or `null` because `{}` means something else
function mergeLabelSize(labelSize, defaultLabelSize) {

    if (labelSize === null) return null;
    if (labelSize === undefined) {

        if (defaultLabelSize === null) return null;
        if (defaultLabelSize === undefined) return undefined;

        return defaultLabelSize;
    }

    return merge({}, defaultLabelSize, labelSize);
}

// combine default label position with built-in default label position
function getDefaultLabelPositionProperty(link, defaultLabel) {

    const builtinDefaultLabelPosition = link._builtins.defaultLabel.position;
    const defaultLabelPosition = normalizeLabelPosition(defaultLabel.position);

    return merge({}, builtinDefaultLabelPosition, defaultLabelPosition);
}

// if label position is a number, normalize it to a position object
// this makes sure that label positions can be merged properly
function normalizeLabelPosition(labelPosition) {

    if (typeof labelPosition === 'number') return { distance: labelPosition, offset: null, angle: 0, args: null };
    return labelPosition;
}

// expects normalized position properties
// e.g. `normalizeLabelPosition(labelPosition)` and `getDefaultLabelPositionProperty(link, defaultLabel)`
function mergeLabelPositionProperty(normalizedLabelPosition, normalizedDefaultLabelPosition) {

    if (normalizedLabelPosition === null) return null;
    if (normalizedLabelPosition === undefined) {

        if (normalizedDefaultLabelPosition === null) return null;
        return normalizedDefaultLabelPosition;
    }

    return merge({}, normalizedDefaultLabelPosition, normalizedLabelPosition);
}
