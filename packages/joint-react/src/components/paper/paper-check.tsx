/* eslint-disable sonarjs/cognitive-complexity */
import { useEffect } from 'react';
import type { GraphElement } from '../../types/element-types';
import type { PaperProps } from './paper';

/**
 * `VerifyProps` is a component that checks the properties of the Paper component in development mode.
 * This component is ignored in production mode.
 * @param props - The properties of the Paper component.
 * @returns - Returns null in production mode, or a verification component in development mode.
 */
export function PaperCheck<ElementItem extends GraphElement = GraphElement>(
  props: PaperProps<ElementItem>
) {
  const {
    width,
    height,
    drawGrid,
    drawGridSize,
    background,
    labelsLayer,
    gridSize,
    highlighting,
    interactive,
    snapLabels,
    snapLinks,
    snapLinksSelf,
    markAvailable,
    validateMagnet,
    validateConnection,
    restrictTranslate,
    multiLinks,
    linkPinning,
    allowLink,
    guard,
    preventContextMenu,
    preventDefaultViewAction,
    preventDefaultBlankAction,
    clickThreshold,
    moveThreshold,
    magnetThreshold,
    elementView,
    linkView,
    measureNode,
    embeddingMode,
    frontParentOnly,
    findParentBy,
    validateEmbedding,
    validateUnembedding,
    cellViewNamespace,
    routerNamespace,
    connectorNamespace,
    highlighterNamespace,
    anchorNamespace,
    linkAnchorNamespace,
    connectionPointNamespace,
    defaultLink,
    defaultRouter,
    defaultConnector,
    defaultAnchor,
    defaultLinkAnchor,
    defaultConnectionPoint,
    connectionStrategy,
    async,
    sorting,
    autoFreeze,
    viewport,
    onViewUpdate,
    onViewPostponed,
    beforeRender,
    afterRender,
    overflow,
  } = props;

  useEffect(() => {
    // if any properties are set here, we should warn about them in development mode
    if (process.env.NODE_ENV !== 'production') {
      const warnings: string[] = [];
      if (width) warnings.push('width');
      if (height) warnings.push('height');
      if (drawGrid) warnings.push('drawGrid');
      if (drawGridSize) warnings.push('drawGridSize');
      if (background) warnings.push('background');
      if (labelsLayer) warnings.push('labelsLayer');
      if (gridSize) warnings.push('gridSize');
      if (highlighting) warnings.push('highlighting');
      if (interactive) warnings.push('interactive');
      if (snapLabels) warnings.push('snapLabels');
      if (snapLinks) warnings.push('snapLinks');
      if (snapLinksSelf) warnings.push('snapLinksSelf');
      if (markAvailable) warnings.push('markAvailable');
      if (validateMagnet) warnings.push('validateMagnet');
      if (validateConnection) warnings.push('validateConnection');
      if (restrictTranslate) warnings.push('restrictTranslate');
      if (multiLinks) warnings.push('multiLinks');
      if (linkPinning) warnings.push('linkPinning');
      if (allowLink) warnings.push('allowLink');
      if (guard) warnings.push('guard');
      if (preventContextMenu) warnings.push('preventContextMenu');
      if (preventDefaultViewAction) warnings.push('preventDefaultViewAction');
      if (preventDefaultBlankAction) warnings.push('preventDefaultBlankAction');
      if (clickThreshold !== undefined && clickThreshold !== 10) warnings.push(`clickThreshold`);
      if (moveThreshold !== undefined && moveThreshold !== 10) warnings.push(`moveThreshold `);
      if (magnetThreshold !== undefined && magnetThreshold !== 10) warnings.push(`magnetThreshold`);
      if (elementView) warnings.push('elementView');
      if (linkView) warnings.push('linkView');
      if (measureNode) warnings.push('measureNode');
      if (embeddingMode) warnings.push('embeddingMode Use context or hooks for embedding logic.');
      if (frontParentOnly) warnings.push('frontParentOnly');
      if (findParentBy) warnings.push('findParentBy');
      if (validateEmbedding) warnings.push('validateEmbedding');
      if (validateUnembedding) warnings.push('validateUnembedding');
      if (cellViewNamespace) warnings.push('cellViewNamespace');
      if (routerNamespace) warnings.push('routerNamespace');
      if (connectorNamespace) warnings.push('connectorNamespace');
      if (highlighterNamespace) warnings.push('highlighterNamespace');
      if (anchorNamespace) warnings.push('anchorNamespace');
      if (linkAnchorNamespace) warnings.push('linkAnchorNamespace');
      if (connectionPointNamespace) warnings.push('connectionPointNamespace');
      if (defaultLink) warnings.push('defaultLink');
      if (defaultRouter) warnings.push('defaultRouter');
      if (defaultConnector) warnings.push('defaultConnector');
      if (defaultAnchor) warnings.push('defaultAnchor');
      if (defaultLinkAnchor) warnings.push('defaultLinkAnchor');
      if (defaultConnectionPoint) warnings.push('defaultConnectionPoint');
      if (connectionStrategy) warnings.push('connectionStrategy');
      if (async) warnings.push('async');
      if (sorting) warnings.push('sorting');
      if (autoFreeze) warnings.push('autoFreeze');
      if (viewport) warnings.push('viewport');
      if (onViewUpdate) warnings.push('onViewUpdate');
      if (onViewPostponed) warnings.push('onViewPostponed');
      if (beforeRender) warnings.push('beforeRender');
      if (afterRender) warnings.push('afterRender');
      if (overflow) warnings.push('overflow');
      if (warnings.length > 0) {
        // eslint-disable-next-line no-console
        console.warn(
          `[Paper] The following props were set directly on "<Paper>": "${warnings.join(', ')}".
If you're using <PaperProvider>, these options should be defined there instead.
When"<PaperProvider> is present, any props set on <Paper> will be ignored.
If you're NOT using "<PaperProvider>", then it's perfectly fine to set options directly on <Paper>.`
        );
      }
    }
  }, [
    afterRender,
    allowLink,
    anchorNamespace,
    async,
    autoFreeze,
    background,
    beforeRender,
    cellViewNamespace,
    clickThreshold,
    connectionPointNamespace,
    connectionStrategy,
    connectorNamespace,
    defaultAnchor,
    defaultConnectionPoint,
    defaultConnector,
    defaultLink,
    defaultLinkAnchor,
    defaultRouter,
    drawGrid,
    drawGridSize,
    elementView,
    embeddingMode,
    findParentBy,
    frontParentOnly,
    gridSize,
    guard,
    height,
    highlighterNamespace,
    highlighting,
    interactive,
    labelsLayer,
    linkAnchorNamespace,
    linkPinning,
    linkView,
    magnetThreshold,
    markAvailable,
    measureNode,
    moveThreshold,
    multiLinks,
    onViewPostponed,
    onViewUpdate,
    overflow,
    preventContextMenu,
    preventDefaultBlankAction,
    preventDefaultViewAction,
    restrictTranslate,
    routerNamespace,
    snapLabels,
    snapLinks,
    snapLinksSelf,
    sorting,
    validateConnection,
    validateEmbedding,
    validateMagnet,
    validateUnembedding,
    viewport,
    width,
  ]);
  return null;
}
