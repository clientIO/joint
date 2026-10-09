import { cloneDeep, merge } from '../util/index.mjs';

// A label as given (own `markup`/`attrs`/`size`/`position`, any of which may be missing),
// computed against `link`'s `defaultLabel` and its built-in default.
export function getComputedLabel(link, label = {}) {
    const builtinDefaultLabel = link._builtins.defaultLabel;
    const defaultLabel = link._getDefaultLabel();

    // A label's own or `defaultLabel`'s markup, if either is set, is "custom" - the
    // built-in default attrs (`builtinDefaultLabelAttrs`) only make sense for the
    // built-in markup, so they don't apply once a custom one is in play.
    const hasCustomMarkup = !!(label.markup || defaultLabel.markup);

    // The computed `markup`/`attrs`/`size`/`position` are always new objects - never the
    // stored label's, `defaultLabel`'s or the (shared by all links) built-in default's -
    // so mutating a computed label can't change them. Custom properties are passed through as-is.
    return Object.assign({}, defaultLabel, label, {
        markup: cloneDeep(label.markup || defaultLabel.markup || builtinDefaultLabel.markup),
        attrs: mergeLabelAttrs(hasCustomMarkup, label.attrs, defaultLabel.attrs, builtinDefaultLabel.attrs),
        size: mergeLabelSize(label.size, defaultLabel.size, builtinDefaultLabel.size),
        position: mergeLabelPosition(label.position, defaultLabel.position, builtinDefaultLabel.position)
    });
}

// Only a label's `position`, computed exactly as in `getComputedLabel()` - for callers that need
// nothing else (e.g. `LinkView`'s frequent label position updates), so the label's `markup`,
// `attrs` and `size` aren't cloned or merged for nothing.
export function getComputedLabelPosition(link, label = {}) {
    const builtinDefaultLabel = link._builtins.defaultLabel;
    const defaultLabel = link._getDefaultLabel();

    return mergeLabelPosition(label.position, defaultLabel.position, builtinDefaultLabel.position);
}

// merge default label attrs into label attrs (or use built-in default label attrs if neither is provided)
// keep `undefined` or `null` because `{}` means something else
function mergeLabelAttrs(hasCustomMarkup, labelAttrs, defaultLabelAttrs, builtinDefaultLabelAttrs) {

    if (labelAttrs === null) return null;
    if (labelAttrs === undefined) {

        if (defaultLabelAttrs === null) return null;
        if (defaultLabelAttrs === undefined) {

            if (hasCustomMarkup) return undefined;
            return merge({}, builtinDefaultLabelAttrs);
        }

        if (hasCustomMarkup) return merge({}, defaultLabelAttrs);
        return merge({}, builtinDefaultLabelAttrs, defaultLabelAttrs);
    }

    if (hasCustomMarkup) return merge({}, defaultLabelAttrs, labelAttrs);
    return merge({}, builtinDefaultLabelAttrs, defaultLabelAttrs, labelAttrs);
}

// merge label size with default label size and built-in default label size
// the result is always a size object (`null` or `undefined` falls back to the defaults)
function mergeLabelSize(labelSize, defaultLabelSize, builtinDefaultLabelSize) {

    return merge({}, builtinDefaultLabelSize, defaultLabelSize, labelSize);
}

// merge label position with default label position and built-in default label position
// keep `null` (an invalid position, set on purpose), only `undefined` falls back to the defaults
function mergeLabelPosition(labelPosition, defaultLabelPosition, builtinDefaultLabelPosition) {

    if (labelPosition === null) return null;
    return merge(
        {},
        builtinDefaultLabelPosition,
        normalizeLabelPosition(defaultLabelPosition),
        normalizeLabelPosition(labelPosition)
    );
}

// if label position is a number, normalize it to a position object
// this makes sure that label positions can be merged properly
function normalizeLabelPosition(labelPosition) {

    if (typeof labelPosition === 'number') {
        return {
            distance: labelPosition,
            offset: 0,
            angle: 0,
            args: null
        };
    }
    return labelPosition;
}
