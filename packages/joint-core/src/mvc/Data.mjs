class Data {

    constructor() {
        this.map = new WeakMap();
    }

    has(obj, key) {
        if (key === undefined) return this.map.has(obj);
        return key in this.map.get(obj);
    }

    create(obj) {
        if (!this.has(obj)) this.map.set(obj, Object.create(null));
        return this.get(obj);
    }

    get(obj, key) {
        if (!this.has(obj)) return undefined;
        const data = this.map.get(obj);
        if (key === undefined) return data;
        return data[key];
    }

    set(obj, key, value) {
        if (key === undefined) return;
        const data = this.create(obj);
        if (typeof key === 'string') {
            data[key] = value;
        } else {
            Object.assign(data, key);
        }
    }

    remove(obj, key) {
        if (!this.has(obj)) return;
        if (key === undefined) {
            this.map.delete(obj);
        } else {
            const data = this.map.get(obj);
            delete data[key];
        }
    }
}

export default Data;

