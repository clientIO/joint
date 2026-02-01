import { useRef, useLayoutEffect, useMemo } from 'react';
import type { RenderElement } from './react-paper.types';
import { useReactPaper } from './react-paper-context';
import type { GraphElement } from '../../types/element-types';
import { REACT_TYPE } from '../../models/react-element';
import { useNodeLayout } from '../../hooks';
import typedMemo from '../../utils/typed-react';

/**
 * Props for ReactPaperElement component.
 * @group ReactPaper
 */
interface Props<T extends GraphElement> {
  /** Render function to create the element's visual representation. */
  readonly render: RenderElement<T>;
  readonly id: string;
}

/**
 * Base component that renders a graph element as an SVG group.
 * Registers with ControlledPaper for JointJS interaction handling.
 * @param props - Element data spread as individual props plus render function
 */
function ReactPaperElementBase<T extends GraphElement>(props: Readonly<Props<T>>) {
  const { render, id, ...rest } = props;
  const gRef = useRef<SVGGElement>(null);
  const paper = useReactPaper();

  useLayoutEffect(() => {
    if (!gRef.current || !paper) return;
    paper.registerExternalElement('element', gRef.current, id);
    return () => paper.unregisterExternalElement('element', id);
  }, [id, paper]);

  const { angle, height, width, x, y } = useNodeLayout();
  // @todo fix to be dynamic.
  const type = REACT_TYPE;
  const transform =
    angle === 0
      ? `translate(${x}, ${y})`
      : `translate(${x}, ${y}) rotate(${angle}, ${width / 2}, ${height / 2})`;

  const className = useMemo(() => {
    return `joint-cell joint-type-${type} joint-element joint-theme-default`;
  }, [type]);

  // Reconstruct element data for render function

  return (
    <g ref={gRef} model-id={id} data-type={type} className={className} transform={transform}>
      {render(rest as T)}
    </g>
  );
}

/**
 * Component that renders a graph element as an SVG group.
 * Registers the DOM element with ControlledPaper for JointJS interaction handling.
 * @remarks
 * This component is used internally by ReactPaper to render elements.
 * It calculates the SVG transform based on element position and rotation,
 * and generates JointJS-compatible class names for styling.
 * @group ReactPaper
 * @experimental
 */
export const ReactPaperElement = typedMemo(ReactPaperElementBase);
