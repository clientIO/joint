/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import { render, waitFor } from '@testing-library/react';
import { runStorybookSnapshot } from '../../../utils/run-storybook-snapshot';
import { Custom } from '../custom';
import * as stories from '../custom.stories';
import { highlighters } from '@joint/core';
import { simpleRenderElementWrapper } from '../../../utils/test-wrappers';
runStorybookSnapshot({
  Component: Custom,
  stories,
  name: 'Highlighters/Custom',
  withRenderElementWrapper: true,
});

describe('custom highlighter', () => {
  it('should render custom highlighter', async () => {
    const { container } = render(
      <Custom
        onCreateHighlighter={(cellView, element, highlighterId, options) => {
          return highlighters.opacity.add(cellView, element, highlighterId, options);
        }}
        options={{ alphaValue: 0.5 }}
      >
        <rect id="myRect" rx={10} ry={10} width={100} height={100} fill={'blue'} />
      </Custom>,
      { wrapper: simpleRenderElementWrapper }
    );

    await waitFor(() => {
      expect(container.querySelector('rect#myRect')).toBeInTheDocument();
      expect(container.querySelector('rect#myRect')?.getAttribute('fill')).toBe('blue');
    });
  });
});
