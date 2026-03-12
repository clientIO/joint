import { dia, mvc } from '@joint/core';
import { useLayoutEffect, type DependencyList, type RefObject } from 'react';
import type { PaperEventHandlers } from '../types/event.types';
import { usePaper, usePaperStore } from './use-paper';
import { useRefValue } from './use-ref-value';

const EMPTY_DEPENDENCIES: DependencyList = [];

type PaperValueTarget = dia.Paper | null | undefined;
type PaperRefTarget = RefObject<dia.Paper | null | undefined>;
type PaperTarget = PaperRefTarget | PaperValueTarget | string;

/**
 * Checks if value is a paper ref object.
 * @param value - Candidate value.
 * @returns True when value is a ref object with `current`.
 */
function isPaperRef(value: unknown): value is PaperRefTarget {
  return !!value && typeof value === 'object' && 'current' in value;
}

/**
 * Checks if value is a JointJS paper instance.
 * @param value - Candidate value.
 * @returns True when value is a paper instance.
 */
function isPaperInstance(value: unknown): value is dia.Paper {
  return value instanceof dia.Paper;
}

/**
 * Resolves the active paper instance from supported target forms.
 * @param target - Explicit paper target (ref or id).
 * @param paperFromRef - Paper resolved from ref mode.
 * @param paperById - Paper resolved from id mode.
 * @returns Resolved paper instance or null.
 */
function resolvePaperTarget(
  target: PaperTarget,
  paperFromRef: dia.Paper | null | undefined,
  paperById: dia.Paper | null
): dia.Paper | null {
  if (isPaperRef(target)) {
    return paperFromRef ?? null;
  }

  if (isPaperInstance(target)) {
    return target;
  }

  if (typeof target === 'string') {
    return paperById;
  }

  return null;
}

/**
 * Subscribes all handlers to a paper using mvc.Listener.
 * @param paper - Paper instance to subscribe on.
 * @param handlers - Event handlers keyed by JointJS event names.
 * @returns Cleanup callback that stops all listeners.
 */
function subscribeToPaperEvents(paper: dia.Paper, handlers: PaperEventHandlers): () => void {
  const controller = new mvc.Listener();

  for (const eventName in handlers) {
    const handler = handlers[eventName];
    if (!handler) continue;

    controller.listenTo(paper, eventName, (...args: Parameters<mvc.EventHandler>) => {
      handler(...args);
    });
  }

  return () => controller.stopListening();
}

/**
 * Subscribes to paper events using original JointJS event names.
 * @param handlers - Event handlers map keyed by JointJS paper event names.
 * @param dependencies - Optional dependencies controlling re-subscription.
 * @group Hooks
 */
export function usePaperEvents(handlers: PaperEventHandlers, dependencies?: DependencyList): void;
export function usePaperEvents(
  target: PaperRefTarget | PaperValueTarget | string,
  handlers: PaperEventHandlers,
  dependencies?: DependencyList
): void;
export function usePaperEvents(
  targetOrHandlers: PaperTarget | PaperEventHandlers,
  handlersOrDependencies: PaperEventHandlers | DependencyList = EMPTY_DEPENDENCIES,
  dependenciesArgument: DependencyList = EMPTY_DEPENDENCIES
): void {
  const isContextForm = Array.isArray(handlersOrDependencies);
  const contextStore = usePaperStore(true);

  if (isContextForm && !contextStore) {
    throw new Error('usePaperEvents without a target must be used within a Paper.');
  }

  const target = isContextForm ? null : (targetOrHandlers as PaperTarget);
  const targetRef = target && isPaperRef(target) ? target : undefined;
  const paperFromRef = useRefValue(targetRef);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const paperById = typeof target === 'string' ? usePaper(target) : usePaper(true);
  const handlers = isContextForm
    ? (targetOrHandlers as PaperEventHandlers)
    : (handlersOrDependencies as PaperEventHandlers);

  const dependencies = isContextForm
    ? (handlersOrDependencies as DependencyList)
    : dependenciesArgument;

  const paper = isContextForm
    ? (contextStore?.paper ?? null)
    : resolvePaperTarget(target as PaperTarget, paperFromRef, paperById);

  useLayoutEffect(() => {
    if (!paper) {
      return;
    }

    return subscribeToPaperEvents(paper, handlers);
    // Dependencies are explicit API contract for this hook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paper, handlers, ...dependencies]);
}
