export * from './port-group-context';
import { createContext } from 'react';
import type { CellId } from '../types/cell-id';
import type { GraphStore, PaperStore } from '../store';

export interface PaperConfig {
  /** The id of the paper. */
  alternateId: string;
}
export const GraphStoreContext = createContext<GraphStore | null>(null);
export const PaperStoreContext = createContext<PaperStore | null>(null);
export const PaperConfigContext = createContext<PaperConfig | null>(null);
export const CellIdContext = createContext<CellId | undefined>(undefined);
export const CellIndexContext = createContext<number | undefined>(undefined);
