export default class HashStore {
    constructor() {
        this._hash = {};
        this._length = Infinity;
    }

    get(i) {
        return +(this._hash[i] !== undefined);
    }

    set(i, v) {
        return this._hash[i] = v;
    }

    remove(i) {
        delete this._hash[i];
    }

    item(i) {
        return this._hash[i];
    }

    get length() {
        return this._length;
    }

    set length(l) {
        return this._length = l;
    }
}
