import type { dia } from '@joint/core';
import { createContext } from 'react';
import type { GraphElementBase } from '../types/element-types';
import type { RenderElement } from '../components/paper/paper';

export interface PaperContext extends dia.Paper {
  renderElement?: RenderElement<GraphElementBase>;
}
/**
 * Paper context provides a paper instance to its children.
 * This context is internally used by the `PaperProvider` component. Use the `usePaper` hook to access the paper instead.
 * @group context
 */
export const PaperContext = createContext<PaperContext | undefined>(undefined);
