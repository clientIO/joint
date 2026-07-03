# Record Update Benchmark Results

Comparing approaches for immutably updating a single item in a `Record<string, Item>`.

**Setup:** Each approach updates one item in a record of N items, producing a new record reference. Map and array are pre-built (not included in benchmark time).

## Results

| # | Approach | 10 items | 1,000 items | 10,000 items |
|---|----------|----------|-------------|--------------|
| 1 | `{...record, [id]: new}` | 0.1µs (15M ops/s) | 150µs (6.7K ops/s) | 1,627µs (615 ops/s) |
| 2 | Map iterate → record | 0.5µs (1.9M ops/s) | 91µs (10.9K ops/s) | 460µs (2.2K ops/s) |
| 3 | Object.assign + mutate | 0.1µs (15M ops/s) | 274µs (3.7K ops/s) | 1,916µs (522 ops/s) |
| 4 | Object.create (proto) | 0.1µs (18M ops/s) | 0.1µs (16M ops/s) | 0.1µs (17M ops/s) |
| 5 | Proxy copy-on-write | 0.1µs (14M ops/s) | 0.1µs (15M ops/s) | 0.1µs (16M ops/s) |
| 6 | new Map + fromEntries | 1.3µs (791K ops/s) | 115µs (8.7K ops/s) | 1,373µs (728 ops/s) |
| 7 | Object.keys loop | 0.2µs (4.8M ops/s) | 104µs (9.6K ops/s) | 826µs (1.2K ops/s) |
| 8 | for...in loop | 0.1µs (9.2M ops/s) | 87µs (11.5K ops/s) | 900µs (1.1K ops/s) |
| 9 | Array iterate → record | 0.2µs (5.8M ops/s) | 87µs (11.5K ops/s) | 423µs (2.4K ops/s) |
| 10 | [...array] only (no record) | 0.03µs (30M ops/s) | 1.1µs (948K ops/s) | 7.2µs (138K ops/s) |

## Array Update Results

Comparing approaches for immutably updating a single item in an `Item[]` array.

| # | Approach | 10 items | 1,000 items | 10,000 items |
|---|----------|----------|-------------|--------------|
| 1 | `[...array]` + assign | 0.03µs (34M ops/s) | 0.8µs (1.2M ops/s) | 1.0µs (973K ops/s) |
| 2 | Map iterate → array | 0.6µs (1.8M ops/s) | 12µs (83K ops/s) | 115µs (8.7K ops/s) |

Array spread wins at every size — **19x** at 10 items, **15x** at 1K, **112x** at 10K. `[...array]` is a native memcpy of pointers, no per-element JS iteration.

## Approach Details

```ts
// 1. Spread record
const updated = { ...record, [targetId]: newItem };

// 2. Map iterate → record (Map pre-built)
const result = {};
for (const [id, item] of map) {
    result[id] = id === targetId ? newItem : item;
}

// 3. Object.assign + mutate
const updated = Object.assign({}, record);
updated[targetId] = newItem;

// 4. Object.create (prototype trick) — O(1) but breaks Object.keys/enumeration
const updated = Object.create(record);
updated[targetId] = newItem;

// 5. Proxy copy-on-write — O(1) but adds read-time overhead
new Proxy(record, {
    get(target, prop) {
        return prop === targetId ? newItem : target[prop];
    },
});

// 6. new Map + fromEntries
const cloned = new Map(map);
cloned.set(targetId, newItem);
Object.fromEntries(cloned);

// 7. Object.keys loop
const result = {};
const keys = Object.keys(record);
for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    result[key] = key === targetId ? newItem : record[key];
}

// 8. for...in loop
const result = {};
for (const key in record) {
    result[key] = key === targetId ? newItem : record[key];
}

// 9. Array iterate → record (array pre-built)
const result = {};
for (const item of array) {
    result[item.id] = item.id === targetId ? newItem : item;
}

// 10. [...array] only — no record rebuild
const updated = [...array];
updated[targetIndex] = newItem;
```

## Key Takeaways

- **Small records (< ~100 items):** Spread `{...record}` is fine — fast and simple.
- **Large records (1K+):** Spread degrades fast due to string key rehashing. Array iterate → record (#9) and Map iterate (#2) are 3-4x faster.
- **Object.create / Proxy** are O(1) but defer cost to read time. Only useful if consumers don't enumerate keys.
- **Object.assign is worse than spread** at scale — surprising but consistent.
- **Arrays are king** if you don't need a record output: `[...array]` is 138K ops/s at 10K items vs 2.4K ops/s for the fastest record approach.
