/* eslint-disable no-console */
import { Bench } from 'tinybench';
import { createContainer, asReadonlyContainer } from '../src/store/state-container';
import type { ReadonlyContainer } from '../src/store/state-container';

interface ItemData {
  data: { label: string };
  x: number;
  y: number;
}

function populateContainer(count: number): ReadonlyContainer<ItemData> {
  const container = createContainer<ItemData>();
  for (let i = 0; i < count; i++) {
    container.set(`node-${i}`, { data: { label: `Node ${i}` }, x: i * 10, y: i * 10 });
  }
  return asReadonlyContainer(container);
}

function areMapsShallowEqual<K, V>(a: Map<K, V>, b: Map<K, V>): boolean {
  if (a.size !== b.size) return false;
  for (const [key, value] of a) {
    if (!b.has(key) || b.get(key) !== value) return false;
  }
  return true;
}

function logResults(bench: Bench): void {
  for (const task of bench.tasks) {
    const { result } = task;
    if (result.state === 'completed') {
      console.log(
        `  ${task.name}: ${Math.round(result.throughput.mean).toLocaleString()} ops/sec (avg ${(result.latency.mean * 1e6).toFixed(0)}ns)`
      );
    }
  }
}

describe('hooks-benchmark: container operations that hooks delegate to', () => {
  const sizes = [10, 100, 1000] as const;

  for (const size of sizes) {
    it(`${size} items — container key derivation (useContainerKeys hot path)`, async () => {
      const container = populateContainer(size);
      let previousKeys: string[] = [];

      const bench = new Bench({ time: 1000 });

      bench.add(`key derivation (${size})`, () => {
        const keys = [...container.getFull().keys()];
        // Simulate comparison with previous keys
        if (keys.length === previousKeys.length) {
          for (let i = 0; i < keys.length; i++) {
            if (keys[i] !== previousKeys[i]) break;
          }
        }
        previousKeys = keys;
      });

      await bench.run();
      console.log(`\n--- ${size} items — container key derivation ---`);
      logResults(bench);
      expect(bench.tasks.length).toBe(1);
    }, 30_000);

    it(`${size} items — container items full iteration + selector (useContainerItems hot path)`, async () => {
      const container = populateContainer(size);
      const selector = (item: ItemData) => item.data;

      const bench = new Bench({ time: 1000 });

      bench.add(`full iteration + selector (${size})`, () => {
        const result = new Map<string, { label: string }>();
        for (const [id, item] of container.getFull()) {
          result.set(id, selector(item));
        }
        return result;
      });

      await bench.run();
      console.log(`\n--- ${size} items — full iteration + selector ---`);
      logResults(bench);
      expect(bench.tasks.length).toBe(1);
    }, 30_000);

    it(`${size} items — single-ID get + selector (useContainerItem hot path)`, async () => {
      const container = populateContainer(size);
      const selector = (item: ItemData | undefined) => item?.data;

      let tick = 0;
      const bench = new Bench({ time: 1000 });

      bench.add(`single-ID get + selector (${size})`, () => {
        const idx = tick % size;
        tick++;
        const item = container.get(`node-${idx}`);
        return selector(item);
      });

      await bench.run();
      console.log(`\n--- ${size} items — single-ID get + selector ---`);
      logResults(bench);
      expect(bench.tasks.length).toBe(1);
    }, 30_000);

    it(`${size} items — shallow Map comparison (useContainerItems optimization)`, async () => {
      const container = populateContainer(size);
      const mapA = new Map<string, { label: string }>();
      const mapB = new Map<string, { label: string }>();

      for (const [id, item] of container.getFull()) {
        const ref = item.data;
        mapA.set(id, ref);
        mapB.set(id, ref); // Same references — equal case
      }

      const bench = new Bench({ time: 1000 });

      bench
        .add(`shallow Map equal (${size})`, () => {
          areMapsShallowEqual(mapA, mapB);
        })
        .add(`shallow Map unequal (${size})`, () => {
          // Differ on last key
          const diffMap = new Map(mapB);
          diffMap.set(`node-${size - 1}`, { label: 'Different' });
          areMapsShallowEqual(mapA, diffMap);
        });

      await bench.run();
      console.log(`\n--- ${size} items — shallow Map comparison ---`);
      logResults(bench);
      expect(bench.tasks.length).toBe(2);
    }, 30_000);
  }
});
