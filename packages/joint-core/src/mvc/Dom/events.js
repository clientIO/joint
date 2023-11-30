import { isEmpty } from '../../util/utilHelpers.mjs';
import $ from './Dom.mjs';
import { dataPriv } from './vars.mjs';

const rTypeNamespace = /^([^.]*)(?:\.(.+)|)/;
const documentElement = document.documentElement;
// Only count HTML whitespace
// Other whitespace should count in values
// https://infra.spec.whatwg.org/#ascii-whitespace
const rNotHtmlWhite = /[^\x20\t\r\n\f]+/g;

function returnTrue() {
    return true;
}

function returnFalse() {
    return false;
}

function on(elem, types, selector, data, fn, one) {

    // Types can be a map of types/handlers
    if (typeof types === 'object') {
        // ( types-Object, selector, data )
        if (typeof selector !== 'string') {
            // ( types-Object, data )
            data = data || selector;
            selector = undefined;
        }
        for (let type in types) {
            on(elem, type, selector, data, types[type], one);
        }
        return elem;
    }

    if (data == null && fn == null) {
        // ( types, fn )
        fn = selector;
        data = selector = undefined;
    } else if (fn == null) {
        if (typeof selector === 'string') {
            // ( types, selector, fn )
            fn = data;
            data = undefined;
        } else {
            // ( types, data, fn )
            fn = data;
            data = selector;
            selector = undefined;
        }
    }
    if (fn === false) {
        fn = returnFalse;
    } else if (!fn) {
        return elem;
    }

    if (one === 1) {
        const origFn = fn;
        fn = function(event) {
            // Can use an empty set, since event contains the info
            $().off(event);
            return origFn.apply(this, arguments);
        };

        // Use same guid so caller can remove using origFn
        fn.guid = origFn.guid || (origFn.guid = $.guid++);
    }
    for (let i = 0; i < elem.length; i++) {
        $.event.add(elem[i], types, fn, data, selector);
    }
}

/*
 * Helper functions for managing events -- not part of the public interface.
 * Props to Dean Edwards' addEvent library for many of the ideas.
 */
$.event = {
    add: function(elem, types, handler, data, selector) {
        // Only attach events to objects for which we can store data
        if (typeof elem != 'object') {
            return;
        }

        const elemData = dataPriv.create(elem);

        // Caller can pass in an object of custom data in lieu of the handler
        let handleObjIn;
        if (handler.handler) {
            handleObjIn = handler;
            handler = handleObjIn.handler;
            selector = handleObjIn.selector;
        }

        // Ensure that invalid selectors throw exceptions at attach time
        // Evaluate against documentElement in case elem is a non-element node (e.g., document)
        if (selector) {
            documentElement.matches(selector);
        }

        // Make sure that the handler has a unique ID, used to find/remove it later
        if (!handler.guid) {
            handler.guid = $.guid++;
        }

        // Init the element's event structure and main handler, if this is the first
        let events;
        if (!(events = elemData.events)) {
            events = elemData.events = Object.create(null);
        }
        let eventHandle;
        if (!(eventHandle = elemData.handle)) {
            eventHandle = elemData.handle = function(e) {
                // Discard the second event of a $.event.trigger() and
                // when an event is called after a page has unloaded
                return typeof $ !== 'undefined' && $.event.triggered !== e.type
                    ? $.event.dispatch.apply(elem, arguments)
                    : undefined;
            };
        }

        // Handle multiple events separated by a space
        const typesArr = (types || '').match(rNotHtmlWhite) || [''];
        let i = typesArr.length;
        while (i--) {
            const [, origType, ns = ''] = rTypeNamespace.exec(typesArr[i]);
            // There *must* be a type, no attaching namespace-only handlers
            if (!origType) {
                continue;
            }

            const namespaces = ns.split('.').sort();
            // If event changes its type, use the special event handlers for the changed type
            let special = $.event.special[origType];
            // If selector defined, determine special event api type, otherwise given type
            const type = (special && (selector ? special.delegateType : special.bindType)) || origType;
            // Update special based on newly reset type
            special = $.event.special[type];
            // handleObj is passed to all event handlers
            const handleObj = Object.assign(
                {
                    type: type,
                    origType: origType,
                    data: data,
                    handler: handler,
                    guid: handler.guid,
                    selector: selector,
                    namespace: namespaces.join('.'),
                },
                handleObjIn
            );

            let handlers;
            // Init the event handler queue if we're the first
            if (!(handlers = events[type])) {
                handlers = events[type] = [];
                handlers.delegateCount = 0;

                // Only use addEventListener if the special events handler returns false
                if (
                    !special || !special.setup ||
                    special.setup.call(elem, data, namespaces, eventHandle) === false
                ) {
                    if (elem.addEventListener) {
                        elem.addEventListener(type, eventHandle);
                    }
                }
            }

            if (special && special.add) {
                special.add.call(elem, handleObj);
                if (!handleObj.handler.guid) {
                    handleObj.handler.guid = handler.guid;
                }
            }

            // Add to the element's handler list, delegates in front
            if (selector) {
                handlers.splice(handlers.delegateCount++, 0, handleObj);
            } else {
                handlers.push(handleObj);
            }
        }
    },

    // Detach an event or set of events from an element
    remove: function(elem, types, handler, selector, mappedTypes) {

        const elemData = dataPriv.get(elem);
        if (!elemData || !elemData.events) return;
        const events = elemData.events;

        // Once for each type.namespace in types; type may be omitted
        const typesArr = (types || '').match(rNotHtmlWhite) || [''];
        let i = typesArr.length;
        while (i--) {
            const [, origType, ns = ''] = rTypeNamespace.exec(typesArr[i]);
            // Unbind all events (on this namespace, if provided) for the element
            if (!origType) {
                for (const type in events) {
                    $.event.remove(
                        elem,
                        type + typesArr[i],
                        handler,
                        selector,
                        true
                    );
                }
                continue;
            }

            const special = $.event.special[origType];
            const type = (special && (selector ? special.delegateType : special.bindType)) || origType;
            const handlers = events[type];
            if (!handlers || handlers.length === 0) continue;

            const namespaces = ns.split('.').sort();
            const rNamespace = ns
                ? new RegExp('(^|\\.)' + namespaces.join('\\.(?:.*\\.|)') + '(\\.|$)')
                : null;

            // Remove matching events
            const origCount = handlers.length;
            let j = origCount;
            while (j--) {
                const handleObj = handlers[j];

                if (
                    (mappedTypes || origType === handleObj.origType) &&
                    (!handler || handler.guid === handleObj.guid) &&
                    (!rNamespace || rNamespace.test(handleObj.namespace)) &&
                    (!selector ||
                        selector === handleObj.selector ||
                        (selector === '**' && handleObj.selector))
                ) {
                    handlers.splice(j, 1);
                    if (handleObj.selector) {
                        handlers.delegateCount--;
                    }
                    if (special && special.remove) {
                        special.remove.call(elem, handleObj);
                    }
                }
            }

            // Remove generic event handler if we removed something and no more handlers exist
            // (avoids potential for endless recursion during removal of special event handlers)
            if (origCount && handlers.length === 0) {
                if (
                    !special || !special.teardown ||
                    special.teardown.call(elem, namespaces, elemData.handle) === false
                ) {
                    // This "if" is needed for plain objects
                    if (elem.removeEventListener) {
                        elem.removeEventListener(type, elemData.handle);
                    }
                }
                delete events[type];
            }
        }

        // Remove data if it's no longer used
        if (isEmpty(events)) {
            dataPriv.remove(elem, 'handle');
            dataPriv.remove(elem, 'events');
        }
    },

    dispatch: function(nativeEvent) {

        const elem = this;
        // Make a writable $.Event from the native event object
        const event = $.event.fix(nativeEvent);
        event.delegateTarget = elem;
        // Use the fix-ed $.Event rather than the (read-only) native event
        const args = Array.from(arguments);
        args[0] = event;

        const eventsData = dataPriv.get(elem, 'events');
        const handlers = (eventsData && eventsData[event.type]) || [];
        const special = $.event.special[event.type];

        // Call the preDispatch hook for the mapped type, and let it bail if desired
        if (special && special.preDispatch) {
            if (special.preDispatch.call(elem, event) === false) return;
        }

        // Determine handlers
        const handlerQueue = $.event.handlers.call(elem, event, handlers);

        // Run delegates first; they may want to stop propagation beneath us
        let i = 0;
        let matched;
        while ((matched = handlerQueue[i++]) && !event.isPropagationStopped()) {
            event.currentTarget = matched.elem;
            let j = 0;
            let handleObj;
            while (
                (handleObj = matched.handlers[j++]) &&
                !event.isImmediatePropagationStopped()
            ) {

                event.handleObj = handleObj;
                event.data = handleObj.data;

                const origSpecial = $.event.special[handleObj.origType];
                let handler;
                if (origSpecial && origSpecial.handle) {
                    handler = origSpecial.handle;
                } else {
                    handler = handleObj.handler;
                }

                const ret = handler.apply(matched.elem, args);
                if (ret !== undefined) {
                    if ((event.result = ret) === false) {
                        event.preventDefault();
                        event.stopPropagation();
                    }
                }
            }
        }

        // Call the postDispatch hook for the mapped type
        if (special && special.postDispatch) {
            special.postDispatch.call(elem, event);
        }

        return event.result;
    },

    handlers: function(event, handlers) {

        const delegateCount = handlers.delegateCount;
        const handlerQueue = [];

        // Find delegate handlers
        if (
            delegateCount &&
            // Support: Firefox <=42 - 66+
            // Suppress spec-violating clicks indicating a non-primary pointer button (trac-3861)
            // https://www.w3.org/TR/DOM-Level-3-Events/#event-type-click
            // Support: IE 11+
            // ...but not arrow key "clicks" of radio inputs, which can have `button` -1 (gh-2343)
            !(event.type === 'click' && event.button >= 1)
        ) {
            for (let cur = event.target; cur !== this; cur = cur.parentNode || this) {
                // Don't check non-elements (trac-13208)
                // Don't process clicks on disabled elements (trac-6911, trac-8165, trac-11382, trac-11764)
                if (
                    cur.nodeType === 1 &&
                    !(event.type === 'click' && cur.disabled === true)
                ) {
                    const matchedHandlers = [];
                    const matchedSelectors = {};
                    for (let i = 0; i < delegateCount; i++) {
                        const handleObj = handlers[i];
                        // Don't conflict with Object.prototype properties (trac-13203)
                        const sel = handleObj.selector + ' ';
                        if (matchedSelectors[sel] === undefined) {
                            matchedSelectors[sel] = cur.matches(sel);
                        }
                        if (matchedSelectors[sel]) {
                            matchedHandlers.push(handleObj);
                        }
                    }
                    if (matchedHandlers.length) {
                        handlerQueue.push({
                            elem: cur,
                            handlers: matchedHandlers,
                        });
                    }
                }
            }
        }

        // Add the remaining (directly-bound) handlers
        if (delegateCount < handlers.length) {
            handlerQueue.push({
                elem: this,
                handlers: handlers.slice(delegateCount),
            });
        }

        return handlerQueue;
    },

    addProp: function(name, hook) {
        Object.defineProperty($.Event.prototype, name, {
            enumerable: true,
            configurable: true,
            get:
                typeof hook === 'function'
                    ? function() {
                        if (this.originalEvent) {
                            return hook(this.originalEvent);
                        }
                    }
                    : function() {
                        if (this.originalEvent) {
                            return this.originalEvent[name];
                        }
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
    },

    fix: function(originalEvent) {
        return originalEvent.envelope ? originalEvent : new $.Event(originalEvent);
    },
};

$.event.special = Object.create(null);

$.event.special.load = {
    // Prevent triggered image.load events from bubbling to window.load
    noBubble: true,
};

$.Event = function(src, props) {
    // Allow instantiation without the 'new' keyword
    if (!(this instanceof $.Event)) {
        return new $.Event(src, props);
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
$.Event.prototype = {
    constructor: $.Event,
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
].forEach((name) => $.event.addProp(name));

// Create mouseenter/leave events using mouseover/out and event-time checks
// so that event delegation works in $.
// Do the same for pointerenter/pointerleave and pointerover/pointerout
[
    ['mouseenter', 'mouseover'],
    ['mouseleave', 'mouseout'],
    ['pointerenter', 'pointerover'],
    ['pointerleave', 'pointerout'],
].forEach(([orig, fix]) => {
    $.event.special[orig] = {
        delegateType: fix,
        bindType: fix,
        handle: function(event) {
            const target = this;
            const related = event.relatedTarget;
            const handleObj = event.handleObj;
            let ret;
            // For mouseenter/leave call the handler if related is outside the target.
            // NB: No relatedTarget if the mouse left/entered the browser window
            if (!related || !target.contains(related)) {
                event.type = handleObj.origType;
                ret = handleObj.handler.apply(target, arguments);
                event.type = fix;
            }
            return ret;
        },
    };
});

// Methods

$.fn.on = function(types, selector, data, fn) {
    return on(this, types, selector, data, fn);
};

$.fn.one = function(types, selector, data, fn) {
    return on(this, types, selector, data, fn, 1);
};

$.fn.off = function(types, selector, fn) {
    if (types && types.preventDefault && types.handleObj) {
        // ( event )  dispatched $.Event
        const handleObj = types.handleObj;
        $(types.delegateTarget).off(
            handleObj.namespace
                ? handleObj.origType + '.' + handleObj.namespace
                : handleObj.origType,
            handleObj.selector,
            handleObj.handler
        );
        return this;
    }
    if (typeof types === 'object') {
        // ( types-object [, selector] )
        for (let type in types) {
            this.off(type, selector, types[type]);
        }
        return this;
    }
    if (selector === false || typeof selector === 'function') {
        // ( types [, fn] )
        fn = selector;
        selector = undefined;
    }
    if (fn === false) {
        fn = returnFalse;
    }
    for (let i = 0; i < this.length; i++) {
        $.event.remove(this[i], types, fn, selector);
    }
};
