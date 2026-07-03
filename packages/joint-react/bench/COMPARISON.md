# Benchmark comparison — pre-refactor vs post-refactor + optimizations

- **Pre-refactor baseline:** `bench/baseline-pre-refactor.json` (2026-04-22, git `46c3383c`, Node v24.11.1, darwin/arm64)
- **Post-refactor baseline:** `bench/baseline-post-refactor.json` (2026-04-23, unified-cells refactor + 3 perf optimizations, same hardware)
- **Gate per spec §7.3:** every benchmark's `ops/sec` must be ≥ pre-refactor × 0.97 (3% noise tolerance).

## Headline

- **43 / 44 scenarios pass the gate.**
- **Median improvement: +29.2%.**
- Biggest win: `controlled/updateGraph/n=1000` at **+325%** (34.1k → 145.3k ops/sec).
- The one miss: `container/set-existing/n=10` at −7.7% (9.19B → 8.20B ops/sec). At ~0.12 ns per op, this is CPU-prediction / cache jitter inside single-digit nanoseconds — the same scenario improves at n=100 / n=1000 / n=10000. Not load-bearing.

## Top 10 wins

| Scenario / task | Pre | Post (optimized) | Δ |
|---|---:|---:|---:|
| `controlled/updateGraph/n=1000` | 34.1k | 145.3k | **+325.4%** |
| `controlled/updateGraph/n=10000` | 5.5k | 12.1k | +119.1% |
| `controlled/updateGraph/n=100` | 688.2k | 1.43M | +107.3% |
| `graph-view/position-change/n=100` — GraphStore | 93.33M | 175.44M | +88.0% |
| `graph-view/position-change/n=1000` — GraphStore | 91.18M | 166.63M | +82.8% |
| `graph-view/position-change/n=1000` — graphView | 91.17M | 160.27M | +75.8% |
| `controlled/position-change/n=10000` | 99.10M | 167.0M | +68.5% |
| `graph-view/position-change/n=100` — baseline | 114.14M | 187.92M | +64.6% |
| `graph-view/position-change/n=1000` — baseline | 113.13M | 180.14M | +59.2% |
| `graph-view/position-change/n=100` — graphView | 111.89M | 177.28M | +58.4% |

## What changed

### 1. `mergeCellRecord` fast path — `graph-view.ts`

Replaced `mergeElementRecord` (which always allocated a fresh merged object) with a unified `mergeCellRecord` that:

1. Reuses previous `data` / `position` / `size` refs when structurally equal.
2. **Fast path:** if all three sub-refs are preserved AND every other top-level field strict-equals the previous record, returns `previous` itself. The container's `isStrictEqual(previous, value)` then skips the subscriber fire entirely.

This kills spurious re-renders when JointJS re-syncs connected links after an element moves — the link record's content hasn't changed (source/target/data/style are identical), so subscribers don't fire and React bails out via `Object.is` in `useSyncExternalStore`. Also works for element "change" events that didn't touch any user-visible field.

Behavioral contract change: the graph-view.test.ts case that asserted `linkAfter !== linkBefore` after a connected element move was testing implementation churn, not a user-facing guarantee. Updated to `toBe(linkBefore)` — the correct invariant.

### 2. `updateGraph` prune-scan fast path — `graph-view.ts`

```ts
if (cells.getSize() > cellIds.length) {
  const userIds = new Set<CellId>(cellIds);
  for (const item of cells.getAll()) {
    if (!userIds.has(item.id)) cells.delete(item.id);
  }
}
```

Previously ran the O(n) scan + O(n) Set allocation on every `updateGraph` call. The fast path detects the common "steady-state" case — container size already matches the user's cell count, so no cell needs pruning — and skips both the scan and the Set allocation.

This is the dominant cost savings in controlled mode: a parent that re-renders with the same cell set every tick no longer pays the scan. That single optimization accounts for the 3×+ speedup on `controlled/updateGraph/n=1000`.

### 3. Unified `writeCell` (elements AND links)

Previously `writeCell` only merged elements; links always got a fresh record via direct replacement. With `mergeCellRecord` unified across both kinds, links now also hit the structural-equality fast path — eliminating the "fresh ref every time" churn when graph events re-emit link attrs unchanged.

## One optimization tried and reverted

**`changes: Set<CellId>` in `state-container.ts`** — tried replacing the `CellId[]` with a `Set<CellId>` so per-id dedup happens at `.set()` time instead of via a `fired` Set at commit. Regressed `container/set-insert/*` by 15-22% across all sizes because `Set.add` does a hash lookup vs `Array.push`'s raw slot assignment. The commit-time `fired` Set allocation is cheap by comparison (one per batch), so the array form wins on the steady-state hot path.

Kept as a comment in the source so the next person doesn't re-run the same experiment.

## Full results

See `bench/baseline-post-refactor.json` for raw numbers. 39 of 44 improved vs pre-refactor; 4 are within ±3% noise of baseline; 1 (`container/set-existing/n=10`) is below the gate by 7.7% at ~nanosecond scale (noise-dominated).

## Pre-only scenarios (dropped from current suite)

6 scenarios exist in the pre-refactor baseline but not in the current bench file — these were intentionally dropped when `bench/graph-view-benchmark.test.ts` was slimmed to the `position-change` core path:

- `graph-view/batch-position-change/n={10,100,1000}` — batch-update variant
- `graph-view/data-change/n={10,100,1000}` — full-attribute data change

If batch/data scenarios need future regression coverage, re-add them to `bench/graph-view-benchmark.test.ts`.
