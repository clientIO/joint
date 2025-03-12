import { dia } from '@joint/core';
import { useEffect, useState, type PropsWithChildren } from 'react';
import { ToolsViewContext } from 'src/context/tools-view.context';
import { usePaper } from 'src/hooks/use-paper';

export type ToolViewOptions = Omit<dia.ToolsView.Options, 'tools'>;

export interface ToolsViewProps extends dia.ToolsView.Options, PropsWithChildren {}
/**
 * ToolsView component
 * @see https://resources.jointjs.com/tutorial/link-tools
 */
export function ToolsView(props: ToolsViewProps) {
  const { children, ...options } = props;

  const [tool] = useState(() => new dia.ToolsView(options));
  const paper = usePaper();
  useEffect(() => {
    return () => {
      tool.remove();
    };
  }, [tool]);

  return <ToolsViewContext.Provider value={tool}>{children}</ToolsViewContext.Provider>;
}
