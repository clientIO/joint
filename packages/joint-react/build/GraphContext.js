import React, { useState, createContext } from 'react';
export const GraphContext = /*#__PURE__*/createContext(null);
export function GraphProvider({
  children,
  graph
}) {
  const [graphContext, setGraphContext] = useState(graph);
  return /*#__PURE__*/React.createElement(GraphContext.Provider, {
    value: [graphContext, setGraphContext]
  }, children);
}