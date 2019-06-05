(function() {

    if (typeof Uint8Array !== 'undefined' || typeof window === 'undefined') {
        return;
    }

    function subarray(start, end) {
        return this.slice(start, end);
    }

    function set_(array, offset) {

        if (arguments.length < 2) {
            offset = 0;
        }
        for (var i = 0, n = array.length; i < n; ++i, ++offset) {
            this[offset] = array[i] & 0xFF;
        }
    }

    // we need typed arrays
    function TypedArray(arg1) {

        var result;
        if (typeof arg1 === 'number') {
            result = new Array(arg1);
            for (var i = 0; i < arg1; ++i) {
                result[i] = 0;
            }
        } else {
            result = arg1.slice(0);
        }
        result.subarray = subarray;
        result.buffer = result;
        result.byteLength = result.length;
        result.set = set_;
        if (typeof arg1 === 'object' && arg1.buffer) {
            result.buffer = arg1.buffer;
        }

        return result;
    }

    window.Uint8Array = TypedArray;
    window.Uint32Array = TypedArray;
    window.Int32Array = TypedArray;
})();
