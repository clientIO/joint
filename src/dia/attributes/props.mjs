function propertyWrapper(property) {
    return {
        qualify: function(_, node) {
            return property in node;
        },
        set: function(value, _, node) {
            node[property] = value;
        }
    };
}

export const checked = propertyWrapper('checked');

export const selected = propertyWrapper('selected');

export const disabled = propertyWrapper('disabled');

export const readonly = propertyWrapper('readOnly');

export const contenteditable = propertyWrapper('contentEditable');

export const value = {
    qualify: function(_, node) {
        return 'value' in node;
    },
    set: function(value, _, node) {
        if (node.tagName === 'SELECT' && Array.isArray(value)) {
            Array.from(node.options).forEach(function(option, index) {
                option.selected = value.includes(option.value);
            });
        } else {
            node.value = value;
        }
    }
};
