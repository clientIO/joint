import React, { createContext, useState } from 'react';
export const PaperContext = /*#__PURE__*/createContext(null);
export function PaperProvider({
  children
}) {
  const [paper, setPaper] = useState(null);
  return /*#__PURE__*/React.createElement(PaperContext.Provider, {
    value: [paper, setPaper]
  }, children);
}