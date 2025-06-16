import { render, waitFor } from '@testing-library/react';
import { runStorybookSnapshot } from '../../../utils/run-storybook-snapshot';
import { Stroke } from '../stroke';
import * as stories from '../stroke.stories';
import { simpleRenderElementWrapper } from '../../../utils/test-wrappers';
runStorybookSnapshot({
  Component: Stroke,
  stories,
  name: 'Highlighters/Stroke',
  withRenderElementWrapper: true,
});

describe('stroke highlighter', () => {
  it('should render custom highlighter', async () => {
    const { container } = render(
      <Stroke layer="top">
        <rect id="myRect" rx={10} ry={10} width={100} height={100} fill={'blue'} />
      </Stroke>,
      { wrapper: simpleRenderElementWrapper }
    );

    await waitFor(() => {
      expect(container.querySelector('rect#myRect')).toBeInTheDocument();
      expect(container.querySelector('rect#myRect')?.getAttribute('fill')).toBe('blue');
    });
  });
});
