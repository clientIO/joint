import { isPlainObject } from '../../util/util.mjs';

const validPropertiesList = ['checked', 'selected', 'disabled', 'readOnly', 'contentEditable', 'value', 'indeterminate'];

const validProperties = validPropertiesList.reduce((acc, key) => {
    acc[key] = true;
    return acc;
}, {});

const props = {
    qualify: function(properties) {
        return isPlainObject(properties);
    },
    set: function(properties, _, node) {
        Object.keys(properties).forEach(function(key) {
            if (validProperties[key] && key in node) {
                const value = properties[key];
                if (node.tagName === 'SELECT' && Array.isArray(value)) {
                    Array.from(node.options).forEach(function(option, index) {
                        option.selected = value.includes(option.value);
                    });
                } else {
                    node[key] = value;
                }
            }
        });
    }
};

export default props;
