import { camelCase } from '../../util/utilHelpers.mjs';
import $ from './Dom.mjs';
import V from '../../V/index.mjs';
import { dataPriv, dataUser } from './vars.mjs';

// Manipulation

function cleanNodesData(nodes) {
    let i = nodes.length;
    while (i--) cleanNodeData(nodes[i]);
}

function cleanNodeData(node) {
    $.event.remove(node);
    dataPriv.remove(node);
    dataUser.remove(node);
}

function removeNodes(nodes) {
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
}

export function remove() {
    for (let i = 0; i < this.length; i++) {
        const node = this[i];
        cleanNodeData(node);
        cleanNodesData(node.getElementsByTagName('*'));
    }
    removeNodes(this);
    return this;
}

export function detach() {
    removeNodes(this);
    return this;
}

export function empty() {
    for (let i = 0; i < this.length; i++) {
        const node = this[i];
        if (node.nodeType === 1) {
            cleanNodesData(node.getElementsByTagName('*'));
            // Remove any remaining nodes
            node.textContent = '';
        }
    }
    return this;
}

export function clone() {
    const clones = [];
    for (let i = 0; i < this.length; i++) {
        clones.push(this[i].cloneNode(true));
    }
    return this.pushStack(clones);
}

export function html(html) {
    const [el] = this;
    if (!el) return null;
    if (arguments.length === 0) return el.innerHTML;
    if (html === undefined) return this; // do nothing
    cleanNodesData(dataPriv, el.getElementsByTagName('*'));
    if (typeof html === 'string' || typeof html === 'number') {
        el.innerHTML = html;
    } else {
        el.innerHTML = '';
        return this.append(html);
    }
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
            this.append(...Array.from(node));
        } else if (Array.isArray(node)) {
            this.append(...node);
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
            this.prepend(...Array.from(node));
        } else if (Array.isArray(node)) {
            this.prepend(...node);
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

const requireUnits = {};
[
    'width', 'height', 'top', 'bottom', 'left', 'right',
    'padding', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight',
    'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight',
].forEach((cssProp) => {
    requireUnits[cssProp] = true;
});

function setCSSProperty(el, name, value) {
    if (typeof value === 'number' && requireUnits[camelCase(name)]) {
        value += 'px';
    }
    el.style[name] = value;
}

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
                setCSSProperty(this[i], style, styles[style]);
            }
        }
    }
    return this;
}

export function data(name, value) {
    if (arguments.length < 2) {
        const [el] = this;
        if (!el) return null;
        if (name === undefined) {
            return el.dataset;
        }
        return el.dataset[name];
    }
    for (let i = 0; i < this.length; i++) {
        this[i].dataset[name] = value;
    }
    return this;
}

// Classes

function setNodesClass(method, nodes, args) {
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        V.prototype[method].apply({ node }, args);
    }
}

export function removeClass() {
    setNodesClass('removeClass', this, arguments);
    return this;
}

export function addClass() {
    setNodesClass('addClass', this, arguments);
    return this;
}

export function toggleClass() {
    setNodesClass('toggleClass', this, arguments);
    return this;
}

export function hasClass() {
    const [node] = this;
    if (!node) return false;
    return V.prototype.hasClass.apply({ node }, arguments);
}

// Traversing

export function children(selector) {
    const matches = [];
    for(let i = 0; i < this.length; i++) {
        const node = this[i];
        let children = Array.from(node.children);
        if (typeof selector === 'string') {
            children = children.filter(child => child.matches(selector));
        }
        matches.push(...children);
    }
    return this.pushStack(matches);
}

export function closest(selector) {
    const closest = [];
    for (let i = 0; i < this.length; i++) {
        const el = this[i];
        if (typeof selector === 'string') {
            const closestEl = el.closest(selector);
            if (closestEl) {
                closest.push(closestEl);
            }
        } else {
            const [ancestorEl] = $(selector);
            if (ancestorEl && ancestorEl.contains(el)) {
                closest.push(ancestorEl);
            }
        }
    }
    return this.pushStack(closest);
}

// Events

export function on(types, selector, data, fn) {
    $.event.on(this, types, selector, data, fn);
    return this;
}

export function one(types, selector, data, fn) {
    $.event.on(this, types, selector, data, fn, 1);
    return this;
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
    return this;
}

// Measurements

export function width() {
    const [el] = this;
    if (el === window) return el.document.documentElement.clientWidth;
    else if (!el) return undefined;
    const styles = window.getComputedStyle(el);
    const height = el.offsetWidth;
    const borderTopWidth = parseFloat(styles.borderTopWidth);
    const borderBottomWidth = parseFloat(styles.borderBottomWidth);
    const paddingTop = parseFloat(styles.paddingTop);
    const paddingBottom = parseFloat(styles.paddingBottom);
    return height - borderBottomWidth - borderTopWidth - paddingTop - paddingBottom;
}

export function height() {
    const [el] = this;
    if (el === window) return el.document.documentElement.clientHeight;
    if (!el) return undefined;
    const styles = window.getComputedStyle(el);
    const width = el.offsetHeight;
    const borderLeftWidth = parseFloat(styles.borderLeftWidth);
    const borderRightWidth = parseFloat(styles.borderRightWidth);
    const paddingLeft = parseFloat(styles.paddingLeft);
    const paddingRight = parseFloat(styles.paddingRight);
    return width - borderLeftWidth - borderRightWidth - paddingLeft - paddingRight;
}

export function position() {
    const [el] = this;
    if (!el) return;
    let $el = $(el);
    let offsetParent;
    let offset;
    let doc;
    let parentOffset = { top: 0, left: 0 };
    // position:fixed elements are offset from the viewport, which itself always has zero offset
    if ($el.css('position') === 'fixed') {
        // Assume position:fixed implies availability of getBoundingClientRect
        offset = el.getBoundingClientRect();
    } else {
        offset = $el.offset();
        // Account for the *real* offset parent, which can be the document or its root element
        // when a statically positioned element is identified
        doc = el.ownerDocument;
        offsetParent = el.offsetParent || doc.documentElement;
        const $parentOffset = $(offsetParent);
        const parentOffsetElementPosition = $parentOffset.css('position') || 'static';
        while ( offsetParent && (offsetParent === doc.body || offsetParent === doc.documentElement) && parentOffsetElementPosition === 'static') {
            offsetParent = offsetParent.parentNode;
        }
        if (offsetParent && offsetParent !== el && offsetParent.nodeType === 1) {
            // Incorporate borders into its offset, since they are outside its content origin
            const offsetParentStyles = window.getComputedStyle(offsetParent);
            const borderTopWidth = parseFloat(offsetParentStyles.borderTopWidth) || 0;
            const borderLeftWidth = parseFloat(offsetParentStyles.borderLeftWidth) || 0;
            parentOffset = $parentOffset.offset();
            parentOffset.top += borderTopWidth;
            parentOffset.left += borderLeftWidth;
        }
    }
    const marginTop = parseFloat(window.getComputedStyle(el).marginTop) || 0;
    const marginLeft = parseFloat(window.getComputedStyle(el).marginLeft) || 0;
    // Subtract parent offsets and element margins
    return {
        top: offset.top - parentOffset.top - marginTop,
        left: offset.left - parentOffset.left - marginLeft
    };
}

export function offset(coordinates) {
    const [el] = this;
    //  Getter
    if (coordinates === undefined) {
        if (!el) return null;
        if (!el.getClientRects().length) {
            return { top: 0, left: 0 };
        }
        const rect = el.getBoundingClientRect();
        return {
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX
        };
    }
    // Setter
    if (!el) return this;
    const currentStyle = window.getComputedStyle(el);
    if (currentStyle.position === 'static') {
        this.css('position', 'relative');
    }
    const currentOffset = this.offset();
    const topDifference = coordinates.top - currentOffset.top;
    const leftDifference = coordinates.left - currentOffset.left;
    this.css({
        top: (parseFloat(currentStyle.top) || 0) + topDifference + 'px',
        left: (parseFloat(currentStyle.left) || 0) + leftDifference + 'px'
    });
    return this;
}

