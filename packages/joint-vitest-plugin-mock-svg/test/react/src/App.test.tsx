import React from 'react';
import { test, expect } from 'vitest';
import { render } from '@testing-library/react';
import App from './App';

test('renders JointJS paper', () => {
  render(<App />);
  const paper = document.querySelector('.joint-paper');
  expect(document).toContain(paper);
  const rect = document.querySelector('.joint-element');
  expect(paper).toContain(rect);
});
