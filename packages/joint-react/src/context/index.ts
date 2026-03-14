import { createContext } from 'react';
import type { CellId } from '../types/cell-id';
import type { GraphStore, PaperStore } from '../store';
import type { OnAddFeature } from '../hooks';

export const GraphStoreContext = createContext<GraphStore | null>(null);
export const PaperStoreContext = createContext<PaperStore | null>(null);

export const CellIdContext = createContext<CellId | undefined>(undefined);
export const CellIndexContext = createContext<number | undefined>(undefined);
export interface PaperFeaturesContext {
  features: Map<string, OnAddFeature<unknown>>;
}

export const PaperFeaturesContext = createContext<PaperFeaturesContext | null>(null);
