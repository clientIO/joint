export default function HashStore() {
    this._hash = {};
}

HashStore.prototype.get = function(i) {
    return this._hash[i] === undefined || Object.keys(this._hash[i]).length === 0 ? 0 : 1;
}

HashStore.prototype.getItem = function(i) {
    return this._hash[i];
}

HashStore.prototype.set = function(i, v) {
    return this._hash[i] = v;
}

HashStore.prototype.remove = function(i) {
    delete this._hash[i];
}

HashStore.prototype.length = Infinity;
