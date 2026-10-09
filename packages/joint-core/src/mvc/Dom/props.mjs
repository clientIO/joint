import { isWindow } from './Dom.mjs';

const propertySetters = {
    outerWidth: 'offsetWidth',
    outerHeight: 'offsetHeight',
    innerWidth: 'clientWidth',
    innerHeight: 'clientHeight',
    scrollLeft: 'scrollLeft',
    scrollTop: 'scrollTop',
    val: 'value',
    text: 'textContent',
};

const propertiesMap = {
    disabled: 'disabled',
    value: 'value',
    text: 'textContent',
};

// A window has none of the element properties above. These methods read and
// scroll it as jQuery does; their setters leave a window's size alone.
const windowProperties = {
    outerWidth: {
        get: (win) => win.innerWidth,
        readsWithBoolean: true,
    },
    outerHeight: {
        get: (win) => win.innerHeight,
        readsWithBoolean: true,
    },
    innerWidth: {
        get: (win) => win.document.documentElement.clientWidth,
    },
    innerHeight: {
        get: (win) => win.document.documentElement.clientHeight,
    },
    scrollLeft: {
        get: (win) => win.pageXOffset,
        set: (win, value) => win.scrollTo(value, win.pageYOffset),
    },
    scrollTop: {
        get: (win) => win.pageYOffset,
        set: (win, value) => win.scrollTo(win.pageXOffset, value),
    },
};

function prop(name, value) {
    if (!name) throw new Error('no property provided');
    if (arguments.length === 1) {
        const [el] = this;
        if (!el) return null;
        return el[name];
    }
    if (value === undefined) return this;
    for (let i = 0; i < this.length; i++) {
        this[i][name] = value;
    }
    return this;
}

function attr(name, value) {
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
    for (const attr in attributes) {
        if (attributes.hasOwnProperty(attr)) {
            const value = attributes[attr];
            if (propertiesMap[attr]) {
                this.prop(propertiesMap[attr], value);
                continue;
            }
            for (let i = 0; i < this.length; i++) {
                if (value === null) {
                    this[i].removeAttribute(attr);
                } else {
                    this[i].setAttribute(attr, value);
                }
            }
        }
    }
    return this;
}

// A size or scroll method that reads and sets an element property, and
// handles a window through `windowProperty`.
function windowAwarePropertyMethod(name, windowProperty) {
    return function(...args) {
        const [el] = this;
        const [value] = args;
        const readsWindow = isWindow(el) && (args.length === 0 || (windowProperty.readsWithBoolean && typeof value === 'boolean'));
        if (readsWindow) return windowProperty.get(el);
        if (args.length === 0) return this.prop(name);
        if (value === undefined) return this;
        for (let i = 0; i < this.length; i++) {
            const node = this[i];
            if (!isWindow(node)) {
                node[name] = value;
            } else if (windowProperty.set) {
                windowProperty.set(node, value);
            }
        }
        return this;
    };
}

const methods = {
    prop,
    attr
};

Object.keys(propertySetters).forEach(methodName => {
    methods[methodName] = function(...args) {
        return this.prop(propertySetters[methodName], ...args);
    };
});

Object.keys(windowProperties).forEach(methodName => {
    methods[methodName] = windowAwarePropertyMethod(propertySetters[methodName], windowProperties[methodName]);
});

export default methods;
