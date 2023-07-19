import {
    assign,
    forIn,
    has,
    isFunction,
    isObject,
    isString
} from '../util/util.mjs';
import { matches } from '../util/utilHelpers.mjs';

// Helpers
// -------

// Helper function to correctly set up the prototype chain for subclasses.
// Similar to `goog.inherits`, but uses a hash of prototype properties and
// class properties to be extended.
export var extend = function(protoProps, staticProps) {
    var parent = this;
    var child;

    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call the parent constructor.
    if (protoProps && has(protoProps, 'constructor')) {
        child = protoProps.constructor;
    } else {
        child = function(){ return parent.apply(this, arguments); };
    }

    // Add static properties to the constructor function, if supplied.
    assign(child, parent, staticProps);

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function and add the prototype properties.
    child.prototype = Object.assign(Object.create(parent.prototype), protoProps);
    child.prototype.constructor = child;

    // Set a convenience property in case the parent's prototype is needed
    // later.
    child.__super__ = parent.prototype;

    return child;
};

// Proxy class methods to functions, wrapping the model's
// `attributes` object or collection's `models` array behind the scenes.
//
// `Function#apply` can be slow so we use the method's arg count, if we know it.
var addMethod = function(base, length, method, attribute) {
    switch (length) {
        case 1: return function() {
            return base[method](this[attribute]);
        };
        case 2: return function(value) {
            return base[method](this[attribute], value);
        };
        case 3: return function(iteratee, context) {
            return base[method](this[attribute], cb(iteratee, this), context);
        };
        case 4: return function(iteratee, defaultVal, context) {
            return base[method](this[attribute], cb(iteratee, this), defaultVal, context);
        };
        default: return function() {
            var args = Array.prototype.slice.call(arguments);
            args.unshift(this[attribute]);
            return base[method].apply(base, args);
        };
    }
};

export var addMethodsUtil = function(Class, base, methods, attribute) {
    forIn(methods, function(length, method) {
        if (base[method]) Class.prototype[method] = addMethod(base, length, method, attribute);
    });
};

// Support `collection.sortBy('attr')`.
var cb = function(iteratee, instance) {
    if (isFunction(iteratee)) return iteratee;
    if (isObject(iteratee) && !instance._isModel(iteratee)) return modelMatcher(iteratee);
    if (isString(iteratee)) return function(model) { return model.get(iteratee); };
    return iteratee;
};

var modelMatcher = function(attrs) {
    var matcher = matches(attrs);
    return function(model) {
        return matcher(model.attributes);
    };
};
