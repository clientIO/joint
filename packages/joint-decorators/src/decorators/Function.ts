export function Function(fnName?: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return function(target: any, name: string, descriptor: PropertyDescriptor) {
        if (!target.constructor.functions) {
            target.constructor.functions = {};
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        target.constructor.functions[fnName || name] = function(...args: any[]) {
            return target[name].apply(this, args);
        };
        return descriptor;
    };
}
