import { render, waitFor } from '@testing-library/react';
import { runStorybookSnapshot } from '../../../utils/run-storybook-snapshot';
import { Mask } from '../mask';
import * as stories from '../mask.stories';
import { simpleRenderElementWrapper } from '../../../utils/test-wrappers';
runStorybookSnapshot({
  Component: Mask,
  stories,
  name: 'Highlighters/Mask',
  withRenderElementWrapper: true,
});

describe('mask highlighter', () => {
  it('should render custom highlighter', async () => {
    const { container } = render(
      <Mask padding={10} stroke={'red'} strokeWidth={5} strokeLinejoin={'bevel'}>
        <rect id="myRect" rx={10} ry={10} width={100} height={100} fill={'blue'} />
      </Mask>,
      { wrapper: simpleRenderElementWrapper }
    );

    await waitFor(() => {
      expect(container.querySelector('rect#myRect')).toBeInTheDocument();
      expect(container.querySelector('rect#myRect')?.getAttribute('fill')).toBe('blue');
    });
  });
});
