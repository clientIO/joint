import { createContext } from 'react';
import type { RenderElement } from '../components';
import type { GraphElement } from '../types/element-types';

export const RenderElementContext = createContext<RenderElement<GraphElement> | null>(null);
