class Data {

    constructor() {
        this.map = new WeakMap();
    }

    has(obj, key) {
        if (key === undefined) return this.map.has(obj);
        return key in this.map.get(obj);
    }

    read(obj, key) {
        if (!this.has(obj)) return null;
        const data = this.map.get(obj);
        if (key === undefined) return data;
        return data[key];
    }

    get(obj, key) {
        if (!this.has(obj)) this.map.set(obj, Object.create(null));
        return this.read(obj, key);
    }

    set(obj, key, value) {
        const data = this.get(obj);
        if (key === undefined) {
            if (value === undefined) return;
            Object.assign(data, value);
        } else {
            data[key] = value;
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

