import type { dia } from '@joint/core';
import { createContext, type RefObject } from 'react';
import type { RenderElement } from '../components';
import type { GraphElement } from '../types/element-types';
import { type PortsStore } from '../data/create-ports-store';

export interface PaperContext {
  readonly paper: dia.Paper;
  readonly portsStore: PortsStore;
  readonly elementViews: Record<dia.Cell.ID, dia.ElementView>;
  readonly paperHTMLElement: RefObject<HTMLDivElement | null>;
  renderElement?: RenderElement<GraphElement>;
  renderPaper: (element: HTMLElement) => void;
}

export const PaperContext = createContext<PaperContext | null>(null);
