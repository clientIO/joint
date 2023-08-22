import { Cell } from '../dia/Cell.mjs';
import { isFunction, isString, toArray } from './util.mjs';

export const wrapWith = function(object, methods, wrapper) {

    if (isString(wrapper)) {

        if (!wrappers[wrapper]) {
            throw new Error('Unknown wrapper: "' + wrapper + '"');
        }

        wrapper = wrappers[wrapper];
    }

    if (!isFunction(wrapper)) {
        throw new Error('Wrapper must be a function.');
    }

    toArray(methods).forEach(function(method) {
        object[method] = wrapper(object[method]);
    });
};

export const wrappers = {

    cells: function(fn) {

        return function() {

            var args = Array.from(arguments);
            var n = args.length;
            var cells = n > 0 && args[0] || [];
            var opt = n > 1 && args[n - 1] || {};

            if (!Array.isArray(cells)) {

                if (opt instanceof Cell) {
                    cells = args;
                } else if (cells instanceof Cell) {
                    if (args.length > 1) {
                        args.pop();
                    }
                    cells = args;
                }
            }

            if (opt instanceof Cell) {
                opt = {};
            }

            return fn.call(this, cells, opt);
        };
    }

};

