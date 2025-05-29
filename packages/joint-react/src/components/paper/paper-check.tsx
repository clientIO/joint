/* eslint-disable sonarjs/cognitive-complexity */
import { useEffect } from 'react';
import type { GraphElement } from '../../types/element-types';
import type { PaperProps } from './paper';
import type { ReactPaperOptions } from '../paper-provider/paper-provider';

const PAPER_PROPS_NAMES: Array<keyof ReactPaperOptions> = [
  'afterRender',
  'allowLink',
  'anchorNamespace',
  'async',
  'autoFreeze',
  'background',
  'beforeRender',
  'cellViewNamespace',
  'clickThreshold',
  'connectionPointNamespace',
  'connectionStrategy',
  'connectorNamespace',
  'defaultAnchor',
  'defaultConnectionPoint',
  'defaultConnector',
  'defaultLink',
  'defaultLinkAnchor',
  'defaultRouter',
  'drawGrid',
  'drawGridSize',
  'elementView',
  'embeddingMode',
  'findParentBy',
  'frontParentOnly',
  'gridSize',
  'guard',
  'height',
  'highlighterNamespace',
  'highlighting',
  'interactive',
  'labelsLayer',
  'linkAnchorNamespace',
  'linkPinning',
  'linkView',
  'magnetThreshold',
  'markAvailable',
  'measureNode',
  'moveThreshold',
  'multiLinks',
  'onViewPostponed',
  'onViewUpdate',
  'overflow',
  'preventContextMenu',
  'preventDefaultBlankAction',
  'preventDefaultViewAction',
  'restrictTranslate',
  'routerNamespace',
  'snapLabels',
  'snapLinks',
  'snapLinksSelf',
  'sorting',
  'validateConnection',
  'validateEmbedding',
  'validateMagnet',
  'validateUnembedding',
  'viewport',
  'width',
];
/**
 * `VerifyProps` is a component that checks the properties of the Paper component in development mode.
 * This component is ignored in production mode.
 * @param props - The properties of the Paper component.
 * @returns - Returns null in production mode, or a verification component in development mode.
 */
export function PaperCheck<ElementItem extends GraphElement = GraphElement>(
  props: PaperProps<ElementItem>
) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      return;
    }
    const warnings = PAPER_PROPS_NAMES.filter((propertyName) => props[propertyName] !== undefined);
    if (warnings.length === 0) {
      return;
    }
    // eslint-disable-next-line no-console
    console.warn(
      `[Paper] The following props were set directly on \n"<Paper>": "${warnings.join(', ')}".
If you're using <PaperProvider>, these options should be defined there instead.
When"<PaperProvider> is present, any props set on <Paper> will be ignored.
If you're NOT using "<PaperProvider>", then it's perfectly fine to set options directly on <Paper>.`
    );
  }, [props]);
  return null;
}
