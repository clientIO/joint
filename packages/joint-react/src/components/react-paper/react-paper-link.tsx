import { useRef, useLayoutEffect, memo } from 'react';
import { useReactPaper } from './react-paper-context';
import type { GraphLink } from '../../types/link-types';
import type { RenderLink } from './react-paper.types';

/**
 * Props for ReactPaperLinkComponent.
 * @group ReactPaper
 */
interface Props extends GraphLink {
  /** Link data from GraphProvider. */
  readonly id: string;
  /** Render function that receives the link data. Use useLinkLayout() inside to get path data. */
  readonly render: RenderLink;
}

/**
 * Base component that renders a graph link as an SVG group.
 * Registers with ControlledPaper for JointJS interaction handling.
 * The render function receives user data; use useLinkLayout() inside for path data.
 * @param root0
 * @param root0.link
 * @param root0.render
 */
function ReactPaperLinkComponentBase({ id, render, ...link }: Readonly<Props>) {
  const gRef = useRef<SVGGElement>(null);
  const paper = useReactPaper();

  useLayoutEffect(() => {
    if (!gRef.current || !paper) return;
    paper.registerExternalElement('link', gRef.current, id);
    return () => paper.unregisterExternalElement('link', id);
  }, [id, paper]);

  return (
    <g
      ref={gRef}
      model-id={id}
      data-type="ReactPaperLink"
      className="joint-cell joint-type-reactpaperlink joint-link joint-theme-default"
    >
      {render(link)}
    </g>
  );
}

/**
 * Component that renders a graph link as an SVG group.
 * Registers the DOM element with ControlledPaper for JointJS interaction handling.
 * @remarks
 * This component receives user link data from GraphProvider.
 * Inside the render function, use `useLinkLayout()` to get computed path data
 * (sourceX, sourceY, targetX, targetY, d, vertices).
 * @group ReactPaper
 * @experimental
 */
export const ReactPaperLinkComponent = memo(ReactPaperLinkComponentBase);
