import { Events } from './Events.mjs';
import { extend } from './mvcUtils.mjs';
import {
    assign,
    clone,
    defaults,
    has,
    isEqual,
    isEmpty,
    result,
    uniqueId
} from '../util/util.mjs';

// Model
// --------------

// **Models** are the basic data object in the framework --
// frequently representing a row in a table in a database on your server.
// A discrete chunk of data and a bunch of useful, related methods for
// performing computations and transformations on that data.

// Create a new model with the specified attributes. A client id (`cid`)
// is automatically generated and assigned for you.

export var Model = function(attributes, options) {
    var attrs = attributes || {};
    options || (options = {});
    this.preinitialize.apply(this, arguments);
    this.cid = uniqueId(this.cidPrefix);
    this.attributes = {};
    if (options.collection) this.collection = options.collection;
    var attributeDefaults = result(this, 'defaults');

    // Just _.defaults would work fine, but the additional _.extends
    // is in there for historical reasons. See #3843.
    attrs = defaults(assign({}, attributeDefaults, attrs), attributeDefaults);

    this.set(attrs, options);
    this.changed = {};
    this.initialize.apply(this, arguments);
};

// Attach all inheritable methods to the Model prototype.
assign(Model.prototype, Events, {

    // A hash of attributes whose current and previous value differ.
    changed: null,

    // The value returned during the last failed validation.
    validationError: null,

    // The default name for the JSON `id` attribute is `"id"`. MongoDB and
    // CouchDB users may want to set this to `"_id"`.
    idAttribute: 'id',

    // The prefix is used to create the client id which is used to identify models locally.
    // You may want to override this if you're experiencing name clashes with model ids.
    cidPrefix: 'c',

    // preinitialize is an empty function by default. You can override it with a function
    // or object.  preinitialize will run before any instantiation logic is run in the Model.
    preinitialize: function(){},

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // Return a copy of the model's `attributes` object.
    toJSON: function(options) {
        return clone(this.attributes);
    },

    // Get the value of an attribute.
    get: function(attr) {
        return this.attributes[attr];
    },

    // Returns `true` if the attribute contains a value that is not null
    // or undefined.
    has: function(attr) {
        return this.get(attr) != null;
    },

    // Set a hash of model attributes on the object, firing `"change"`. This is
    // the core primitive operation of a model, updating the data and notifying
    // anyone who needs to know about the change in state. The heart of the beast.
    set: function(key, val, options) {
        if (key == null) return this;

        // Handle both `"key", value` and `{key: value}` -style arguments.
        var attrs;
        if (typeof key === 'object') {
            attrs = key;
            options = val;
        } else {
            (attrs = {})[key] = val;
        }

        options || (options = {});

        // Run validation.
        if (!this._validate(attrs, options)) return false;

        // Extract attributes and options.
        var unset      = options.unset;
        var silent     = options.silent;
        var changes    = [];
        var changing   = this._changing;
        this._changing = true;

        if (!changing) {
            this._previousAttributes = clone(this.attributes);
            this.changed = {};
        }

        var current = this.attributes;
        var changed = this.changed;
        var prev    = this._previousAttributes;

        // For each `set` attribute, update or delete the current value.
        for (var attr in attrs) {
            val = attrs[attr];
            if (!isEqual(current[attr], val)) changes.push(attr);
            if (!isEqual(prev[attr], val)) {
                changed[attr] = val;
            } else {
                delete changed[attr];
            }
            unset ? delete current[attr] : current[attr] = val;
        }

        // Update the `id`.
        if (this.idAttribute in attrs) {
            var prevId = this.id;
            this.id = this.get(this.idAttribute);
            this.trigger('changeId', this, prevId, options);
        }

        // Trigger all relevant attribute changes.
        if (!silent) {
            if (changes.length) this._pending = options;
            for (var i = 0; i < changes.length; i++) {
                this.trigger('change:' + changes[i], this, current[changes[i]], options);
            }
        }

        // You might be wondering why there's a `while` loop here. Changes can
        // be recursively nested within `"change"` events.
        if (changing) return this;
        if (!silent) {
            while (this._pending) {
                options = this._pending;
                this._pending = false;
                this.trigger('change', this, options);
            }
        }
        this._pending = false;
        this._changing = false;
        return this;
    },

    // Remove an attribute from the model, firing `"change"`. `unset` is a noop
    // if the attribute doesn't exist.
    unset: function(attr, options) {
        return this.set(attr, void 0, assign({}, options, { unset: true }));
    },

    // Clear all attributes on the model, firing `"change"`.
    clear: function(options) {
        var attrs = {};
        for (var key in this.attributes) attrs[key] = void 0;
        return this.set(attrs, assign({}, options, { unset: true }));
    },

    // Determine if the model has changed since the last `"change"` event.
    // If you specify an attribute name, determine if that attribute has changed.
    hasChanged: function(attr) {
        if (attr == null) return !isEmpty(this.changed);
        return has(this.changed, attr);
    },

    // Return an object containing all the attributes that have changed, or
    // false if there are no changed attributes. Useful for determining what
    // parts of a view need to be updated and/or what attributes need to be
    // persisted to the server. Unset attributes will be set to undefined.
    // You can also pass an attributes object to diff against the model,
    // determining if there *would be* a change.
    changedAttributes: function(diff) {
        if (!diff) return this.hasChanged() ? clone(this.changed) : false;
        var old = this._changing ? this._previousAttributes : this.attributes;
        var changed = {};
        var hasChanged;
        for (var attr in diff) {
            var val = diff[attr];
            if (isEqual(old[attr], val)) continue;
            changed[attr] = val;
            hasChanged = true;
        }
        return hasChanged ? changed : false;
    },

    // Get the previous value of an attribute, recorded at the time the last
    // `"change"` event was fired.
    previous: function(attr) {
        if (attr == null || !this._previousAttributes) return null;
        return this._previousAttributes[attr];
    },

    // Get all of the attributes of the model at the time of the previous
    // `"change"` event.
    previousAttributes: function() {
        return clone(this._previousAttributes);
    },

    // Create a new model with identical attributes to this one.
    clone: function() {
        return new this.constructor(this.attributes);
    },

    // Check if the model is currently in a valid state.
    isValid: function(options) {
        return this._validate({}, assign({}, options, { validate: true }));
    },

    // Run validation against the next complete set of model attributes,
    // returning `true` if all is well. Otherwise, fire an `"invalid"` event.
    _validate: function(attrs, options) {
        if (!options.validate || !this.validate) return true;
        attrs = assign({}, this.attributes, attrs);
        var error = this.validationError = this.validate(attrs, options) || null;
        if (!error) return true;
        this.trigger('invalid', this, error, assign(options, { validationError: error }));
        return false;
    }

});

// Set up inheritance for the model.
Model.extend = extend;
