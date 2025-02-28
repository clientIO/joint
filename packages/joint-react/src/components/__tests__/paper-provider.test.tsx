import React from 'react';
import { render } from '@testing-library/react';
import { PaperContext } from '../../context/paper-context';
import { GraphProvider } from '../graph-provider';
import { dia } from '@joint/core';
import { PaperProvider } from '../paper-provider';

describe('paper-provider', () => {
  it('should render children and match snapshot', () => {
    const { asFragment, getByText } = render(
      <GraphProvider>
        <PaperProvider>
          <div>Paper Provider Content</div>
        </PaperProvider>
      </GraphProvider>
    );
    expect(getByText('Paper Provider Content')).toMatchSnapshot();
    expect(asFragment()).toMatchSnapshot();
  });

  it('should provide a paper instance in context', () => {
    let contextPaper: dia.Paper | undefined;
    function TestComponent() {
      contextPaper = React.useContext(PaperContext);
      return null;
    }
    render(
      <GraphProvider>
        <PaperProvider>
          <TestComponent />
        </PaperProvider>
      </GraphProvider>
    );
    expect(contextPaper).toBeInstanceOf(dia.Paper);
  });
});
