/**
 * make xhr.response = 'arraybuffer' available for the IE9
 */
(function() {

    if (typeof XMLHttpRequest === 'undefined') {
        return;
    }

    if ('response' in XMLHttpRequest.prototype ||
        'mozResponseArrayBuffer' in XMLHttpRequest.prototype ||
        'mozResponse' in XMLHttpRequest.prototype ||
        'responseArrayBuffer' in XMLHttpRequest.prototype) {
        return;
    }

    Object.defineProperty(XMLHttpRequest.prototype, 'response', {
        get: function() {
            /* global VBArray:true */
            return new Uint8Array(new VBArray(this.responseBody).toArray());
        }
    });
})();
