/* eslint-disable no-console */
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import type { Bench } from 'tinybench';

interface BaselineMeta {
  savedAt: string;
  gitSha: string;
  node: string;
  platform: string;
}

interface BaselineTaskResult {
  name: string;
  opsPerSec: number;
  mean: number;
  stddev: number;
  min: number;
  max: number;
  samples: number;
}

interface BaselineFile {
  meta: BaselineMeta;
  results: Record<string, readonly BaselineTaskResult[]>;
}

/**
 * Reads and parses an existing baseline JSON file from disk.
 * Returns undefined if the file does not exist or cannot be parsed.
 * @param path - Absolute path to the baseline JSON file.
 * @returns The parsed baseline file, or undefined if missing or unreadable.
 */
function readExisting(path: string): BaselineFile | undefined {
  if (!existsSync(path)) return undefined;
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as BaselineFile;
  } catch {
    return undefined;
  }
}

/**
 * Executes a shell command and returns its stdout as a string.
 * Returns an empty string if the command fails.
 * @param cmd - Shell command to execute.
 * @returns The stdout output of the command, or an empty string on failure.
 */
function safeExec(cmd: string): string {
  try {
    // The command is a hard-coded constant — no user input is involved.
    // eslint-disable-next-line sonarjs/os-command
    return execSync(cmd, { encoding: 'utf8' });
  } catch {
    return '';
  }
}

/**
 * Appends benchmark results for a named label to a shared baseline JSON file.
 * If the file already exists, existing results for other labels are preserved.
 * @param bench - The tinybench Bench instance after `bench.run()` completes.
 * @param label - Unique label identifying this benchmark scenario (e.g. 'graph-view/position-change/n=10').
 * @param outPath - Absolute path to the baseline JSON output file.
 */
export function saveBenchResults(bench: Bench, label: string, outPath: string): void {
  const existing = readExisting(outPath);
  const meta: BaselineMeta = {
    savedAt: new Date().toISOString(),
    gitSha: safeExec('git rev-parse HEAD').trim() || 'unknown',
    node: process.version,
    platform: `${process.platform}/${process.arch}`,
  };
  const previousResults = existing?.results ?? {};
  const results: Record<string, readonly BaselineTaskResult[]> = {
    ...previousResults,
    [label]: bench.tasks.map((task): BaselineTaskResult => {
      const result = task.result;
      // Only completed tasks have latency/throughput stats. Guard with a
      // state check so partially-failed runs still produce a parseable file.
      const isCompleted = result && result.state === 'completed';
      return {
        name: task.name,
        // throughput.mean = ops/ms → convert to ops/sec
        opsPerSec: isCompleted ? result.throughput.mean * 1000 : 0,
        mean: isCompleted ? result.latency.mean : 0,
        stddev: isCompleted ? result.latency.sd : 0,
        min: isCompleted ? result.latency.min : 0,
        max: isCompleted ? result.latency.max : 0,
        samples: isCompleted ? result.latency.samplesCount : 0,
      };
    }),
  };
  // eslint-disable-next-line unicorn/no-null -- JSON.stringify requires null (not undefined) as the replacer argument
  writeFileSync(outPath, `${JSON.stringify({ meta, results }, null, 2)}\n`);
  console.log(`[baseline] wrote ${bench.tasks.length} task(s) to ${outPath} under label "${label}"`);
}
