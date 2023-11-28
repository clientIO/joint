import $ from './Dom.mjs';
import V from '../../V/index.mjs';
import { dataPriv, cleanNodesData } from './vars.mjs';

// Manipulation

$.fn.remove = function() {
    for (let i = 0; i < this.length; i++) {
        const node = this[i];
        dataPriv.remove(node);
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
};

$.fn.empty = function() {
    for (let i = 0; i < this.length; i++) {
        const node = this[i];
        if (node.nodeType === 1) {
            cleanNodesData(dataPriv, node.getElementsByTagName('*'));
            // Remove any remaining nodes
            node.textContent = '';
        }
    }
    return this;
};

$.fn.html = function(html) {
    const [el] = this;
    cleanNodesData(dataPriv, el.getElementsByTagName('*'));
    if (typeof string === 'string') {
        el.innerHTML = html;
    } else {
        el.innerHTML = '';
        return this.append(html);
    }
    return this;
};

$.fn.append = function(...nodes) {
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
};

$.fn.appendTo = function(parent) {
    $(parent).append(this);
    return this;
};

// Styles and attributes

$.fn.css = function(name, value) {
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
};

$.fn.attr = function(name, value) {
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
        throw new Error('no styles provided');
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
};

// Classes

$.fn.removeClass = function() {
    for (let i = 0; i < this.length; i++) {
        const node = this[i];
        V.prototype.removeClass.apply({ node }, arguments);
    }
    return this;
};

$.fn.addClass = function() {
    for (let i = 0; i < this.length; i++) {
        const node = this[i];
        V.prototype.addClass.apply({ node }, arguments);
    }
    return this;
};

$.fn.hasClass = function() {
    const [node] = this;
    if (!node) return false;
    return V.prototype.hasClass.apply({ node }, arguments);
};
