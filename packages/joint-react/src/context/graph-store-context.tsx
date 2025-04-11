import { createContext } from 'react';
import type { Store } from '../data/create-store';
export interface StoreContext extends Store {
  readonly isLoaded: boolean;
}
/**
 * Graph context provides a graph instance to its children.
 * @group context
 */
export const GraphStoreContext = createContext<StoreContext | undefined>(undefined);
