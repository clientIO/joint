import type { dia } from '@joint/core';

/**
 * Context handed to a {@link ValidateEmbedding} callback while an element is
 * dragged over a candidate parent. Use it to compare the dragged `child` against
 * the `parent` it would drop into.
 * @group Types
 * @expand
 */
export interface ValidateEmbeddingParams {
  /** The element being dragged (the would-be child). */
  readonly child: { readonly id: dia.Cell.ID; readonly model: dia.Element };
  /** The element it would be embedded into (the would-be parent). */
  readonly parent: { readonly id: dia.Cell.ID; readonly model: dia.Element };
  /** The paper the elements live on. */
  readonly paper: dia.Paper;
  /** The graph the elements belong to. */
  readonly graph: dia.Graph;
}

/**
 * Context handed to a {@link ValidateUnembedding} callback when an embedded
 * element is dragged out of its parent.
 * @group Types
 * @expand
 */
export interface ValidateUnembeddingParams {
  /** The embedded element being dragged out of its parent. */
  readonly child: { readonly id: dia.Cell.ID; readonly model: dia.Element };
  /** The paper the element lives on. */
  readonly paper: dia.Paper;
  /** The graph the element belongs to. */
  readonly graph: dia.Graph;
}

/**
 * Decides whether a dragged element may be embedded into a parent element.
 * Return `true` to allow the drop, `false` to reject it. Pass it to the
 * `validateEmbedding` prop of `<Paper>`; the callback receives a structured
 * {@link ValidateEmbeddingParams} context.
 * @group Types
 * @example
 * ```tsx
 * import { GraphProvider, Paper } from '@joint/react';
 * import type { ValidateEmbedding } from '@joint/react';
 *
 * // Only "container" elements may accept children.
 * const validate: ValidateEmbedding = ({ parent }) => parent.model.get('type') === 'container';
 *
 * <GraphProvider>
 *   <Paper validateEmbedding={validate} renderElement={() => <rect width={80} height={40} />} />
 * </GraphProvider>;
 * ```
 */
export type ValidateEmbedding = (context: ValidateEmbeddingParams) => boolean;

/**
 * Decides whether an embedded element may be detached from its parent. Return
 * `true` to allow detaching, `false` to keep it embedded. Pass it to the
 * `validateUnembedding` prop of `<Paper>`; the callback receives a structured
 * {@link ValidateUnembeddingParams} context.
 * @group Types
 * @example
 * ```tsx
 * import { GraphProvider, Paper } from '@joint/react';
 * import type { ValidateUnembedding } from '@joint/react';
 *
 * // Keep "locked" elements embedded; everything else can be dragged out.
 * const validate: ValidateUnembedding = ({ child }) => !child.model.get('locked');
 *
 * <GraphProvider>
 *   <Paper validateUnembedding={validate} renderElement={() => <rect width={80} height={40} />} />
 * </GraphProvider>;
 * ```
 */
export type ValidateUnembedding = (context: ValidateUnembeddingParams) => boolean;

/**
 * Converts a `dia.ElementView` into a structured `{ id, model }` info record.
 * @param view
 */
function toEmbeddingInfo(view: dia.ElementView) {
  return { id: view.model.id, model: view.model } as const;
}

/**
 * Creates a JointJS-native `validateEmbedding` function.
 * Converts positional `(childView, parentView)` args into a structured
 * `{ child, parent, paper, graph }` context for the validate callback.
 * @param validate - Optional custom validation. Defaults to `() => true`.
 * @returns A JointJS-compatible `validateEmbedding` function.
 */
export function canEmbed(validate?: (context: ValidateEmbeddingParams) => boolean) {
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
 * @param validate - Optional custom validation. Defaults to `() => true`.
 * @returns A JointJS-compatible `validateUnembedding` function.
 */
export function canUnembed(validate?: (context: ValidateUnembeddingParams) => boolean) {
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
