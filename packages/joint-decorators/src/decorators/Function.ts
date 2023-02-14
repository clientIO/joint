export function Function(fnName?: string) {
    return function(target: any, name: string, descriptor: PropertyDescriptor) {
        if (!target.constructor.functions) {
            target.constructor.functions = {};
        }
        target.constructor.functions[fnName || name] = function(...args: any[]) {
            return target[name].apply(this, args);
        }
        return descriptor;
    }
}
