export default class HashStore {
    constructor() {
        this._hash = {};
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
}
