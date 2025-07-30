/**
 * Deque implementation for managing a double-ended queue.
 * This implementation uses a doubly linked list for efficient operations.
 * It supports operations like push, pop, move to head, and delete.
 * The deque maintains a map for O(1) access to nodes by key.
 */
export class Deque {
    constructor() {
        this.head = null;
        this.tail = null;
        this.map = new Map(); // key -> node
    }

    // Return an array of keys in the deque
    keys() {
        let current = this.head;
        const keys = [];
        while (current) {
            keys.push(current.key);
            current = current.next;
        }
        return keys;
    }

    // Return the first node and remove it from the deque
    popHead() {
        if (!this.head) return null;
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

    // Add a new node to the back of the deque
    pushTail(key, value) {
        if (this.map.has(key)) {
            throw new Error(`Key "${key}" already exists in the deque.`);
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

    // Move a node from the deque to the head
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

    // Return the first node without removing it
    peekHead() {
        return this.head || null;
    }

    // Move the head node to the back of the deque
    rotate() {
        if (!this.head || !this.head.next) return;
        this.tail.next = this.head; // link tail to head
        this.head.prev = this.tail; // link head back to tail
        this.tail = this.head; // update tail to be the old head
        this.head = this.head.next; // move head to the next node
        this.tail.next = null; // set new tail's next to null
        this.head.prev = null; // set new head's prev to null
    }

    // Remove a node from the deque
    delete(key) {
        const node = this.map.get(key);
        if (!node) return;

        if (node.prev) node.prev.next = node.next;
        else this.head = node.next;

        if (node.next) node.next.prev = node.prev;
        else this.tail = node.prev;

        this.map.delete(key);
    }

    // Does the deque contain a node with the given key?
    has(key) {
        return this.map.has(key);
    }

    // Get the node with the given key
    get(key) {
        return this.map.get(key) || null;
    }

    // Number of nodes in the deque
    get length() {
        return this.map.size;
    }
}
