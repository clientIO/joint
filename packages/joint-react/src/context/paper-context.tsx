import type { dia } from '@joint/core';
import { createContext } from 'react';
import type { GraphElement } from '../types/element-types';
import type { RenderElement } from '../components/paper/paper';
import type { PortsStore } from '../data/create-ports-store';

export interface PaperContext extends dia.Paper {
  renderElement?: RenderElement<GraphElement>;
  portStore: PortsStore;
}
/**
 * Paper context provides a paper instance to its children.
 * This context is internally used by the `PaperProvider` component. Use the `usePaper` hook to access the paper instead.
 * @group context
 */
export const PaperContext = createContext<PaperContext | null>(null);
