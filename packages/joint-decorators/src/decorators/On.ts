export function On(eventName: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return function(target: any, name: string, descriptor: PropertyDescriptor) {
        if (!target.events) {
            target.events = {};
        }
        if (typeof target.events === 'function') {
            throw new Error('The on decorator is not compatible with an events method');
        }
        if (!eventName) {
            throw new Error('The on decorator requires an eventName argument');
        }
        target.events[eventName] = name;
        return descriptor;
    };
}
