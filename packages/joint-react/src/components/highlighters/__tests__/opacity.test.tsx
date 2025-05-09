import { render, waitFor } from '@testing-library/react';
import { runStorybookSnapshot } from '../../../utils/run-storybook-snapshot';
import { Opacity } from '../opacity';
import * as stories from '../opacity.stories';
import { simpleRenderElementWrapper } from '../../../utils/test-wrappers';
runStorybookSnapshot({
  Component: Opacity,
  stories,
  name: 'Highlighters/Opacity',
  withRenderElementWrapper: true,
});

describe('opacity highlighter', () => {
  it('should render custom highlighter', async () => {
    const { container } = render(
      <Opacity alphaValue={0.5}>
        <rect id="myRect" rx={10} ry={10} width={100} height={100} fill={'blue'} />
      </Opacity>,
      { wrapper: simpleRenderElementWrapper }
    );

    await waitFor(() => {
      expect(container.querySelector('rect#myRect')).toBeInTheDocument();
      expect(container.querySelector('rect#myRect')?.getAttribute('fill')).toBe('blue');
    });
  });
});
