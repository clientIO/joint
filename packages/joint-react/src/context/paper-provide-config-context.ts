import { createContext } from 'react';
import type { PaperContext } from './paper-context';

export interface PaperProviderConfigContext {
  /**
   * On load custom element.
   * If provided, it must return valid HTML or SVG element and it will be replaced with the default paper element.
   * So it overwrite default paper rendering.
   * It is used internally for example to render `PaperScroller` from [joint plus](https://www.jointjs.com/jointjs-plus) package.
   * @param paperCtx - The paper context
   * @returns
   */
  readonly overwriteDefaultPaperElement?: (paperCtx: PaperContext) => HTMLElement | SVGElement;
}

export const PaperProviderConfigContext = createContext<PaperProviderConfigContext | null>(null);
