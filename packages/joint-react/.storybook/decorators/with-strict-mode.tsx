/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';

export function withStrictMode(Story: any) {
  return (
    // <React.StrictMode>
    <Story />
    // </React.StrictMode>
  );
}
