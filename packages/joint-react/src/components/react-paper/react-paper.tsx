import { useRef, useLayoutEffect, useMemo, useId, memo, type CSSProperties } from 'react';
import { dia } from '@joint/core';
import type { ReactPaperProps } from './react-paper.types';
import type { GraphElement } from '../../types/element-types';
import { ReactPaperContext } from './react-paper-context';
import { ReactPaperElement } from './react-paper-element';
import { ReactPaperLinkComponent } from './react-paper-link';
import { ControlledPaper } from '../../models/controlled-paper';
import { useGraphStore } from '../../hooks/use-graph-store';
import { useGraphStoreSelector } from '../../hooks/use-graph-store-selector';
import { CellIdContext, ReactPaperIdContext } from '../../context';
import type { PaperStoreLike } from '../../store/graph-store';

/**
 * Default dimensions
 */
const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 600;

/**
 * Base component that renders the ReactPaper.
 * @param props - ReactPaper props
 */
function ReactPaperBase<ElementItem extends GraphElement = GraphElement>(
  props: Readonly<ReactPaperProps<ElementItem>>
) {
  const {
    renderElement,
    renderLink,
    width = DEFAULT_WIDTH,
    height = DEFAULT_HEIGHT,
    className,
    style,
    gridSize = 1,
    interactive = true,
    children,
  } = props;

  // Generate unique paper ID
  const reactId = useId();
  const paperId = props.id ?? `react-paper-${reactId}`;

  const graphStore = useGraphStore();

  const { graph, getPaperStore } = graphStore;

  const paperStore = (getPaperStore(paperId) as PaperStoreLike | undefined) ?? null;
  const paper = (paperStore?.paper as ControlledPaper | undefined) ?? null;

  // Refs for SVG structure - ALL layers need refs
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const defsRef = useRef<SVGDefsElement>(null);
  const layersRef = useRef<SVGGElement>(null);
  const gridLayerRef = useRef<SVGGElement>(null);
  const backLayerRef = useRef<SVGGElement>(null);
  const cellsLayerRef = useRef<SVGGElement>(null);
  const labelsLayerRef = useRef<SVGGElement>(null);
  const frontLayerRef = useRef<SVGGElement>(null);
  const toolsLayerRef = useRef<SVGGElement>(null);

  // Select both elements and links in a single selector to ensure atomic updates
  // This prevents visual desync where elements move before links
  const { elements: elementsState, links: linksState } = useGraphStoreSelector(
    (snapshot) => ({ elements: snapshot.elements, links: snapshot.links })
  );

  // Create Paper instance (stay frozen until children register)
  // IMPORTANT: Use useLayoutEffect so this runs before children's useLayoutEffects
  useLayoutEffect(() => {
    if (!containerRef.current || !svgRef.current || !layersRef.current || !cellsLayerRef.current) {
      return;
    }

    const paperInstance = new ControlledPaper({
      el: containerRef.current,
      model: graph,
      width,
      height,
      gridSize,
      interactive,
      controlled: true,
      async: true,
      frozen: true, // CRITICAL: Stay frozen until children register their elements
      sorting: dia.Paper.sorting.APPROX,
      // Use bbox connection point with model geometry to avoid DOM-based shape detection
      // React elements don't have detectable shapes, so 'boundary' connection point fails
      defaultConnectionPoint: { name: 'bbox', args: { useModelGeometry: true } },
      // Provide React's SVG elements - this is the key to avoiding DOM duplication
      svg: svgRef.current,
      layers: layersRef.current,
      defs: defsRef.current ?? undefined,
      gridLayerElement: gridLayerRef.current ?? undefined,
      backLayerElement: backLayerRef.current ?? undefined,
      cellsLayerElement: cellsLayerRef.current,
      labelsLayerElement: labelsLayerRef.current ?? undefined,
      frontLayerElement: frontLayerRef.current ?? undefined,
      toolsLayerElement: toolsLayerRef.current ?? undefined,
      // When renderLink is not provided, let JointJS render links natively
      reactRendersLinks: !!renderLink,
    });

    // Custom render - use React's SVG structure
    paperInstance.render();

    // Register with GraphStore so flushLayoutState can read link geometry from views
    const unregisterPaper = graphStore.addReactPaper({ paper: paperInstance, paperId });
    // Unfreeze after a microtask to allow React elements to register
    // This ensures all <g> elements are in the DOM before JointJS processes them
    paperInstance.unfreeze();
    return () => {
      // Unregister from GraphStore
      unregisterPaper();

      // Don't call paper.remove() - React owns the DOM!
      // Paper.remove() would try to manipulate DOM elements that React manages.
      // Instead, just unbind events and clear references.
      paperInstance.undelegateEvents();
      paperInstance.stopListening();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- we only care if renderLink is truthy, not the function itself
  }, [graph, graphStore, paperId, width, height, gridSize, interactive, !!renderLink]);

  // Container styles
  const containerStyle = useMemo<CSSProperties>(
    () => ({
      position: 'relative',
      width,
      height,
      overflow: 'hidden',
      ...style,
    }),
    [width, height, style]
  );

  // Static styles for SVG layers (memoized to avoid inline object creation)
  const svgOverflowStyle = useMemo<CSSProperties>(() => ({ overflow: 'hidden' }), []);
  const gridLayerStyle = useMemo<CSSProperties>(() => ({ pointerEvents: 'none' }), []);
  const cellsLayerStyle = useMemo<CSSProperties>(() => ({ userSelect: 'none' }), []);
  const labelsLayerStyle = useMemo<CSSProperties>(() => ({ userSelect: 'none' }), []);

  return (
    <ReactPaperContext.Provider value={paper}>
      <ReactPaperIdContext.Provider value={paperId}>
        <div ref={containerRef} className={className} style={containerStyle}>
          <svg
            ref={svgRef}
            width={width}
            height={height}
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            style={svgOverflowStyle}
          >
            <defs ref={defsRef} />
            <g ref={layersRef} className="joint-layers">
              {/* JointJS layer structure - must match what JointJS expects */}
              <g ref={gridLayerRef} className="joint-grid-layer" style={gridLayerStyle} />
              <g ref={backLayerRef} className="joint-back-layer" />
              {/* Cells layer - React renders elements and links here */}
              <g
                ref={cellsLayerRef}
                className="joint-cells-layer joint-cells joint-viewport"
                style={cellsLayerStyle}
              >
                {/* Render links first (they should appear below elements in z-order) */}
                {renderLink &&
                  Object.entries(linksState).map(([id, link]) => (
                    <CellIdContext.Provider key={id} value={id}>
                      <ReactPaperLinkComponent {...link} id={id} render={renderLink} />
                    </CellIdContext.Provider>
                  ))}
                {/* Render elements after links */}
                {Object.entries(elementsState).map(([id, element]) => (
                  <CellIdContext.Provider key={id} value={id}>
                    <ReactPaperElement {...element} id={id} render={renderElement} />
                  </CellIdContext.Provider>
                ))}
              </g>
              <g
                ref={labelsLayerRef}
                className="joint-labels-layer joint-viewport"
                style={labelsLayerStyle}
              />
              <g ref={frontLayerRef} className="joint-front-layer" />
              <g ref={toolsLayerRef} className="joint-tools-layer" />
            </g>
          </svg>
        </div>
        {children}
      </ReactPaperIdContext.Provider>
    </ReactPaperContext.Provider>
  );
}

/**
 * ReactPaper renders graph using React DOM instead of portals.
 * Uses existing GraphProvider - just an alternative renderer.
 *
 * Key innovation: React owns and renders the entire SVG structure.
 * Pre-created `<g>` elements are provided to JointJS via ControlledPaper.
 *
 * **Same API as Paper:**
 * - `renderElement(element)` receives user data from GraphProvider
 * - `renderLink(link)` receives user data from GraphProvider
 * - Inside `renderLink`, use `useLinkLayout()` to get computed path data
 *
 * Link layouts are computed by JointJS LinkViews (same as Paper) and stored
 * in GraphStore's layoutState via flushLayoutState.
 * @group Components
 * @experimental
 */
export const ReactPaper = memo(ReactPaperBase) as <ElementItem extends GraphElement = GraphElement>(
  props: Readonly<ReactPaperProps<ElementItem>>
) => ReturnType<typeof ReactPaperBase>;
