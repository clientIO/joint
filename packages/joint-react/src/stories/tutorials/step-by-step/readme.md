

I want to create get-started story with docs.mdx, where it will have many blocks explaining how it works step by step,

<!-- - Create elements - with custom data - generic type, or infered
Create links, create links with ports
graphprovider - initial elements, initial links - that it create under the hood graph context, but it can be used with paper, and use initialelements and initial links inside the paper itself
paper, render element,
paper - make different links behaviour - so many blocks explaining that
render Element component itself, using either props from infered createElements - width and height, using measured node - which automatically update element in the background based on the children HTML or SVG element.
Ports - how to use that with groups without groups
HIghilighters
Variations of the renderElements - based on the data for example custpom data...
So there will be many code blocks provided each step, maybe each step multiple codes.... -->

- Create Elements - without generic type, so it's inferred and we can use InferElement utility to get type of element
- Create ELements with custom generic type which extends GraphElement
- Create Links - source and target as string
- Create Links - source and target as object with id
- Create Links - source and target as object with id and ports - explain why we need ports
- Explain we need to use Graph so because of that we need to use GraphProvider, but we can use same properties inside the Paper component as well
- Explain CellNamespace inside the graphProvider for custom elements
- Explain what is paper - ui component while graph is data component
- Explain how to use Paper component, and what is the renderElement prop, how we can also select the data from the renderElement via elementSelector
- Explain how to use Events inside the paper component.
- Explain useHTMLOverlay for rendering pure html elements without need of foreignObject, because by default paper renderElement inside the one svg element
- Explain how to change link behaviour

<Paper
      onLinkMouseEnter={({ linkView, paper }) => {
        paper.removeTools();
        dia.HighlighterView.removeAll(paper);
        const snapAnchor: linkTools.AnchorCallback<dia.Point> = (
          coords: dia.Point,
          endView: dia.CellView
        ) => {
          const bbox = endView.model.getBBox();
          // Find the closest point on the bbox border.
          const point = bbox.pointNearestToPoint(coords);
          const center = bbox.center();
          // Snap the point to the center of the bbox if it's close enough.
          const snapRadius = 10;
          if (Math.abs(point.x - center.x) < snapRadius) {
            point.x = center.x;
          }
          if (Math.abs(point.y - center.y) < snapRadius) {
            point.y = center.y;
          }
          return point;
        };
        const toolsView = new dia.ToolsView({
          tools: [
            new linkTools.TargetAnchor({
              snap: snapAnchor,
              resetAnchor: true,
            }),
            new linkTools.SourceAnchor({
              snap: snapAnchor,
              resetAnchor: true,
            }),
          ],
        });
        toolsView.el.classList.add('jj-flow-tools');
        linkView.addTools(toolsView);
      }}
      onLinkMouseLeave={({ linkView }) => {
        linkView.removeTools();
      }}
      gridSize={5}
      height={600}
      onElementsSizeReady={({ paper }) => {
        paper.transformToFitContent({
          padding: 40,
          useModelGeometry: true,
          verticalAlign: 'middle',
          horizontalAlign: 'middle',
        });
      }}
      width="100%"
      className={PAPER_CLASSNAME}
      renderElement={RenderFlowchartNode}
      interactive={{ linkMove: false }}
      defaultConnectionPoint={{
        name: 'anchor',
        args: {
          offset: unit * 2,
          extrapolate: true,
          useModelGeometry: true,
        },
      }}
      defaultAnchor={{
        name: 'midSide',
        args: {
          useModelGeometry: true,
        },
      }}
      defaultRouter={{
        name: 'rightAngle',
        args: {
          margin: unit * 7,
        },
      }}
      defaultConnector={{
        name: 'straight',
        args: { cornerType: 'line', cornerPreserveAspectRatio: true },
      }}
    />

    What each property does, and why we need or why we want to use it.

- Explain how to use the `onElementsSizeReady` event - and onElementsSizeChange - triggered when elements are propelry rendered inside the react itselft - measured.
- Explain how to use the `onLinkMouseEnter` and `onLinkMouseLeave` events to add custom link tools.
- Explain how to define renderElement, we have either option to use widht and height from the renderElement properties or use MeasuredNode which will automatically update the size of the element based on the children.
- Explain how to use ports API
- Explain how to use the `useHTMLOverlay` prop to render pure HTML elements without needing a `foreignObject`.
- Explain how to use the `onElementsSizeReady` event to fit the paper to the content.
It must explain to the user how to use the library, for new comer either to this new @joint/react library and explain core concepts also for jointjs - because it uses jointjs under the hood.

So change the docs.mdx and maybe add new live codes examples... :) iincluded inside the story.tsx and docs.mdx

Make it more readable and more beginners friendly explain terms used by this new library as well as the terms used by jointjs

