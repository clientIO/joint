import { dia, util } from '@joint/core';
import { parseFromSVGString } from '../parser';

export interface ModelOptions {
    attributes?: dia.Cell.Attributes;
    template?: string;
    namespace?: any;
}

export function Model(options: ModelOptions) {
    const { attributes = {}, template, namespace } = options;
    return function Entity<Ctor extends { new(...args: any[]): dia.Cell }>(target: Ctor): Ctor {

        const { markup, attrs, bindings } = parseFromSVGString(template);

        const type = target.name;
        if (namespace) {
            namespace[type] = target;
        }

        Object.defineProperty(target.prototype, 'markup', {
            value: markup,
            enumerable: true
        });

        const targetDefaults = target.prototype.defaults;
        Object.defineProperty(target.prototype, 'defaults', {
            value: function () {
                const defaults = (typeof targetDefaults === 'function') ? targetDefaults.call(this) : targetDefaults
                return {
                    // can not use `super` here
                    ...defaults,
                    ...attributes,
                    type,
                    attrs: util.defaultsDeep(attrs, attributes.attrs, defaults.attrs),
                }
            }
        });

        const targetInitialize = target.prototype.initialize;
        Object.defineProperty(target.prototype, 'initialize', {
            value: function () {
                targetInitialize.apply(this, arguments);
                this.on('change', __onChange);
                __updateBindings(this, this.attributes);
            }
        });

        function __updateBindings(cell: dia.Cell, changed: any, opt: dia.Cell.Options = {}) {
            const attrs = {};

            let changedBindings = bindings.filter(binding => binding.triggers.some(trigger => Object.keys(changed).includes(trigger)))

            for (const { id, path, expression, args, isFunction, triggers, name } of changedBindings) {
                const existingExpression = util.getByPath(attrs, path);
                let evalExpression;

                if (existingExpression !== undefined) {
                    // one of the bound properties has been already resolved
                    evalExpression = existingExpression;
                } else {
                    evalExpression = expression;
                }
                const expressionRegex = new RegExp(`\\${id}`, 'g');
                let value = cell.attributes[triggers[0]];

                if (isFunction) {
                    const attributeValues = triggers.map(attribute => cell.attributes[attribute]);
                    // @ts-ignore
                    const functions = cell.constructor['functions'] || {};
                    if (name in functions) {
                        value = functions[name].call(cell, ...attributeValues, ...args);
                    } else {
                        throw new Error(`Function '${name}' is not defined.`);
                    }
                }

                evalExpression = evalExpression.replace(expressionRegex, value);
                util.setByPath(attrs, path, evalExpression);
            }

            opt.unset = false;
            cell.attr(attrs, opt);
        }

        function __onChange(this: dia.Cell, cell: dia.Cell, opt: dia.Cell.Options = {}) {
            __updateBindings(cell, this.changed, opt);
        }

        return target;
    }
}
