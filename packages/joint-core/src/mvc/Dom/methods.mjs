import $ from './Dom.mjs';
import V from '../../V/index.mjs';
import { dataPriv, cleanNodesData } from './vars.mjs';

// Manipulation

export function remove() {
    for (let i = 0; i < this.length; i++) {
        const node = this[i];
        dataPriv.remove(node);
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
}

export function empty() {
    for (let i = 0; i < this.length; i++) {
        const node = this[i];
        if (node.nodeType === 1) {
            cleanNodesData(dataPriv, node.getElementsByTagName('*'));
            // Remove any remaining nodes
            node.textContent = '';
        }
    }
    return this;
}

export function html(html) {
    const [el] = this;
    if (!el) return null;
    if (!html) return el.innerHTML;
    cleanNodesData(dataPriv, el.getElementsByTagName('*'));
    if (typeof string === 'string' || typeof string === 'number') {
        el.innerHTML = html;
    } else {
        el.innerHTML = '';
        return this.append(html);
    }
    return this;
}

export function text(text) {
    const [el] = this;
    if (!el) return null;
    if (!text) return el.textContent;
    el.textContent = text;
    return this;
}

export function append(...nodes) {
    const [parent] = this;
    if (!parent) return this;
    nodes.forEach((node) => {
        if (!node) return;
        if (typeof node === 'string') {
            parent.append(...$.parseHTML(node));
        } else if (node.toString() === '[object Object]') {
            // $ object
            parent.append(...node.toArray());
        } else {
            // DOM node
            parent.appendChild(node);
        }
    });
    return this;
}

export function prepend(...nodes) {
    const [parent] = this;
    if (!parent) return this;
    nodes.forEach((node) => {
        if (!node) return;
        if (typeof node === 'string') {
            parent.prepend(...$.parseHTML(node));
        } else if (node.toString() === '[object Object]') {
            // $ object
            parent.prepend(...node.toArray());
        } else {
            // DOM node
            parent.insertBefore(node, parent.firstChild);
        }
    });
    return this;
}

export function appendTo(parent) {
    $(parent).append(this);
    return this;
}

export function prependTo(parent) {
    $(parent).prepend(this);
    return this;
}

// Styles and attributes

export function css(name, value) {
    let styles;
    if (typeof name === 'string') {
        if (value === undefined) {
            const [el] = this;
            if (!el) return null;
            return el.style[name];
        } else {
            styles = { [name]: value };
        }
    } else if (!name) {
        throw new Error('no styles provided');
    } else {
        styles = name;
    }
    for (let style in styles) {
        if (styles.hasOwnProperty(style)) {
            for (let i = 0; i < this.length; i++) {
                this[i].style[style] = styles[style];
            }
        }
    }
    return this;
}

export function attr(name, value) {
    let attributes;
    if (typeof name === 'string') {
        if (value === undefined) {
            const [el] = this;
            if (!el) return null;
            return el.getAttribute(name);
        } else {
            attributes = { [name]: value };
        }
    } else if (!name) {
        throw new Error('no attributes provided');
    } else {
        attributes = name;
    }
    for (let attr in attributes) {
        if (attributes.hasOwnProperty(attr)) {
            for (let i = 0; i < this.length; i++) {
                this[i].setAttribute(attr, attributes[attr]);
            }
        }
    }
    return this;
}

// Classes

export function removeClass() {
    for (let i = 0; i < this.length; i++) {
        const node = this[i];
        V.prototype.removeClass.apply({ node }, arguments);
    }
    return this;
}

export function addClass() {
    for (let i = 0; i < this.length; i++) {
        const node = this[i];
        V.prototype.addClass.apply({ node }, arguments);
    }
    return this;
}

export function hasClass() {
    const [node] = this;
    if (!node) return false;
    return V.prototype.hasClass.apply({ node }, arguments);
}

// Events

export function on(types, selector, data, fn) {
    return $.event.on(this, types, selector, data, fn);
}

export function one(types, selector, data, fn) {
    return $.event.on(this, types, selector, data, fn, 1);
}

export function off(types, selector, fn) {
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
    for (let i = 0; i < this.length; i++) {
        $.event.remove(this[i], types, fn, selector);
    }
}
