/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';

export function withStringMode(Story: any) {
  return (
    <React.StrictMode>
      <Story />
    </React.StrictMode>
  );
}
