/**
 * CSS state-class names shared between TypeScript and `src/css/styles.css`.
 * Each constant must match a rule defined in `styles.css` — when adding a
 * new state class, add the rule there first.
 */


/** Applied to a cell view's root while `useMeasureNode` is hiding it. */
export const MEASURING_CLASS_NAME = 'jj-is-measuring';

/** Applied to the paper's host while a pointer drag is in progress. */
export const DRAGGING_CLASS_NAME = 'jj-is-dragging';

/** Applied to a link view while its arrowhead is being dragged. */
export const CONNECTING_CLASS_NAME = 'jj-is-connecting';

/** Applied to a link view while its arrowhead is snapped to a valid target. */
export const SNAPPED_CLASS_NAME = 'jj-is-snapped';
