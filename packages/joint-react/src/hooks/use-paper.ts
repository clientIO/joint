/* eslint-disable @typescript-eslint/unified-signatures */
import { useContext, useReducer, useLayoutEffect, useRef } from 'react';
import { PaperStoreContext } from '../context';
import type { PaperStore } from '../store';
import { useGraphStore } from './use-graph-store';
import { useInternalData } from './use-stores';
import type { dia } from '@joint/core';
import type { PaperTarget } from '../types';
import { OPTIONAL, resolvePaperId } from '../types';

/**
 * Resolves a paper ID from any `PaperTarget`, handling the ref-timing problem.
 * For string IDs, `dia.Paper` instances, and `Nullable` targets, resolution is
 * synchronous — no effects are scheduled. For `RefObject<dia.Paper>` targets,
 * `resolvePaperId` returns `null` during render (ref not yet populated).
 * A layout effect re-resolves the ID once `useImperativeHandle` has set the ref
 * and triggers a single re-render.
 * @param target - The paper target to resolve.
 * @returns The paper ID string, or `NULLABLE` sentinel when not yet available.
 * @internal
 */
export function useResolvePaperId(target: PaperTarget | undefined): string | Optional {
  const isRefTarget = isRef(target);
  const paperId = resolvePaperId(target);
  const [, forceRender] = useReducer((c: number) => c + 1, 0);
  const resolvedIdRef = useRef<string | null>(paperId);
  resolvedIdRef.current = paperId;

  useLayoutEffect(() => {
    if (!isRefTarget || resolvedIdRef.current) return;
    // Re-resolve inside the layout effect where the ref is already populated.
    const id = resolvePaperId(target);
    if (id) {
      resolvedIdRef.current = id;
      forceRender();
    }
  });

  return resolvedIdRef.current ?? OPTIONAL;
}
import type { Optional } from '../types';
import { isString, isRecord, isRef } from '../utils/is';

/**
 * Returns the active paper store.
 * All overloads must be used inside a `GraphProvider`.
 * Use this hook in one of three modes:
 * - with no arguments, read the current `PaperStore` from `Paper` context
 * - with `{ optional: true }`, still read the current `PaperStore` from `Paper` context but return `null` instead of throwing when the context is missing
 * - with a paper id, read a specific paper store from the graph store
 * @group Hooks
 * @returns The resolved paper store for the current context or requested id.
 * @example
 * ```tsx
 * import { usePaperStore } from '@joint/react';
 *
 * function PaperToolbar() {
 *   const paperStore = usePaperStore();
 *
 *   return <span>{paperStore.paperId}</span>;
 * }
 * ```
 * @example
 * ```tsx
 * import { usePaperStore } from '@joint/react';
 *
 * function OptionalOverlay() {
 *   const paperStore = usePaperStore({ optional: true });
 *
 *   if (!paperStore) return null;
 *
 *   return <span>{paperStore.paper.svg.tagName}</span>;
 * }
 * ```
 * @example
 * ```tsx
 * import { usePaperStore } from '@joint/react';
 *
 * function Inspector() {
 *   const paperStore = usePaperStore('main-paper');
 *
 *   return paperStore ? <span>{paperStore.paperId}</span> : null;
 * }
 * ```
 */
export function usePaperStore(): PaperStore;
export function usePaperStore(options: Optional): PaperStore | null;
export function usePaperStore(id: string): PaperStore | null;
export function usePaperStore(idOrOptions?: string | Optional): PaperStore | null;
export function usePaperStore(idOrOptions?: string | Optional): PaperStore | null {
  const contextStore = useContext(PaperStoreContext);
  const { getPaperStore } = useGraphStore();
  const nullable = isRecord(idOrOptions) && idOrOptions.optional;
  const paperStoreById = useInternalData((snapshot) => {
    if (!isString(idOrOptions)) {
      return null;
    }
    if (!snapshot.papers[idOrOptions]) {
      return null;
    }
    return getPaperStore(idOrOptions) ?? null;
  });

  if (isString(idOrOptions)) {
    return paperStoreById;
  }

  if (!contextStore && !nullable) {
    throw new Error('usePaperStore must be used within a Paper or RenderElement');
  }

  return contextStore ?? null;
}

/**
 * Returns a JointJS `dia.Paper` instance wrapped in an object, from context or by paper id.
 *
 * All overloads must be used inside a `GraphProvider`.
 * Use this hook in one of three modes:
 * - with no arguments, read the current `dia.Paper` from `Paper` context
 * - with `{ optional: true }`, still read the current `dia.Paper` from `Paper` context, but return `null` paper instead of throwing when the context is missing
 * - with a paper id, read a specific paper from the graph store
 * @see https://docs.jointjs.com/learn/quickstart/paper
 * @group Hooks
 * @returns An object containing the resolved JointJS paper instance.
 * @example
 * ```tsx
 * import { usePaper } from '@joint/react';
 *
 * function PaperCanvasInfo() {
 *   const { paper } = usePaper();
 *
 *   return <span>{paper.svg.tagName}</span>;
 * }
 * ```
 * @example
 * ```tsx
 * import { usePaper } from '@joint/react';
 *
 * function OptionalPaperInfo() {
 *   const { paper } = usePaper({ optional: true });
 *
 *   if (!paper) return null;
 *
 *   return <span>{paper.svg.tagName}</span>;
 * }
 * ```
 * @example
 * ```tsx
 * import { usePaper } from '@joint/react';
 *
 * function SecondaryPaperInfo() {
 *   const { paper } = usePaper('secondary-paper');
 *
 *   return paper ? <span>{paper.svg.tagName}</span> : null;
 * }
 * ```
 */
export function usePaper(): { paper: dia.Paper };
export function usePaper(options: Optional): { paper: dia.Paper | null };
export function usePaper(id: string): { paper: dia.Paper | null };
export function usePaper(idOrOptions?: string | Optional): { paper: dia.Paper | null };
export function usePaper(idOrOptions?: string | Optional): { paper: dia.Paper | null } {
  const paperStore = usePaperStore(idOrOptions);
  return { paper: paperStore?.paper ?? null };
}
