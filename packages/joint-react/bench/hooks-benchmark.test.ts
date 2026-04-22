/* eslint-disable no-console */
import { Bench } from 'tinybench';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createContainer, asReadonlyContainer } from '../src/store/state-container';
import type { ReadonlyContainer } from '../src/store/state-container';
import { saveBenchResults } from './save-baseline';

const benchDirectory = path.dirname(fileURLToPath(import.meta.url));
const baselinePath = path.join(benchDirectory, 'baseline-pre-refactor.json');

interface ItemData {
  data: { label: string };
  x: number;
  y: number;
}

function selectItemData(item: ItemData): { label: string } {
  return item.data;
}

function selectOptionalItemData(item: ItemData | undefined): { label: string } | undefined {
  return item?.data;
}

function populateContainer(count: number): ReadonlyContainer<ItemData> {
  const container = createContainer<ItemData>();
  for (let index = 0; index < count; index++) {
    container.set(`node-${index}`, { data: { label: `Node ${index}` }, x: index * 10, y: index * 10 });
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
          for (const [index, key] of keys.entries()) {
            if (key !== previousKeys[index]) break;
          }
        }
        previousKeys = keys;
      });

      await bench.run();
      console.log(`\n--- ${size} items — container key derivation ---`);
      logResults(bench);
      saveBenchResults(bench, `hooks/key-derivation/n=${size}`, baselinePath);
      expect(bench.tasks.length).toBe(1);
    }, 30_000);

    it(`${size} items — container items full iteration + selector (useContainerItems hot path)`, async () => {
      const container = populateContainer(size);
      const bench = new Bench({ time: 1000 });

      bench.add(`full iteration + selector (${size})`, () => {
        const result = new Map<string, { label: string }>();
        for (const [id, item] of container.getFull()) {
          result.set(id, selectItemData(item));
        }
        return result;
      });

      await bench.run();
      console.log(`\n--- ${size} items — full iteration + selector ---`);
      logResults(bench);
      saveBenchResults(bench, `hooks/full-iteration-selector/n=${size}`, baselinePath);
      expect(bench.tasks.length).toBe(1);
    }, 30_000);

    it(`${size} items — single-ID get + selector (useContainerItem hot path)`, async () => {
      const container = populateContainer(size);
      let tick = 0;
      const bench = new Bench({ time: 1000 });

      bench.add(`single-ID get + selector (${size})`, () => {
        const index = tick % size;
        tick++;
        const item = container.get(`node-${index}`);
        return selectOptionalItemData(item);
      });

      await bench.run();
      console.log(`\n--- ${size} items — single-ID get + selector ---`);
      logResults(bench);
      saveBenchResults(bench, `hooks/single-id-get-selector/n=${size}`, baselinePath);
      expect(bench.tasks.length).toBe(1);
    }, 30_000);

    it(`${size} items — shallow Map comparison (useContainerItems optimization)`, async () => {
      const container = populateContainer(size);
      const mapA = new Map<string, { label: string }>();
      const mapB = new Map<string, { label: string }>();

      for (const [id, item] of container.getFull()) {
        const reference = item.data;
        mapA.set(id, reference);
        mapB.set(id, reference); // Same references — equal case
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
      saveBenchResults(bench, `hooks/shallow-map-comparison/n=${size}`, baselinePath);
      expect(bench.tasks.length).toBe(2);
    }, 30_000);
  }
});
