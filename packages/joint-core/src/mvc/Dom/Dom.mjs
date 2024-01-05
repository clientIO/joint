
/*!
 * jQuery JavaScript Library v4.0.0-pre+c98597ea.dirty
 * https://jquery.com/
 *
 * Copyright OpenJS Foundation and other contributors
 * Released under the MIT license
 * https://jquery.org/license
 *
 * Date: 2023-11-24T14:04Z
 */

import { uniq, isEmpty } from '../../util/utilHelpers.mjs';
import { dataPriv, dataUser } from './vars.mjs';
import { Event } from './Event.mjs';

const document = (typeof window !== 'undefined') ? window.document : null;
const documentElement = document && document.documentElement;

const rTypeNamespace = /^([^.]*)(?:\.(.+)|)/;

// Only count HTML whitespace
// Other whitespace should count in values
// https://infra.spec.whatwg.org/#ascii-whitespace
const rNotHtmlWhite = /[^\x20\t\r\n\f]+/g;

// Define a local copy of $
const $ = function(selector) {
    // The $ object is actually just the init constructor 'enhanced'
    // Need init if $ is called (just allow error to be thrown if not included)
    return new $.Dom(selector);
};

$.fn = $.prototype = {
    constructor: $,
    // The default length of a $ object is 0
    length: 0,
};

// A global GUID counter for objects
$.guid = 1;

// User data storage
$.data = dataUser;

$.merge = function(first, second) {
    let len = +second.length;
    let i = first.length;
    for (let j = 0; j < len; j++) {
        first[i++] = second[j];
    }
    first.length = i;
    return first;
};

$.parseHTML = function(string) {
    // Inline events will not execute when the HTML is parsed; this includes, for example, sending GET requests for images.
    const context = document.implementation.createHTMLDocument();
    // Set the base href for the created document so any parsed elements with URLs
    // are based on the document's URL
    const base = context.createElement('base');
    base.href = document.location.href;
    context.head.appendChild(base);

    context.body.innerHTML = string;
    // remove scripts
    const scripts = context.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
        scripts[i].remove();
    }
    return Array.from(context.body.childNodes);
};

if (typeof Symbol === 'function') {
    $.fn[Symbol.iterator] = Array.prototype[Symbol.iterator];
}

$.fn.toArray = function() {
    return Array.from(this);
};

// Take an array of elements and push it onto the stack
// (returning the new matched element set)
$.fn.pushStack = function(elements) {
    // Build a new $ matched element set
    const ret = $.merge(this.constructor(), elements);
    // Add the old object onto the stack (as a reference)
    ret.prevObject = this;
    // Return the newly-formed element set
    return ret;
};

$.fn.find = function(selector) {
    const [el] = this;
    const ret = this.pushStack([]);
    if (!el) return ret;
    // Early return if context is not an element, document or document fragment
    const { nodeType } = el;
    if (nodeType !== 1 && nodeType !== 9 && nodeType !== 11) {
        return ret;
    }
    if (typeof selector !== 'string') {
        if (el !== selector && el.contains(selector)) {
            $.merge(ret, [selector]);
        }
    } else {
        $.merge(ret, el.querySelectorAll(selector));
    }
    return ret;
};

$.fn.add = function(selector, context) {
    const newElements = $(selector, context).toArray();
    const prevElements = this.toArray();
    const ret = this.pushStack([]);
    $.merge(ret, uniq(prevElements.concat(newElements)));
    return ret;
};

$.fn.addBack = function() {
    return this.add(this.prevObject);
};

$.fn.filter = function(selector) {
    const matches = [];
    for (let i = 0; i < this.length; i++) {
        const node = this[i];
        if (!node.matches(selector)) continue;
        matches.push(node);
    }
    return this.pushStack(matches);
};

// A simple way to check for HTML strings
// Prioritize #id over <tag> to avoid XSS via location.hash (trac-9521)
// Strict HTML recognition (trac-11290: must start with <)
// Shortcut simple #id case for speed
const rQuickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]+))$/;

function isObviousHtml(input) {
    return (
        input[0] === '<' && input[input.length - 1] === '>' && input.length >= 3
    );
}

const Dom = function(selector) {
    if (!selector) {
        // HANDLE: $(""), $(null), $(undefined), $(false)
        return this;
    }
    if (typeof selector === 'function') {
        // HANDLE: $(function)
        // Shortcut for document ready
        throw new Error('function not supported');
    }
    if (arguments.length > 1) {
        throw new Error('selector with context not supported');
    }
    if (selector.nodeType) {
        // HANDLE: $(DOMElement)
        this[0] = selector;
        this.length = 1;
        return this;
    }
    let match;
    if (isObviousHtml(selector + '')) {
        // Handle obvious HTML strings
        // Assume that strings that start and end with <> are HTML and skip
        // the regex check. This also handles browser-supported HTML wrappers
        // like TrustedHTML.
        match = [null, selector, null];
    } else if (typeof selector === 'string') {
        // Handle HTML strings or selectors
        match = rQuickExpr.exec(selector);
    } else {
        // Array-like
        return $.merge(this, selector);
    }
    if (!match || !match[1]) {
        // HANDLE: $(expr)
        return $root.find(selector);
    }
    // Match html or make sure no context is specified for #id
    // Note: match[1] may be a string or a TrustedHTML wrapper
    if (match[1]) {
        // HANDLE: $(html) -> $(array)
        $.merge(this, $.parseHTML(match[1]));
        return this;
    }
    // HANDLE: $(#id)
    const el = document.getElementById(match[2]);
    if (el) {
        // Inject the element directly into the $ object
        this[0] = el;
        this.length = 1;
    }
    return this;
};

$.Dom = Dom;

// Give the init function the $ prototype for later instantiation
Dom.prototype = $.fn;

// Events

$.Event = Event;

$.event = {
    special: Object.create(null),
};

$.event.has = function(elem, eventType) {
    const events = dataPriv.get(elem, 'events');
    if (!events) return false;
    if (!eventType) return true;
    return Array.isArray(events[eventType]) && events[eventType].length > 0;
};

$.event.on = function(elem, types, selector, data, fn, one) {

    // Types can be a map of types/handlers
    if (typeof types === 'object') {
        // ( types-Object, selector, data )
        if (typeof selector !== 'string') {
            // ( types-Object, data )
            data = data || selector;
            selector = undefined;
        }
        for (let type in types) {
            $.event.on(elem, type, selector, data, types[type], one);
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
    if (!fn) {
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
};

$.event.add = function(elem, types, handler, data, selector) {
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
            return (typeof $ !== 'undefined')
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
};

// Detach an event or set of events from an element
$.event.remove = function(elem, types, handler, selector, mappedTypes) {

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
};

$.event.dispatch = function(nativeEvent) {

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
};

$.event.handlers = function(event, handlers) {

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
};

$.event.fix = function(originalEvent) {
    return originalEvent.envelope ? originalEvent : new Event(originalEvent);
};

// A central reference to the root $(document)
const $root = $(document);

export { $ as default };
