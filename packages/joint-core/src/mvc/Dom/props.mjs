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
    for (let attr in attributes) {
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

const methods = {
    prop,
    attr
};

Object.keys(propertySetters).forEach(methodName => {
    methods[methodName] = function(...args) {
        return this.prop(propertySetters[methodName], ...args);
    };
});

export default methods;
