export class Deque {
    constructor() {
        this.head = null;
        this.tail = null;
        this.map = new Map(); // key -> node
    }

    [Symbol.iterator]() {
        let current = this.head;
        return {
            next: () => {
                if (current) {
                    const value = current.key;
                    current = current.next;
                    return { value, done: false };
                }
                return { done: true };
            }
        };
    }

    popHead() {
        if (!this.head) return;
        const node = this.head;
        this.map.delete(node.key);
        this.head = node.next;
        if (this.head) {
            this.head.prev = null;
        } else {
            this.tail = null;
        }
        return node;
    }

    pushTail(key, value) {
        if (this.map.has(key)) {
            // TODO: handle case where key already exists
            return;
        }
        const node = {
            key,
            value,
            prev: null,
            next: null
        };
        this.map.set(key, node);

        if (!this.tail) {
            this.head = this.tail = node;
        } else {
            this.tail.next = node;
            node.prev = this.tail;
            this.tail = node;
        }
    }

    moveToHead(key) {
        const node = this.map.get(key);
        if (!node) return;
        if (node === this.head) return; // already at head
        // Remove node from its current position
        if (node.prev) node.prev.next = node.next;
        if (node.next) node.next.prev = node.prev;
        if (node === this.tail) this.tail = node.prev; // if it's the tail
        if (node === this.head) this.head = node.next; // if it's the head
        // Move node to head
        node.prev = null;
        node.next = this.head;
        if (this.head) {
            this.head.prev = node; // link old head back to new head
        }
        this.head = node; // update head to be the moved node
        if (!this.tail) {
            this.tail = node; // if it was the only node, set tail as well
        }
    }


    // method to see the first node in the deque
    peekHead() {
        return this.head;
    }

    // method to move the first node to the end of the deque
    rotate() {
        if (!this.head || !this.head.next) return;
        this.tail.next = this.head; // link tail to head
        this.head.prev = this.tail; // link head back to tail
        this.tail = this.head; // update tail to be the old head
        this.head = this.head.next; // move head to the next node
        this.tail.next = null; // set new tail's next to null
        this.head.prev = null; // set new head's prev to null
    }

    // method to remove a node by key
    delete(key) {
        const node = this.map.get(key);
        if (!node) return false;

        if (node.prev) node.prev.next = node.next;
        else this.head = node.next;

        if (node.next) node.next.prev = node.prev;
        else this.tail = node.prev;

        this.map.delete(key);
        return true;
    }

    has(key) {
        return this.map.has(key);
    }

    get(key) {
        return this.map.get(key);
    }

    get length() {
        return this.map.size;
    }
}
