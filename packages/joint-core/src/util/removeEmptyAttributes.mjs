import { isObject, isEmpty } from './utilHelpers.mjs';

// Recursive predicate-driven removal. The predicate `(key, path) => boolean` is
// invoked bottom-up for every empty `{}` encountered; returning truthy drops the
// key. A parent that becomes empty after its children are removed is itself a
// candidate.
export function removeEmptyAttributes(obj, predicate, path) {

    for (const key in obj) {

        const objValue = obj[key];
        const isRealObject = isObject(objValue) && !Array.isArray(objValue);

        if (!isRealObject) continue;

        const childPath = path ? path.concat(key) : [key];
        removeEmptyAttributes(objValue, predicate, childPath);

        if (isEmpty(objValue) && predicate(key, childPath)) {
            delete obj[key];
        }
    }
}

// Default predicate for `ignoreEmptyAttributes: true` — drops top-level
// empties only, preserving the original (pre-recursive) behavior.
export const removeAtTopLevelOnly = (_key, path) => path.length === 1;
