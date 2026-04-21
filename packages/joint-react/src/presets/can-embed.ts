import type { dia } from '@joint/core';

/** Context passed to the `canEmbed` validate callback. */
export interface ValidateEmbeddingContext {
  /** The element being embedded (dragged). */
  readonly child: { readonly id: dia.Cell.ID; readonly model: dia.Element };
  /** The candidate parent element. */
  readonly parent: { readonly id: dia.Cell.ID; readonly model: dia.Element };
  /** The paper instance. */
  readonly paper: dia.Paper;
  /** The graph instance. */
  readonly graph: dia.Graph;
}

/** Context passed to the `canUnembed` validate callback. */
export interface ValidateUnembeddingContext {
  /** The element being unembedded. */
  readonly child: { readonly id: dia.Cell.ID; readonly model: dia.Element };
  /** The paper instance. */
  readonly paper: dia.Paper;
  /** The graph instance. */
  readonly graph: dia.Graph;
}

function toEmbeddingInfo(view: dia.ElementView) {
  return { id: view.model.id, model: view.model } as const;
}

/**
 * Creates a JointJS-native `validateEmbedding` function.
 * Converts positional `(childView, parentView)` args into a structured
 * `{ child, parent, paper, graph }` context for the validate callback.
 *
 * @param validate - Optional custom validation. Defaults to `() => true`.
 * @returns A JointJS-compatible `validateEmbedding` function.
 *
 * @example
 * ```ts
 * paper.options.validateEmbedding = canEmbed(
 *   ({ parent }) => parent.model.get('type') === 'container'
 * );
 * ```
 */
export function canEmbed(validate?: (context: ValidateEmbeddingContext) => boolean) {
  if (!validate) return () => true;
  return (childView: dia.ElementView, parentView: dia.ElementView): boolean => {
    const paper = childView.paper!;
    return validate({
      child: toEmbeddingInfo(childView),
      parent: toEmbeddingInfo(parentView),
      paper,
      graph: paper.model,
    });
  };
}

/**
 * Creates a JointJS-native `validateUnembedding` function.
 * Converts the positional `(childView)` arg into a structured
 * `{ child, paper, graph }` context for the validate callback.
 *
 * @param validate - Optional custom validation. Defaults to `() => true`.
 * @returns A JointJS-compatible `validateUnembedding` function.
 *
 * @example
 * ```ts
 * paper.options.validateUnembedding = canUnembed(
 *   ({ child }) => !child.model.get('locked')
 * );
 * ```
 */
export function canUnembed(validate?: (context: ValidateUnembeddingContext) => boolean) {
  if (!validate) return () => true;
  return (childView: dia.ElementView): boolean => {
    const paper = childView.paper!;
    return validate({
      child: toEmbeddingInfo(childView),
      paper,
      graph: paper.model,
    });
  };
}
