import { runStorybookSnapshot } from '../../../utils/run-storybook-snapshot';
import { paperRenderElementWrapper } from '../../../utils/test-wrappers';
import { TextNode } from '../text-node';
import * as stories from '../text-node.stories';
import { render } from '@testing-library/react';
runStorybookSnapshot({
  Component: TextNode,
  name: 'TextNode',
  withRenderElementWrapper: true,
  stories,
});

describe('TextNode', () => {
  it('renders with minimal props', () => {
    render(<TextNode>hello</TextNode>, { wrapper: paperRenderElementWrapper({}) });
  });

  it('renders with width and textWrap', () => {
    render(
      <TextNode width={100} textWrap>
        hello world
      </TextNode>,
      { wrapper: paperRenderElementWrapper({}) }
    );
  });

  it('renders with height and textWrap options', () => {
    render(
      <TextNode width={100} height={40} textWrap={{ ellipsis: true, maxLineCount: 2 }}>
        hello world hello world hello world
      </TextNode>,
      { wrapper: paperRenderElementWrapper({}) }
    );
  });

  it('renders with all supported props', () => {
    render(
      <TextNode
        width={120}
        height={50}
        fill="red"
        x={10}
        textVerticalAnchor="middle"
        lineHeight={1.5}
        displayEmpty
        eol="|"
        textWrap
      >
        test all props
      </TextNode>,
      { wrapper: paperRenderElementWrapper({}) }
    );
  });
});
