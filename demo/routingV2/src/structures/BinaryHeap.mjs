export default class BinaryHeap {

    constructor(compare = defaultCompare) {
        this.compare = compare;
        this.nodes = [];
    }

    push(x) {
        return heapPush(this.nodes, x, this.compare);
    }

    pop() {
        return heapPop(this.nodes, this.compare);
    }

    peek() {
        return this.nodes[0];
    }

    contains(x) {
        return this.nodes.indexOf(x) !== -1;
    }

    replace(x) {
        return heapReplace(this.nodes, x, this.compare);
    }

    pushpop(x) {
        return heapPushPop(this.nodes, x, this.compare);
    }

    heapify() {
        return heapify(this.nodes, this.compare);
    }

    updateItem(x) {
        return updateItem(this.nodes, x, this.compare);
    }

    clear() {
        return this.nodes = [];
    }

    empty() {
        return this.nodes.length === 0;
    }

    size() {
        return this.nodes.length;
    }

    clone() {
        const heap = new Heap();
        heap.nodes = this.nodes.slice(0);
        return heap;
    }

    toArray() {
        return this.nodes.slice(0);
    }
}

BinaryHeap.prototype.insert = BinaryHeap.prototype.push;
BinaryHeap.prototype.top = BinaryHeap.prototype.peek;
BinaryHeap.prototype.front = BinaryHeap.prototype.peek;
BinaryHeap.prototype.has = BinaryHeap.prototype.contains;
BinaryHeap.prototype.copy = BinaryHeap.prototype.clone;

const defaultCompare = function(x, y) {
    if (x < y) { return -1; }
    if (x > y) { return 1; }
    return 0;
}

const inSort = function(a, x, lo, hi, compare) {
    let mid;
    if (lo === null) {
        lo = 0;
    }

    if (compare === null) {
        compare = defaultCompare;
    }

    if (lo < 0) {
        throw new Error('lo must be non-negative');
    }

    if (hi === null) {
        hi = a.length;
    }

    while (lo < hi) {
        mid = Math.floor((lo + hi) / 2);
        if (compare(x, a[mid]) < 0) {
            hi = mid;
        } else {
            lo = mid + 1;
        }
    }

    return ([].splice.apply(a, [lo, lo - lo].concat(x)), 0);
}

const _siftDown = function(array, startPos, pos, compare) {
    let newItem, parent, parentPos;
    if (compare === null) {
        compare = defaultCompare;
    }

    newItem = array[pos];
    while(pos > startPos) {
        parentPos = (pos - 1) >> 1;
        parent = array[parentPos];
        if (compare(newItem, parent) < 0) {
            array[pos] = parent;
            pos = parentPos;
            continue;
        }
        break;
    }
    return array[pos] = newItem;
}

const _siftUp = function(array, pos, compare) {
    let childPos, endPos, newItem, rightPos, startPos;
    if (compare === null) {
        compare = defaultCompare;
    }

    endPos = array.length;
    startPos = pos;
    newItem = array[pos];
    childPos = 2 * pos + 1;

    while(childPos < endPos) {
        rightPos = childPos + 1;
        if (rightPos < endPos && !(compare(array[childPos], array[rightPos]) < 0)) {
            childPos = rightPos;
        }

        array[pos] = array[childPos];
        pos = childPos;
        childPos = 2 * pos + 1;
    }
    array[pos] = newItem;
    return _siftDown(array, startPos, pos, compare);
}

const heapPush = function(array, item, compare) {
    if (compare === null) {
        compare = defaultCompare;
    }

    array.push(item);
    return _siftDown(array, 0, array.length - 1, compare);
}

const heapPop = function(array, compare) {
    let lastEl, returnItem;
    if (compare === null) {
        compare = defaultCompare;
    }

    lastEl = array.pop();
    if (array.length > 0) {
        returnItem = array[0];
        array[0] = lastEl;
        _siftUp(array, 0, compare);
    } else {
        returnItem = lastEl;
    }

    return returnItem;
}

const heapReplace = function(array, item, compare) {
    let returnItem;
    if (compare === null) {
        compare = defaultCompare;
    }

    returnItem = array[0];
    array[0] = item;
    _siftUp(array, 0, compare);

    return returnItem;
}

const heapPushPop = function(array, item, compare) {
    let _ref;
    if (compare === null) {
        compare = defaultCompare;
    }

    if (array.length > 0 && compare(array[0], item) < 0) {
        _ref = [array[0], item];
        item = _ref[0];
        array[0] = _ref[1];
    }

    return item;
}

const heapify = function(array, compare) {
    let i, _i, _j, _len, _ref, _ref1, _results, _results1;
    if (compare === null) {
        compare = defaultCompare;
    }

    _ref1 = (function() {
        _results1 = [];
        for (_j = 0, _ref = Math.floor(array.length / 2); 0 <= _ref ? _j++ : _j--;) {
            _results1.push(_j);
        }
        return _results1;
    }).apply(this).reverse();

    _results = [];
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        i = _ref1[_i];
        _results.push(_siftUp(array, i, compare));
    }

    return _results;
}

const updateItem = function(array, item, compare) {
    let pos;
    if (compare === null) {
        compare = defaultCompare;
    }

    pos = array.indexOf(item);
    if (pos === -1) {
        return;
    }

    _siftDown(array, 0, pos, compare);
    return _siftUp(array, pos, compare);
}

const nLargest = function(array, n, compare) {
    let el, result, _i, _len, _ref;
    if (compare === null) {
        compare = defaultCompare;
    }

    result = array.splice(0, n);
    if (!result.length) {
        return result;
    }

    heapify(result, compare);
    _ref = array.slice(n);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        el = _ref[_i];
        heapPushPop(result, el, compare);
    }

    return result.sort(compare).reverse();
}

const nSmallest = function(array, n, compare) {
    let elem, i, los, result, _i, _j, _len, _ref, _ref1, _results;
    if (compare === null) {
        compare = defaultCompare;
    }

    if (n * 10 <= array.length) {
        result = array.slice(0, n).sort(compare);
        if (!result.length) {
            return result;
        }

        los = result[result.length - 1];
        _ref = array.slice(n);
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            elem = _ref[_i];
            if (compare(elem,los) < 0) {
                inSort(result, elem, 0, null, compare);
                result.pop();
                los = result[result.length - 1];
            }
        }

        return result;
    }

    heapify(array, compare);
    _results = [];
    for (i = _j = 0, _ref1 = Math.min(n, array.length); 0 <= _ref1 ? _j < _ref1 : _j > _ref1; i = 0 <= _ref1 ? ++_j : --_j) {
        _results.push(heapPop(array, compare));
    }

    return _results;
}
