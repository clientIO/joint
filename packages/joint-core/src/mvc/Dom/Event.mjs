export const Event = function(src, props) {
    // Allow instantiation without the 'new' keyword
    if (!(this instanceof Event)) {
        return new Event(src, props);
    }

    // Event object
    if (src && src.type) {
        this.originalEvent = src;
        this.type = src.type;

        // Events bubbling up the document may have been marked as prevented
        // by a handler lower down the tree; reflect the correct value.
        this.isDefaultPrevented = src.defaultPrevented
            ? returnTrue
            : returnFalse;

        // Create target properties
        this.target = src.target;
        this.currentTarget = src.currentTarget;
        this.relatedTarget = src.relatedTarget;

        // Event type
    } else {
        this.type = src;
    }

    // Put explicitly provided properties onto the event object
    if (props) {
        Object.assign(this, props);
    }

    // Create a timestamp if incoming event doesn't have one
    this.timeStamp = (src && src.timeStamp) || Date.now();

    // Mark it as fixed
    this.envelope = true;
};

// $.Event is based on DOM3 Events as specified by the ECMAScript Language Binding
// https://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
Event.prototype = {
    constructor: Event,
    isDefaultPrevented: returnFalse,
    isPropagationStopped: returnFalse,
    isImmediatePropagationStopped: returnFalse,
    preventDefault: function() {
        const evt = this.originalEvent;
        this.isDefaultPrevented = returnTrue;
        if (evt) {
            evt.preventDefault();
        }
    },
    stopPropagation: function() {
        const evt = this.originalEvent;
        this.isPropagationStopped = returnTrue;
        if (evt) {
            evt.stopPropagation();
        }
    },
    stopImmediatePropagation: function() {
        const evt = this.originalEvent;
        this.isImmediatePropagationStopped = returnTrue;
        if (evt) {
            evt.stopImmediatePropagation();
        }
        this.stopPropagation();
    },
};

// Includes all common event props including KeyEvent and MouseEvent specific props
[
    'altKey',
    'bubbles',
    'cancelable',
    'changedTouches',
    'ctrlKey',
    'detail',
    'eventPhase',
    'metaKey',
    'pageX',
    'pageY',
    'shiftKey',
    'view',
    'char',
    'code',
    'charCode',
    'key',
    'keyCode',
    'button',
    'buttons',
    'clientX',
    'clientY',
    'offsetX',
    'offsetY',
    'pointerId',
    'pointerType',
    'screenX',
    'screenY',
    'targetTouches',
    'toElement',
    'touches',
    'which',
].forEach((name) => addProp(name));

function addProp(name) {
    Object.defineProperty(Event.prototype, name, {
        enumerable: true,
        configurable: true,
        get: function() {
            return this.originalEvent ? this.originalEvent[name] : undefined;
        },
        set: function(value) {
            Object.defineProperty(this, name, {
                enumerable: true,
                configurable: true,
                writable: true,
                value: value,
            });
        },
    });
}

function returnTrue() {
    return true;
}

function returnFalse() {
    return false;
}
