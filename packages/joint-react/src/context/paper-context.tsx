import type { dia } from '@joint/core';
import { createContext } from 'react';
import type { RenderElement } from '../components';
import type { GraphElement } from '../types/element-types';
import { type PortsStore } from '../data/create-ports-store';
import type { PaperOptions } from '../components/paper-provider/paper-provider';

export interface PaperContextValue {
  paper: dia.Paper;
  renderElement?: RenderElement<GraphElement>;
  portStore: PortsStore;
}

export type PaperContext = [PaperContextValue, (options: PaperOptions) => void];

export const PaperContext = createContext<PaperContext | null>(null);
