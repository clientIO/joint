import type { dia } from '@joint/core';
import { createContext, type RefObject } from 'react';
import type { RenderElement } from '../components';
import type { GraphElement } from '../types/element-types';
import { type PortsStore } from '../data/create-ports-store';

export interface PaperContext {
  paper: dia.Paper;
  renderElement?: RenderElement<GraphElement>;
  portsStore: PortsStore;
  recordOfSVGElements: Record<dia.Cell.ID, SVGElement>;
  paperHTMLElement: RefObject<HTMLDivElement | null>;
}

export const PaperContext = createContext<PaperContext | null>(null);
