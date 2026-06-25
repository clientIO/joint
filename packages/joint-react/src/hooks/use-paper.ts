import { useCallback, useContext, useMemo, useReducer, useLayoutEffect, useRef } from 'react';
import { PaperStoreContext } from '../context';
import type { PaperStore } from '../store';
import { useGraphStore } from './use-graph-store';
import { useInternalData } from './use-stores';
import type { PaperView } from '../mvc/paper';
import { DEFAULT_PAPER_ID } from '../mvc/paper';
import type { PaperTarget } from '../types';
import { resolvePaperId } from '../utils/resolve-paper-target';
import { isRef } from '../utils/is';

/**
 * Resolves a paper ID from any `PaperTarget`, handling the ref-timing problem.
 * For string IDs and `dia.Paper` instances resolution is synchronous. For
 * `RefObject<dia.Paper>` targets, a layout effect re-resolves the ID once
 * `useImperativeHandle` has set the ref.
 * @param paperTarget - The paper target to resolve.
 * @returns The paper ID string, or `undefined` when not yet available.
 * @internal
 */
export function useResolvePaperId(paperTarget: PaperTarget | undefined): string | undefined {
  const isRefTarget = isRef(paperTarget);
  const paperId = resolvePaperId(paperTarget);
  const [, forceRender] = useReducer((c: number) => c + 1, 0);
  const resolvedIdRef = useRef<string | null>(paperId);
  resolvedIdRef.current = paperId;

  useLayoutEffect(() => {
    if (!isRefTarget || resolvedIdRef.current) return;
    const resolvedId = resolvePaperId(paperTarget);
    if (resolvedId) {
      resolvedIdRef.current = resolvedId;
      forceRender();
    }
  });

  return resolvedIdRef.current ?? undefined;
}

/**
 * Returns the active paper store from context, by ID, or via the default paper.
 *
 * A paper store is view-access: it exists only once a `<Paper>` has mounted, so
 * the result is `PaperStore | undefined` and this hook never throws.
 *
 * Resolution order (no explicit id):
 * 1. `PaperStoreContext` (when called inside a `<Paper>` subtree)
 * 2. `DEFAULT_PAPER_ID` lookup (when a single `<Paper>` exists without an explicit `id`)
 * @param paperId - An explicit paper id, or omitted for the context/default paper.
 * @returns The resolved paper store, or `undefined` when no paper is mounted yet.
 * @group Hooks
 */
export function usePaperStore(paperId?: string): PaperStore | undefined {
  const contextStore = useContext(PaperStoreContext);
  const { getPaperStore } = useGraphStore();

  const paperStoreById = useInternalData((snapshot) => {
    if (paperId) {
      return snapshot.papers[paperId] ? (getPaperStore(paperId) ?? null) : null;
    }
    if (!contextStore && snapshot.papers[DEFAULT_PAPER_ID]) {
      return getPaperStore(DEFAULT_PAPER_ID) ?? null;
    }
    return null;
  });

  if (paperId) return paperStoreById ?? undefined;
  if (contextStore) return contextStore;
  return paperStoreById ?? undefined;
}

/**
 * Result of {@link usePaper} — the paper instance and imperative actions.
 * @expand
 * @group Types
 */
export interface PaperApi {
  /** Resolved JointJS paper instance, or `null` until a `<Paper>` has mounted. */
  readonly paper: PaperView | null;
  /**
   * Trigger a render pass on the paper. Forwards to `paper.wakeUp()`.
   * No-op when the paper isn't resolved yet.
   * @see https://docs.jointjs.com/api/dia/Paper#wakeUp
   */
  readonly wakeUp: () => void;
}

/**
 * Returns the active `PaperView` instance from context, by ID, or via the
 * default paper. Resolves the paper store and exposes `wakeUp()`.
 *
 * The returned object is always stable; only `paper` is `null` until the
 * `<Paper>` view has mounted.
 * @param paperId - An explicit paper id, or omitted for the context/default paper.
 * @returns A stable object with the resolved `paper` (or `null`) and a `wakeUp` action.
 * @see https://docs.jointjs.com/learn/quickstart/paper
 * @group Hooks
 */
export function usePaper(paperId?: string): PaperApi {
  const paperStore = usePaperStore(paperId);
  const paper = paperStore?.paper ?? null;
  const wakeUp = useCallback(() => {
    paper?.wakeUp();
  }, [paper]);
  return useMemo(() => ({ paper, wakeUp }), [paper, wakeUp]);
}
