import { createContext } from 'react';
import type { Store } from '../data/create-store';
export type StoreContext = Store;

export const GraphStoreContext = createContext<Store | undefined>(undefined);
