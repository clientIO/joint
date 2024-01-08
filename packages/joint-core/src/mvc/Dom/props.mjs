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

const properties = {
    outerWidth: 'offsetWidth',
    outerHeight: 'offsetHeight',
    innerWidth: 'clientWidth',
    innerHeight: 'clientHeight',
    scrollLeft: 'scrollLeft',
    scrollTop: 'scrollTop',
    val: 'value',
};

export const methods = {
    prop
};

Object.keys(properties).forEach(methodName => {
    methods[methodName] = function(...args) {
        return this.prop(properties[methodName], ...args);
    };
});

