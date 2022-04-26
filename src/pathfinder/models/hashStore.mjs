/*eslint-env es6 */
export default class HashStore {
    constructor() {
        this._hash = new Map();
        this._length = Infinity;
    }

    // for ndarray to work has to return 0 or 1
    get(i) {
        return this._hash.has(i) << 0;
    }

    set(i, v) {
        return this._hash.set(i, v);
    }

    remove(i) {
        this._hash.delete(i);
    }

    // get actual item
    item(i) {
        return this._hash.get(i);
    }

    get length() {
        return this._length;
    }

    set length(l) {
        this._length = l;
    }
}
