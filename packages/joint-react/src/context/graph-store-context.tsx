import { createContext } from 'react';
import type { Store } from '../data/create-store';
import type { dia } from '@joint/core';
export type StoreContext<Graph extends dia.Graph = dia.Graph> = Store<Graph>;

export const GraphStoreContext = createContext<Store | undefined>(undefined);
export const GraphAreElementsMeasuredContext = createContext<boolean>(false);
