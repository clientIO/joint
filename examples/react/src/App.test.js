import { render, screen } from '@testing-library/react';
import App from './App';

test('renders jointjs header', () => {
  render(<App />);
  const linkElement = screen.getByText(/jointjs/i);
  expect(linkElement).toBeInTheDocument();
});
