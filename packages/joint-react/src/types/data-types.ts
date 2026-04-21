import type { dia } from '@joint/core';
import type { ElementPort,  } from '../presets/element-ports';
import type { LinkStyle } from '../presets/link-style';
import type { LinkLabel } from '../presets/link-labels';
import type { ElementPosition, ElementSize } from './cell-data';



// ── Element Types ─────────────────────────────────────────────────────────────

/**
 * Element data record — supports both declarative (portMap) and native JointJS (ports) formats.
 *
 * Extends `dia.Element.Attributes` so all JointJS properties pass through.
 * Declarative fields (`portMap`, `portStyle`) are converted to native `ports` by the mapper.
 * @group Graph
 */
export interface ElementRecord<D extends object = Record<string, unknown>>
  extends Omit<dia.Element.Attributes, 'position' | 'size'> {
  /** Position of the element. Fields default to 0 when omitted. */
  position?: ElementPosition;
  /** Size of the element. Fields use defaults when omitted. */
  size?: ElementSize;
  /** Custom user data. */
  data?: D;
  /** Declarative port definitions keyed by port ID. Converted to native `ports` by the mapper. */
  portMap?: Record<string, ElementPort>;
  /** Style defaults applied to all ports in `portMap`. Individual port properties take precedence. */
  portStyle?: Partial<ElementPort>;
}

// ── Link Types ────────────────────────────────────────────────────────────────

/**
 * Link data record — supports both declarative (labelMap, style) and native JointJS (labels, attrs) formats.
 *
 * Extends `dia.Link.Attributes` so all JointJS properties pass through.
 * Declarative fields (`labelMap`, `style`, `labelStyle`) are converted to native `labels`/`attrs` by the mapper.
 * @group Graph
 */
export interface LinkRecord<D extends object = Record<string, unknown>>
  extends dia.Link.Attributes {
  /** Custom user data. */
  data?: D;
  /** Declarative link style (color, width, markers, etc.). Converted to native `attrs` by the mapper. */
  style?: LinkStyle;
  /** Style defaults applied to all labels in `labelMap`. Individual label properties take precedence. */
  labelStyle?: Partial<LinkLabel>;
  /** Declarative label definitions keyed by label ID. Converted to native `labels` array by the mapper. */
  labelMap?: Record<string, LinkLabel>;
}

// ── Container Types (internal) ───────────────────────────────────────────────

/**
 * Adds guaranteed layout fields to element data.
 * Used internally by graph-view containers and returned by hooks like `useElement`.
 * @group Graph
 */
export type ElementWithLayout<E extends object = Record<string, unknown>> = ElementRecord<E> & {
  data: E;
  position: Required<ElementPosition>;
  size: Required<ElementSize>;
  angle: number;
};

export {type PortShape, type ElementPort} from '../presets/element-ports';
export {type LinkStyle} from '../presets/link-style';
export {type LinkLabel} from '../presets/link-labels';